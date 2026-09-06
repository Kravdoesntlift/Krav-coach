"use client";

import { useState, useEffect } from "react";
import OnboardingModal from "./OnboardingModal";

export default function OnboardingWrapper({ clientId, isComplete }: { clientId: string; isComplete: boolean }) {
  // Key is per-client so different clients on same device each see the modal
  const lsKey = `krav_onboarding_done_${clientId}`;

  // Start as "done" to avoid flash: we'll reveal the modal only after
  // confirming localStorage doesn't have the key
  const [show, setShow] = useState(false);

  useEffect(() => {
    // If server says onboarding is done, skip localStorage check entirely
    if (isComplete) return;
    try {
      const done = localStorage.getItem(lsKey);
      if (!done) setShow(true);
    } catch {
      // localStorage blocked (private browsing etc.): don't show modal
    }
  }, [lsKey, isComplete]);

  function handleComplete() {
    try { localStorage.setItem(lsKey, "1"); } catch { /* ignore */ }
    setShow(false);
  }

  if (!show) return null;
  return <OnboardingModal clientId={clientId} onComplete={handleComplete} />;
}
