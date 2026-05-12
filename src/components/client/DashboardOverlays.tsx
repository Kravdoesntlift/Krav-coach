"use client";

import { useState } from "react";
import WelcomeBanner from "./WelcomeBanner";
import AchievementUnlockModal from "./AchievementUnlockModal";
import type { Achievement } from "@/lib/achievements";

interface Props {
  // WelcomeBanner
  clientName: string;
  coachName: string;
  coachTagline?: string | null;
  coachId?: string | null;
  welcomed: boolean;
  // AchievementUnlockModal
  achievements: Achievement[];
  seenAchievements: string[];
}

export default function DashboardOverlays({
  welcomed,
  achievements,
  seenAchievements,
  clientName,
  coachName,
  coachTagline,
  coachId,
}: Props) {
  // If already welcomed (returning user), go straight to achievements if any
  const [welcomeDone, setWelcomeDone] = useState(welcomed);

  return (
    <>
      <WelcomeBanner
        clientName={clientName}
        coachName={coachName}
        coachTagline={coachTagline}
        coachId={coachId}
        welcomed={welcomed}
        onClose={() => setWelcomeDone(true)}
      />
      {/* Only render achievements after welcome banner is dismissed */}
      {welcomeDone && (
        <AchievementUnlockModal
          achievements={achievements}
          seenAchievements={seenAchievements}
        />
      )}
    </>
  );
}
