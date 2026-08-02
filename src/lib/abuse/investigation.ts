import { createHmac } from 'node:crypto';
import { extractFeatures, type FeatureVector, type SignalInput } from './features';
import {
  classifySeverity,
  classifyTrust,
  decayScore,
  scoreFeatures,
  type Severity,
  type TrustState,
} from './model';
import { store } from './store';

// Warn once at startup when pseudonymization is enabled but the secret is empty.
if (process.env.ABUSE_TRACK_IP === 'false' && !process.env.ABUSE_KEY_SECRET) {
  console.warn(
    '[abuse] ABUSE_TRACK_IP=false but ABUSE_KEY_SECRET is not set — pseudonymization is trivially reversible. Set a long random secret in production.',
  );
}

/**
 * Investigation cases: aggregates signals per actor key (IP or fingerprint),
 * scores them with the model, and persists an evidence-backed verdict.
 *
 * Keys are derived from the actor identifier — pseudonymized with a keyed
 * HMAC when `ABUSE_TRACK_IP=false` (see `resolveKey`).
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
  decision: 'open' | 'contained';
}

const DEFAULT_RETENTION_MS = 3600_000; // 1h
const CASE_TTL_SECONDS = 3600 * 24; // Redis TTL for stored cases (24h)

export function retentionMs(): number {
  const raw = Number(process.env.ABUSE_RETENTION_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RETENTION_MS;
}

/**
 * GDPR/LGPD: when IP tracking is disabled, pseudonymize the identifier with a
 * keyed HMAC (`ABUSE_KEY_SECRET`). Note this is keyed pseudonymization, not
 * anonymization — set a long random secret in production.
 */
export function resolveKey(identifier: string): string {
  if (process.env.ABUSE_TRACK_IP === 'false') {
    return `anon:${hash(identifier)}`;
  }
  return identifier;
}

function hash(value: string): string {
  const secret = process.env.ABUSE_KEY_SECRET || '';
  return createHmac('sha256', secret).update(value).digest('hex').slice(0, 16);
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

  // Prior features decay over time (30min half-life), so a clean actor who
  // stops misbehaving naturally recovers to a low severity.
  const ageMs = existing ? now - existing.updatedAt : 0;
  const features = mergeFeatures(existing?.features ?? emptyFeatures(), freshInput, ageMs);
  const result = scoreFeatures(features);

  const score = result.score;
  const severity = classifySeverity(score);
  const trust = classifyTrust(score);

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
    decision: severity === 'low' ? 'open' : 'contained',
  };

  await store.set(caseKey(actorKey), nextCase, { ex: CASE_TTL_SECONDS });
  return nextCase;
}

export async function clearCase(actorKey: string): Promise<void> {
  await store.del(caseKey(actorKey));
}

export { caseKey };

// --- internals ---

function mergeFeatures(
  prior: FeatureVector,
  freshInput: SignalInput,
  ageMs: number,
): FeatureVector {
  const fresh = extractFeatures(freshInput);
  const merged: FeatureVector = { ...emptyFeatures() };
  (Object.keys(merged) as (keyof FeatureVector)[]).forEach((name) => {
    const decayedPrior = ageMs > 0 ? decayScore(prior[name], ageMs) : prior[name];
    merged[name] = Math.max(decayedPrior, fresh[name]);
  });
  return merged;
}
