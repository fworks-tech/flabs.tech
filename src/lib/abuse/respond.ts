import { store } from './store';
import type { QuarantineTier } from './quarantine';

/**
 * Automated incident response: turns quarantine/investigation verdicts into
 * HTTP responses and fires coalesced escalation events.
 *
 * `ABUSE_RESPONSE_MODE=shadow` (default) observes and notifies without
 * blocking; `enforce` actually rejects requests for contained actors.
 */

export type ResponseMode = 'shadow' | 'enforce';

export interface ResponseDecision {
  mode: ResponseMode;
  tier: QuarantineTier;
  status: number;
  blocked: boolean;
  retryAfter?: number;
  reason?: string;
}

export interface EscalationEvent {
  kind: string;
  key: string;
  detail: string;
  at: number;
}

export function responseMode(): ResponseMode {
  return process.env.ABUSE_RESPONSE_MODE === 'enforce' ? 'enforce' : 'shadow';
}

/** Map a quarantine tier to the HTTP response the chat route should emit. */
export function decideResponse(
  tier: QuarantineTier,
  mode: ResponseMode = responseMode(),
): ResponseDecision {
  switch (tier) {
    case 'hard-block':
      return {
        mode,
        tier,
        status: 403,
        blocked: mode === 'enforce',
        reason: 'Access temporarily restricted.',
      };
    case 'soft-quarantine':
      return {
        mode,
        tier,
        status: 429,
        blocked: mode === 'enforce',
        retryAfter: 600,
        reason: 'Too many requests. Try again in a few minutes.',
      };
    case 'throttle':
      return {
        mode,
        tier,
        status: 429,
        blocked: false, // throttled actors are slowed, not rejected
        retryAfter: 60,
        reason: 'Slow down. Try again shortly.',
      };
    default:
      return { mode, tier, status: 200, blocked: false };
  }
}

const ESCALATION_KEY = 'abuse:escalation:cooldown';
const ESCALATION_COOLDOWN_MS = 5 * 60_000; // max 1 event per kind per 5 min

/**
 * Coalesced escalation trigger: only records/emits when the cooldown for a
 * given (kind, key) bucket has elapsed. Returns true when the event fired.
 */
export async function maybeEscalate(event: EscalationEvent): Promise<boolean> {
  const bucket = `${ESCALATION_KEY}:${event.kind}:${event.key}`;
  const last = await store.get<number>(bucket);
  const now = Date.now();

  if (last && now - last < ESCALATION_COOLDOWN_MS) {
    return false;
  }

  await store.set(bucket, now, { ex: Math.ceil(ESCALATION_COOLDOWN_MS / 1000) });
  return true;
}
