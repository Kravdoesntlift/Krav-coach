"use client";

import { useEffect } from "react";
import { useOfflineSync } from "@/hooks/useOfflineQueue";

export default function ServiceWorkerRegister() {
  const { sync } = useOfflineSync();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.error("[SW] Registration failed:", err));

    // Listen for SYNC_QUEUE messages from the service worker (background sync)
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_QUEUE") {
        void sync();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [sync]);

  return null;
}
