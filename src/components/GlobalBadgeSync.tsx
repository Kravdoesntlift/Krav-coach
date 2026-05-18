"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the PWA app icon badge in sync with the actual unread message count.
 * Mount this once in every authenticated layout (coach + client).
 * It replaces the per-page AppBadge pattern and clears the badge on any page load.
 */
export default function GlobalBadgeSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    const supabase = createClient();

    async function syncBadge() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .is("read_at", null);

      if ((count ?? 0) > 0) {
        navigator.setAppBadge(count!).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }

    // Sync on mount (clears stale badge when user opens the app)
    syncBadge();

    // Sync when returning from background
    const onVisible = () => { if (document.visibilityState === "visible") syncBadge(); };
    document.addEventListener("visibilitychange", onVisible);

    // Sync in real-time as messages arrive / are read
    const channel = supabase
      .channel(`badge-sync-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
        syncBadge,
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
