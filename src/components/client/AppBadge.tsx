"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

export default function AppBadge({ userId }: Props) {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    const supabase = createClient();

    async function updateBadge() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .is("read_at", null);

      if (count && count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }

    updateBadge();

    // Atualiza em tempo real quando chegam novas mensagens
    const channel = supabase
      .channel("badge-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
        () => updateBadge()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return null;
}
