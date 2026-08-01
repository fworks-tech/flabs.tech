/**
 * Feature extraction for the abuse-detection model.
 *
 * Converts raw request signals into a normalized feature vector (0..1).
 * GDPR/LGPD note: no message *content* is ever stored — only lengths,
 * counts, and boolean flags derived from the request.
 */

export type FeatureName =
  | "rateViolation"
  | "injectionDetected"
  | "costSpike"
  | "oversizedMessage"
  | "malformedPayload"
  | "highFrequency"
  | "piiDetected";

export type FeatureVector = Record<FeatureName, number>;

export interface SignalInput {
  /** True when the per-window rate limit was hit for this key. */
  rateViolated?: boolean;
  /** True when prompt-injection patterns matched. */
  injectionDetected?: boolean;
  /** Cost delta (USD) for this request. */
  costUsd?: number;
  /** Raw message length in chars (synthetic message may be empty). */
  messageLength?: number;
  /** True when the request failed structural validation. */
  malformed?: boolean;
  /** Requests seen from this key in the last 60s (from rate limiter). */
  requestsPerMinute?: number;
  /** Count of PII findings (email/phone/SSN/credit card). */
  piiCount?: number;
}

export const FEATURE_NAMES: FeatureName[] = [
  "rateViolation",
  "injectionDetected",
  "costSpike",
  "oversizedMessage",
  "malformedPayload",
  "highFrequency",
  "piiDetected",
];

// Tuning knobs — thresholds used to saturate each feature at 1.0
const COST_SPIKE_USD = 0.02; // per-request cost at/above which the feature saturates
const OVERSIZED_MESSAGE_CHARS = 2000;
const HIGH_FREQUENCY_RPM = 30; // requests per minute that saturates the feature

export function extractFeatures(input: SignalInput): FeatureVector {
  return {
    rateViolation: input.rateViolated ? 1 : 0,
    injectionDetected: input.injectionDetected ? 1 : 0,
    costSpike: clamp01((input.costUsd ?? 0) / COST_SPIKE_USD),
    oversizedMessage: clamp01((input.messageLength ?? 0) / OVERSIZED_MESSAGE_CHARS),
    malformedPayload: input.malformed ? 1 : 0,
    highFrequency: clamp01((input.requestsPerMinute ?? 0) / HIGH_FREQUENCY_RPM),
    piiDetected: input.piiCount && input.piiCount > 0 ? 1 : 0,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function featureNames(): FeatureName[] {
  return FEATURE_NAMES;
}
