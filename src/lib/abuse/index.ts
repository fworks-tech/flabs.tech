/**
 * Abuse-prevention pipeline facade.
 *
 * The chat route calls the exported helpers in sequence:
 *   resolveKey → recordSignal → quarantine check → decideResponse → notify
 */

import { clearCase, getCase, recordSignal, resolveKey, type InvestigationCase, type Signal } from "./investigation";
import { type SignalInput } from "./features";
import { type QuarantineTier, applyQuarantine, effectiveTier, releaseQuarantine, tierForScore } from "./quarantine";
import { decideResponse, maybeEscalate, type ResponseDecision } from "./respond";
import { notify } from "./notify";

export type { InvestigationCase, Signal, SignalInput, QuarantineTier, ResponseDecision };
export { applyQuarantine, clearCase, decideResponse, effectiveTier, getCase, maybeEscalate, notify, recordSignal, releaseQuarantine, resolveKey, tierForScore };
