"use client";

import { useEffect } from "react";
import { useOfflineSync } from "@/hooks/useOfflineQueue";

export default function ServiceWorkerRegister() {
  const { sync } = useOfflineSync();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // When a new SW installs, trigger SKIP_WAITING once it's done installing.
        // We do this AFTER install completes (not inside the install event itself)
        // to avoid the abrupt mid-session SW takeover that breaks push subscriptions on iOS.
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Old SW is still controlling — new SW installed and waiting.
              // Post SKIP_WAITING so it activates on next page navigation.
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
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
