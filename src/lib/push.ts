/**
 * Server-side push notification helper.
 * Sends to ALL subscribed devices for a user (multi-device support).
 */
import { createAdminClient } from "./supabase/admin";

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const [{ data: subs, error: dbErr }, { count: unread }] = await Promise.all([
    admin.from("push_subscriptions").select("id, subscription").eq("user_id", userId),
    admin.from("messages").select("id", { count: "exact", head: true })
      .eq("receiver_id", userId).is("read_at", null),
  ]);

  if (dbErr) return { ok: false, error: `DB error: ${dbErr.message}` };
  if (!subs || subs.length === 0) return { ok: false, error: "No subscription found for user" };

  const badge = Math.max(1, unread ?? 0);

  const webpush = await import("web-push");

  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!vapidSubject || !vapidPublic || !vapidPrivate) {
    return { ok: false, error: "VAPID keys not configured (VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)" };
  }

  // VAPID_SUBJECT must start with mailto: or https://
  if (!vapidSubject.startsWith("mailto:") && !vapidSubject.startsWith("https://")) {
    return { ok: false, error: `VAPID_SUBJECT must start with 'mailto:' or 'https://', got: ${vapidSubject}` };
  }

  webpush.default.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const payload = JSON.stringify({ title, body, url, badge });
  const staleIds: string[] = [];
  let anyOk = false;

  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.default.sendNotification(
          row.subscription as Parameters<typeof webpush.default.sendNotification>[0],
          payload,
        );
        anyOk = true;
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid: mark for cleanup
          staleIds.push(row.id);
        } else {
          console.error(`[push] sendNotification failed for user ${userId}:`, error.message);
        }
      }
    })
  );

  // Clean up stale subscriptions
  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  return anyOk
    ? { ok: true }
    : { ok: false, error: "All subscriptions failed or were stale" };
}
