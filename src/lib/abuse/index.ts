/**
 * Abuse-prevention pipeline facade.
 *
 * The chat route calls the exported helpers in sequence:
 *   resolveKey → recordSignal → quarantine check → decideResponse → notify
 */

import { recordSignal, resolveKey, type InvestigationCase, type Signal } from './investigation';
import { detectInjection, type InjectionResult } from './injection';
import { type SignalInput } from './features';
import { type QuarantineTier, applyQuarantine, effectiveTier, tierForScore } from './quarantine';
import { decideResponse, maybeEscalate, type ResponseDecision } from './respond';
import { notify } from './notify';
import {
  MAX_TOKENS_PER_REQUEST,
  calculateCost,
  checkCostLimit,
  estimateTokens,
  recordActualUsage,
} from './cost';

export type {
  InvestigationCase,
  Signal,
  SignalInput,
  QuarantineTier,
  ResponseDecision,
  InjectionResult,
};
export {
  MAX_TOKENS_PER_REQUEST,
  applyQuarantine,
  calculateCost,
  checkCostLimit,
  decideResponse,
  detectInjection,
  effectiveTier,
  estimateTokens,
  maybeEscalate,
  notify,
  recordActualUsage,
  recordSignal,
  resolveKey,
  tierForScore,
};
