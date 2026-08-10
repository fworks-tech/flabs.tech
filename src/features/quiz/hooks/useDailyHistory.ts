'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { loadDailyHistory, saveDailyAttempt, type DailyAttempt } from '@/features/quiz/lib/daily';

let history: DailyAttempt[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (!loaded && typeof window !== 'undefined') {
    history = loadDailyHistory();
    loaded = true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DailyAttempt[] {
  ensureLoaded();
  return history;
}

const getServerSnapshot = (): DailyAttempt[] => [];

function mutate(next: DailyAttempt[]) {
  history = next;
  for (const listener of listeners) listener();
}

/** Test helper: forgets the in-memory cache so storage is re-read. */
export function resetDailyStoreForTests() {
  history = [];
  loaded = false;
}

/**
 * Daily-attempt history from localStorage via a tiny external store, so
 * reads stay SSR-safe (useSyncExternalStore hydrates with the server
 * snapshot) and every consumer re-renders when an attempt is recorded.
 */
export function useDailyHistory() {
  const attempts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recordAttempt = useCallback((attempt: DailyAttempt) => {
    if (typeof window === 'undefined') return;
    mutate(saveDailyAttempt(attempt));
  }, []);

  return { attempts, recordAttempt };
}
