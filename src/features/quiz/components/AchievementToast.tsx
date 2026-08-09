"use client";

import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

import {
  ACHIEVEMENTS,
  type AchievementId,
} from "@/features/quiz/hooks/useAchievements";

interface AchievementToastProps {
  newlyUnlocked: AchievementId[];
}

/** Fires a notification per freshly unlocked achievement (deduped by key). */
export function AchievementToast({ newlyUnlocked }: AchievementToastProps) {
  const key = newlyUnlocked.join(",");

  useEffect(() => {
    for (const id of newlyUnlocked) {
      const meta = ACHIEVEMENTS.find((a) => a.id === id);
      if (!meta) continue;
      notifications.show({
        title: `Achievement unlocked: ${meta.label}`,
        message: meta.description,
        color: "grape",
        autoClose: 4500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
