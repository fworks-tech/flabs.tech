"use client";

import { useCallback, useSyncExternalStore } from "react";

const BEST_SCORE_KEY = "devsprint.bestScore";
const BEST_STREAK_KEY = "devsprint.bestStreak";
const PLAYER_NAME_KEY = "devsprint.playerName";

interface HighScoreState {
  bestScore: number;
  bestStreak: number;
  playerName: string;
}

const DEFAULT_STATE: HighScoreState = { bestScore: 0, bestStreak: 0, playerName: "" };

let state: HighScoreState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function readNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function readName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PLAYER_NAME_KEY) ?? "";
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = {
      bestScore: readNumber(BEST_SCORE_KEY),
      bestStreak: readNumber(BEST_STREAK_KEY),
      playerName: readName(),
    };
    loaded = true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): HighScoreState {
  ensureLoaded();
  return state;
}

const getServerSnapshot = (): HighScoreState => DEFAULT_STATE;

function mutate(next: HighScoreState) {
  state = next;
  for (const listener of listeners) listener();
}

/** Test helper: forgets the in-memory cache so storage is re-read. */
export function resetHighScoreStoreForTests() {
  state = DEFAULT_STATE;
  loaded = false;
}

/**
 * Best-score persistence in localStorage, exposed via a tiny external
 * store so reads stay SSR-safe and synchronous.
 */
export function useHighScore() {
  const { bestScore, bestStreak, playerName } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const submitScore = useCallback((score: number, streak: number) => {
    if (typeof window === "undefined") return;
    const next: HighScoreState = {
      bestScore: score > state.bestScore ? score : state.bestScore,
      bestStreak: streak > state.bestStreak ? streak : state.bestStreak,
      playerName: state.playerName,
    };
    window.localStorage.setItem(BEST_SCORE_KEY, String(next.bestScore));
    window.localStorage.setItem(BEST_STREAK_KEY, String(next.bestStreak));
    mutate(next);
  }, []);

  const setPlayerName = useCallback((name: string) => {
    if (typeof window === "undefined") return;
    const next = name.slice(0, 20);
    window.localStorage.setItem(PLAYER_NAME_KEY, next);
    mutate({ ...state, playerName: next });
  }, []);

  return { bestScore, bestStreak, playerName, submitScore, setPlayerName };
}
