import { afterEach, describe, expect, it } from 'vitest';

import {
  computeDailyStreak,
  loadDailyHistory,
  saveDailyAttempt,
  shiftDate,
  todayKey,
  type DailyAttempt,
} from '@/features/quiz/lib/daily';

afterEach(() => {
  window.localStorage.clear();
});

describe('todayKey', () => {
  it('returns the UTC day key aligned with dailyQuestion', () => {
    expect(todayKey(new Date('2026-08-09T23:59:59Z'))).toBe('2026-08-09');
    expect(todayKey(new Date('2026-08-10T00:00:00Z'))).toBe('2026-08-10');
  });
});

describe('shiftDate', () => {
  it('moves forward and backward across month/year boundaries', () => {
    expect(shiftDate('2026-08-09', -1)).toBe('2026-08-08');
    expect(shiftDate('2026-08-01', -1)).toBe('2026-07-31');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('computeDailyStreak', () => {
  const attempt = (date: string, correct: boolean): DailyAttempt => ({
    date,
    questionId: 'q1',
    selectedIndex: 0,
    correct,
  });

  it('is 0 with no history', () => {
    expect(computeDailyStreak([], '2026-08-09')).toBe(0);
  });

  it('counts consecutive correct days ending today', () => {
    const history = [
      attempt('2026-08-07', true),
      attempt('2026-08-08', true),
      attempt('2026-08-09', true),
    ];
    expect(computeDailyStreak(history, '2026-08-09')).toBe(3);
  });

  it('breaks on a wrong answer', () => {
    const history = [
      attempt('2026-08-07', true),
      attempt('2026-08-08', false),
      attempt('2026-08-09', true),
    ];
    expect(computeDailyStreak(history, '2026-08-09')).toBe(1);
  });

  it('counts from yesterday when today is still unplayed', () => {
    const history = [attempt('2026-08-07', true), attempt('2026-08-08', true)];
    expect(computeDailyStreak(history, '2026-08-09')).toBe(2);
  });

  it('breaks on a gap in days', () => {
    const history = [attempt('2026-08-06', true), attempt('2026-08-08', true)];
    expect(computeDailyStreak(history, '2026-08-08')).toBe(1);
  });
});

describe('daily history persistence', () => {
  it('replaces the same day and keeps history sorted', () => {
    saveDailyAttempt({ date: '2026-08-08', questionId: 'a', selectedIndex: 1, correct: true });
    saveDailyAttempt({ date: '2026-08-09', questionId: 'b', selectedIndex: 0, correct: false });
    saveDailyAttempt({ date: '2026-08-09', questionId: 'c', selectedIndex: 2, correct: true });

    const history = loadDailyHistory();
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.date)).toEqual(['2026-08-08', '2026-08-09']);
    expect(history[1].questionId).toBe('c');
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem('devsprint.dailyHistory', '{not json');
    expect(loadDailyHistory()).toEqual([]);
  });

  it('drops entries that do not match the DailyAttempt shape', () => {
    const valid = {
      date: '2026-08-09',
      questionId: 'q1',
      selectedIndex: 2,
      correct: true,
    };
    const tampered = [
      { ...valid, correct: 'yes' }, // truthy non-boolean — streak gaming
      { ...valid, selectedIndex: '2' }, // string index
      { ...valid, selectedIndex: 99 }, // out of range
      { ...valid, date: 'not-a-date' }, // bad date key
      { ...valid, questionId: '' }, // empty question id
      null,
      'string entry',
    ];
    window.localStorage.setItem('devsprint.dailyHistory', JSON.stringify([...tampered, valid]));
    expect(loadDailyHistory()).toEqual([valid]);
  });

  it('keeps entries with extra fields — validation checks required fields only', () => {
    const withExtra = {
      date: '2026-08-09',
      questionId: 'q1',
      selectedIndex: 0,
      correct: false,
      migrated: true,
    };
    window.localStorage.setItem('devsprint.dailyHistory', JSON.stringify([withExtra]));
    expect(loadDailyHistory()).toEqual([withExtra]);
  });
});
