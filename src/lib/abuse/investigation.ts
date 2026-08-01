import { extractFeatures, type FeatureVector, type SignalInput } from "./features";
import { decayScore, scoreFeatures, type Severity, type TrustState } from "./model";
import { store } from "./store";

/**
 * Investigation cases: aggregates signals per actor key (IP or fingerprint),
 * scores them with the model, and persists an evidence-backed verdict.
 *
 * Keys are derived from the actor identifier — anonymized when
 * `ABUSE_TRACK_IP=false` (see `resolveKey`).
 */

export interface Signal {
  kind: string;
  detail: string;
  at: number;
}

export interface InvestigationCase {
  key: string;
  features: FeatureVector;
  score: number;
  confidence: number;
  severity: Severity;
  trust: TrustState;
  signals: Signal[];
  firstSeenAt: number;
  updatedAt: number;
  decidedAt: number;
  decision: "open" | "contained";
}

const DEFAULT_RETENTION_MS = 3600_000; // 1h
const CASE_TTL_SECONDS = 3600 * 24; // Redis TTL for stored cases (24h)

export function retentionMs(): number {
  const raw = Number(process.env.ABUSE_RETENTION_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RETENTION_MS;
}

/** GDPR/LGPD: when IP tracking is disabled, hash the identifier. */
export function resolveKey(identifier: string): string {
  if (process.env.ABUSE_TRACK_IP === "false") {
    return `anon:${hash(identifier)}`;
  }
  return identifier;
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function caseKey(actorKey: string): string {
  return `abuse:case:${actorKey}`;
}

export function emptyFeatures(): FeatureVector {
  return {
    rateViolation: 0,
    injectionDetected: 0,
    costSpike: 0,
    oversizedMessage: 0,
    malformedPayload: 0,
    highFrequency: 0,
    piiDetected: 0,
  };
}

export async function getCase(actorKey: string): Promise<InvestigationCase | null> {
  return store.get<InvestigationCase>(caseKey(actorKey));
}

export async function recordSignal(
  actorKey: string,
  signal: Signal,
  freshInput: SignalInput,
): Promise<InvestigationCase> {
  const now = Date.now();
  const existing = await getCase(actorKey);

  const signals = existing ? [...existing.signals, signal].slice(-50) : [signal];

  // Decay prior score so recovery happens naturally over time.
  const priorScore = existing ? decayScore(existing.score, now - existing.updatedAt) : 0;

  const features = mergeFeatures(existing?.features ?? emptyFeatures(), freshInput);
  const result = scoreFeatures(features);

  // Keep the strongest of (decayed prior, fresh result) so evidence accumulates
  // but never artificially inflates once signals have decayed away.
  const score = Math.max(priorScore, result.score);
  const severity = score >= 0.85 ? "critical" : score >= 0.65 ? "high" : score >= 0.4 ? "medium" : "low";
  const trust = score >= 0.85 ? "malicious" : score >= 0.65 ? "suspicious" : score >= 0.4 ? "neutral" : "trusted";

  const nextCase: InvestigationCase = {
    key: actorKey,
    features,
    score,
    confidence: result.confidence,
    severity,
    trust,
    signals,
    firstSeenAt: existing?.firstSeenAt ?? now,
    updatedAt: now,
    decidedAt: now,
    decision: severity === "low" ? "open" : "contained",
  };

  await store.set(caseKey(actorKey), nextCase, { ex: CASE_TTL_SECONDS });
  return nextCase;
}

export async function clearCase(actorKey: string): Promise<void> {
  await store.del(caseKey(actorKey));
}

export { caseKey };

// --- internals ---

function mergeFeatures(prior: FeatureVector, freshInput: SignalInput): FeatureVector {
  const fresh = extractFeatures(freshInput);
  const merged: FeatureVector = { ...emptyFeatures() };
  (Object.keys(merged) as (keyof FeatureVector)[]).forEach((name) => {
    merged[name] = Math.max(prior[name], fresh[name]);
  });
  return merged;
}
