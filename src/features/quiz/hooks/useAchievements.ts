"use client";

import { useCallback, useSyncExternalStore } from "react";

export const ACHIEVEMENTS_KEY = "devsprint.achievements";

export const ACHIEVEMENTS = [
  { id: "first_blood", label: "First blood", description: "Complete your first game." },
  { id: "perfect", label: "Perfect 20", description: "Answer all 20 questions correctly." },
  {
    id: "speed_demon",
    label: "Speed demon",
    description: "10+ correct answers with a 5s average — lightning fast.",
  },
  {
    id: "comeback",
    label: "Comeback",
    description: "Finish the deck with only 1 life left.",
  },
  {
    id: "sharpshooter",
    label: "Sharpshooter",
    description: "Finish with at least 80% accuracy.",
  },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

export interface AchievementStats {
  correctCount: number;
  total: number;
  livesLeft: number;
  /** Average time per answered question in ms (excludes timeouts). */
  averageTimeMs: number;
  /** True when the deck was completed (did not run out of lives). */
  completed: boolean;
}

/**
 * Pure unlock rules. Returns the achievements earned for a finished game.
 */
export function evaluateAchievements(stats: AchievementStats): AchievementId[] {
  const earned: AchievementId[] = [];
  if (stats.total > 0) earned.push("first_blood");
  if (stats.correctCount === stats.total && stats.total > 0) earned.push("perfect");
  if (stats.correctCount >= 10 && stats.averageTimeMs > 0 && stats.averageTimeMs <= 5000) {
    earned.push("speed_demon");
  }
  if (stats.completed && stats.livesLeft === 1) earned.push("comeback");
  if (stats.total > 0 && stats.correctCount / stats.total >= 0.8) earned.push("sharpshooter");
  return earned;
}

const DEFAULT_UNLOCKED: AchievementId[] = [];

let unlocked: AchievementId[] = DEFAULT_UNLOCKED;
let loaded = false;
const listeners = new Set<() => void>();

function readUnlocked(): AchievementId[] {
  if (typeof window === "undefined") return DEFAULT_UNLOCKED;
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return DEFAULT_UNLOCKED;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_UNLOCKED;
    return parsed.filter(
      (id): id is AchievementId =>
        typeof id === "string" && ACHIEVEMENTS.some((a) => a.id === id),
    );
  } catch {
    return DEFAULT_UNLOCKED;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    unlocked = readUnlocked();
    loaded = true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AchievementId[] {
  ensureLoaded();
  return unlocked;
}

const getServerSnapshot = (): AchievementId[] => DEFAULT_UNLOCKED;

function mutate(next: AchievementId[]) {
  unlocked = next;
  for (const listener of listeners) listener();
}

/** Test helper: forgets the in-memory cache so storage is re-read. */
export function resetAchievementsStoreForTests() {
  unlocked = DEFAULT_UNLOCKED;
  loaded = false;
}

/**
 * localStorage achievement store. `unlock` persists new achievements and
 * returns ONLY the newly unlocked ids (for the toast), so replays never
 * re-toast an already-earned achievement.
 */
export function useAchievements() {
  const earned = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unlock = useCallback((ids: AchievementId[]): AchievementId[] => {
    if (typeof window === "undefined") return [];
    const known = readUnlocked();
    const fresh = ids.filter((id) => !known.includes(id));
    if (fresh.length === 0) return [];
    const next = [...known, ...fresh];
    window.localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(next));
    mutate(next);
    return fresh;
  }, []);

  return { unlocked: earned, unlock };
}
