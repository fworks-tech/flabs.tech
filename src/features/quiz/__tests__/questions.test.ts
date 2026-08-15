import { describe, expect, it } from 'vitest';

import {
  buildDeck,
  dailyQuestion,
  DECK_SIZE,
  QUESTIONS,
  type QuestionCategory,
} from '@/features/quiz/data/questions';

const CATEGORIES: QuestionCategory[] = [
  'core',
  'data-structures',
  'functions',
  'gotchas',
  'algorithms',
  'memory',
];

describe('DevSprint question bank', () => {
  it('contains 76 questions', () => {
    expect(QUESTIONS).toHaveLength(76);
  });

  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has exactly 4 answers with a valid correctIndex', () => {
    for (const q of QUESTIONS) {
      expect(q.answers).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it('every question has an explanation AND an explanationCode', () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.explanationCode?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('uses only known categories', () => {
    for (const q of QUESTIONS) {
      expect(CATEGORIES).toContain(q.category);
    }
  });

  it('builds a deck of DECK_SIZE unique questions', () => {
    const deck = buildDeck(42);
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map((q) => q.id)).size).toBe(DECK_SIZE);
  });

  it('shuffled answers keep the correct index consistent', () => {
    const deck = buildDeck(7);
    for (const q of deck) {
      expect(q.answers[q.correctIndex]).toBeDefined();
    }
  });

  it('dailyQuestion always returns a bank question', () => {
    const q = dailyQuestion(new Date('2026-08-09T12:00:00Z'));
    expect(QUESTIONS.some((x) => x.id === q.id)).toBe(true);
  });

  it('dailyQuestion is deterministic and answer-shuffled per day', () => {
    const day = new Date('2026-08-09T12:00:00Z');
    const a = dailyQuestion(day);
    const b = dailyQuestion(day);
    expect(a.id).toBe(b.id);
    expect(a.answers).toEqual(b.answers);
    expect(new Set(a.answers).size).toBe(4);
  });
});
