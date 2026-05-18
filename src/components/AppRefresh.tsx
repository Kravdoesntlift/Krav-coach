"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * PWA auto-refresh: reloads the page when the app comes back to the
 * foreground after being hidden for more than 5 minutes. This mimics
 * native app behaviour and replaces the disabled pull-to-refresh.
 */
export default function AppRefresh() {
  const router = useRouter();

  useEffect(() => {
    let hiddenAt: number | null = null;
    const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (document.visibilityState === "visible" && hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt;
        hiddenAt = null;
        if (elapsed >= THRESHOLD_MS) {
          router.refresh();
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  return null;
}
