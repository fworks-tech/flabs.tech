import { FEATURE_NAMES, type FeatureName, type FeatureVector } from './features';

/**
 * Logistic scoring model (ML-style MVP, fully deterministic).
 *
 * score = σ(Σ wᵢ·xᵢ + b)  where σ is the logistic function.
 * Weights are configurable constants (documented below), intended to be
 * tuned from observed false-positive/negative rates.
 *
 * Confidence reflects how *diverse* the evidence is: many distinct signal
 * types weigh more than repeated occurrences of one signal.
 */

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type TrustState = 'trusted' | 'neutral' | 'suspicious' | 'malicious';

export interface ScoreResult {
  score: number; // 0..1
  confidence: number; // 0..1
  severity: Severity;
  trust: TrustState;
  activeFeatures: FeatureName[];
}

/** Model weights — one per feature (wᵢ) plus bias (b). */
export const MODEL_WEIGHTS: Record<FeatureName, number> = {
  rateViolation: 1.2,
  injectionDetected: 2.5,
  costSpike: 1.5,
  oversizedMessage: 0.6,
  malformedPayload: 0.9,
  highFrequency: 1.1,
  piiDetected: 1.4,
};

export const MODEL_BIAS = -0.6;

/** Severity thresholds over the raw logistic score. */
export const SEVERITY_THRESHOLDS: Array<{ min: number; severity: Severity }> = [
  { min: 0.85, severity: 'critical' },
  { min: 0.65, severity: 'high' },
  { min: 0.4, severity: 'medium' },
  { min: 0, severity: 'low' },
];

/** Trust-state thresholds over the raw logistic score. */
export const TRUST_THRESHOLDS: Array<{ min: number; trust: TrustState }> = [
  { min: 0.85, trust: 'malicious' },
  { min: 0.65, trust: 'suspicious' },
  { min: 0.4, trust: 'neutral' },
  { min: 0, trust: 'trusted' },
];

export function logistic(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function scoreFeatures(features: FeatureVector): ScoreResult {
  let z = MODEL_BIAS;
  const activeFeatures: FeatureName[] = [];

  for (const name of FEATURE_NAMES) {
    const value = features[name];
    if (value > 0) {
      z += MODEL_WEIGHTS[name] * value;
      activeFeatures.push(name);
    }
  }

  const score = logistic(z);
  const confidence = computeConfidence(activeFeatures.length, features);

  return {
    score,
    confidence,
    severity: classifySeverity(score),
    trust: classifyTrust(score),
    activeFeatures,
  };
}

/** Confidence: feature diversity + saturation of the strongest signal. */
export function computeConfidence(activeCount: number, features: FeatureVector): number {
  const diversity = Math.min(activeCount / 4, 1); // 4+ distinct signals → 1.0
  const strongest = Math.max(...FEATURE_NAMES.map((n) => features[n]), 0);
  return clamp01(0.5 * diversity + 0.5 * strongest);
}

export function classifySeverity(score: number): Severity {
  for (const { min, severity } of SEVERITY_THRESHOLDS) {
    if (score >= min) return severity;
  }
  return 'low';
}

export function classifyTrust(score: number): TrustState {
  for (const { min, trust } of TRUST_THRESHOLDS) {
    if (score >= min) return trust;
  }
  return 'trusted';
}

/**
 * Exponential decay applied to accumulated evidence, so old signals lose
 * weight over time and legitimate users auto-recover.
 */
export function decayScore(score: number, ageMs: number, halfLifeMs = 30 * 60_000): number {
  if (ageMs <= 0) return score;
  return score * Math.pow(0.5, ageMs / halfLifeMs);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
