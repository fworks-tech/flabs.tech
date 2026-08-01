import { describe, expect, it } from 'vitest';
import {
  classifySeverity,
  classifyTrust,
  computeConfidence,
  decayScore,
  logistic,
  scoreFeatures,
} from '@/lib/abuse/model';
import { extractFeatures } from '@/lib/abuse/features';

describe('logistic', () => {
  it('maps 0 to 0.5', () => {
    expect(logistic(0)).toBeCloseTo(0.5);
  });

  it('approaches 1 for large positive z', () => {
    expect(logistic(10)).toBeCloseTo(1, 4);
  });

  it('approaches 0 for large negative z', () => {
    expect(logistic(-10)).toBeCloseTo(0, 4);
  });
});

describe('scoreFeatures', () => {
  it('returns low severity for benign input', () => {
    const result = scoreFeatures(extractFeatures({}));
    expect(result.severity).toBe('low');
    expect(result.trust).toBe('trusted');
    expect(result.score).toBeLessThan(0.4);
  });

  it('escalates on injection detection', () => {
    const result = scoreFeatures(extractFeatures({ injectionDetected: true }));
    // weight 2.5 + bias -0.6 → z = 1.9 → σ ≈ 0.87
    expect(result.score).toBeGreaterThan(0.85);
    expect(result.severity).toBe('critical');
    expect(result.trust).toBe('malicious');
  });

  it('combines multiple weak signals into medium severity', () => {
    // oversizedMessage(0.6×0.5=0.3) + highFrequency(1.1×0.5=0.55) - bias(0.6) → z≈0.25 → σ≈0.56
    const result = scoreFeatures(extractFeatures({ messageLength: 1000, requestsPerMinute: 15 }));
    expect(result.severity).toBe('medium');
    expect(result.activeFeatures).toContain('oversizedMessage');
    expect(result.activeFeatures).toContain('highFrequency');
  });

  it('single rate violation is borderline medium', () => {
    const result = scoreFeatures(extractFeatures({ rateViolated: true }));
    expect(result.score).toBeGreaterThanOrEqual(0.4);
    expect(result.score).toBeLessThan(0.7);
  });

  it('tracks active features', () => {
    const result = scoreFeatures(extractFeatures({ piiCount: 1, requestsPerMinute: 30 }));
    expect(result.activeFeatures).toContain('piiDetected');
    expect(result.activeFeatures).toContain('highFrequency');
    expect(result.activeFeatures).not.toContain('injectionDetected');
  });
});

describe('confidence', () => {
  it('is higher with more distinct signal types', () => {
    const single = computeConfidence(1, extractFeatures({ injectionDetected: true }));
    const diverse = computeConfidence(4, extractFeatures({ injectionDetected: true }));
    expect(diverse).toBeGreaterThan(single);
  });

  it('saturates at 1.0 with strong evidence', () => {
    expect(computeConfidence(4, extractFeatures({ injectionDetected: true }))).toBe(1);
  });
});

describe('severity / trust classification', () => {
  it('classifies by threshold bands', () => {
    expect(classifySeverity(0.9)).toBe('critical');
    expect(classifySeverity(0.7)).toBe('high');
    expect(classifySeverity(0.5)).toBe('medium');
    expect(classifySeverity(0.2)).toBe('low');
  });

  it('maps trust states consistently', () => {
    expect(classifyTrust(0.9)).toBe('malicious');
    expect(classifyTrust(0.7)).toBe('suspicious');
    expect(classifyTrust(0.5)).toBe('neutral');
    expect(classifyTrust(0.2)).toBe('trusted');
  });
});

describe('decayScore', () => {
  it('returns unchanged score for zero age', () => {
    expect(decayScore(0.8, 0)).toBeCloseTo(0.8);
  });

  it('halves score after one half-life', () => {
    expect(decayScore(0.8, 30 * 60_000)).toBeCloseTo(0.4);
  });

  it('never decays below zero', () => {
    expect(decayScore(0.001, 10 * 60_000)).toBeGreaterThanOrEqual(0);
  });
});
