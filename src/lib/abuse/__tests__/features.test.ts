import { describe, expect, it } from 'vitest';
import { extractFeatures, FEATURE_NAMES } from '@/lib/abuse/features';

describe('extractFeatures', () => {
  it('returns all-zero vector for benign input', () => {
    const features = extractFeatures({});
    for (const name of FEATURE_NAMES) {
      expect(features[name]).toBe(0);
    }
  });

  it('flags rate violation and injection as binary', () => {
    const features = extractFeatures({ rateViolated: true, injectionDetected: true });
    expect(features.rateViolation).toBe(1);
    expect(features.injectionDetected).toBe(1);
  });

  it('normalizes cost spikes to 0..1', () => {
    expect(extractFeatures({ costUsd: 0.01 }).costSpike).toBeCloseTo(0.5);
    expect(extractFeatures({ costUsd: 0.04 }).costSpike).toBe(1);
  });

  it('normalizes message length to 0..1', () => {
    expect(extractFeatures({ messageLength: 1000 }).oversizedMessage).toBeCloseTo(0.5);
    expect(extractFeatures({ messageLength: 2000 }).oversizedMessage).toBe(1);
  });

  it('flags malformed payloads and PII', () => {
    const features = extractFeatures({ malformed: true, piiCount: 2 });
    expect(features.malformedPayload).toBe(1);
    expect(features.piiDetected).toBe(1);
  });

  it('normalizes request frequency', () => {
    expect(extractFeatures({ requestsPerMinute: 30 }).highFrequency).toBe(1);
    expect(extractFeatures({ requestsPerMinute: 15 }).highFrequency).toBeCloseTo(0.5);
  });
});
