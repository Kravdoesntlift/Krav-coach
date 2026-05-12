/**
 * Server-side push notification helper.
 * Can be called from server actions and API routes.
 */
import { createAdminClient } from "./supabase/admin";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const [{ data: sub, error: dbErr }, { count: unread }] = await Promise.all([
    admin.from("push_subscriptions").select("subscription").eq("user_id", userId).maybeSingle(),
    admin.from("messages").select("id", { count: "exact", head: true })
      .eq("receiver_id", userId).is("read_at", null),
  ]);

  if (dbErr) return { ok: false, error: `DB error: ${dbErr.message}` };
  if (!sub?.subscription) return { ok: false, error: "No subscription found" };

  const badge = (unread ?? 0) + 1;

  const webpush = await import("web-push");
  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  try {
    await webpush.default.sendNotification(
      sub.subscription as Parameters<typeof webpush.default.sendNotification>[0],
      JSON.stringify({ title, body, url, badge }),
    );
    return { ok: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410) {
      await admin.from("push_subscriptions").delete().eq("user_id", userId);
      return { ok: false, error: "Subscription expired (410), cleaned up" };
    }
    return { ok: false, error: error.message ?? "Unknown webpush error" };
  }
}
