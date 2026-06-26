"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const QUEUE_KEY = "krav_offline_queue";

export interface OfflineQueueItem {
  id: string;
  type: "completion" | "undo_completion";
  data: {
    client_id: string;
    day_id: string;
    feeling?: string;
    note?: string | null;
  };
  queuedAt: string;
}

// ── Helpers (usable outside React) ───────────────────────────────────────────

export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setOfflineQueue(items: OfflineQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueOfflineAction(
  type: OfflineQueueItem["type"],
  data: OfflineQueueItem["data"]
) {
  const queue = getOfflineQueue();
  const item: OfflineQueueItem = {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : Date.now().toString(),
    type,
    data,
    queuedAt: new Date().toISOString(),
  };
  setOfflineQueue([...queue, item]);
  // Ask SW to sync when connection returns
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((reg) => (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register("sync-krav-actions"))
      .catch(() => {});
  }
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useOfflineSync() {
  const sync = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    const supabase = createClient();
    const remaining: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === "completion") {
          const { error } = await supabase.from("workout_completions").insert({
            client_id: item.data.client_id,
            day_id: item.data.day_id,
            feeling: item.data.feeling ?? null,
            note: item.data.note ?? null,
          });
          // Ignore duplicate key errors (already synced)
          if (error && !error.message.includes("duplicate") && !error.code?.includes("23505")) {
            remaining.push(item);
          }
        } else if (item.type === "undo_completion") {
          const { error } = await supabase
            .from("workout_completions")
            .delete()
            .eq("client_id", item.data.client_id)
            .eq("day_id", item.data.day_id);
          if (error) remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    setOfflineQueue(remaining);
  }, []);

  useEffect(() => {
    // Drain queue on mount
    void sync();
    // And whenever connection is restored
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [sync]);

  return { sync };
}
