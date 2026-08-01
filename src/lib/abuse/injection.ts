/**
 * Prompt-injection detection for the chat assistant.
 *
 * Two tiers, so legitimate questions are never hard-blocked:
 * - `BLOCK_PATTERNS`: unambiguous extraction/jailbreak attempts. Matches are
 *   still only rejected once the investigation case shows repeated offenses
 *   (severity above "low") — a single false positive never blocks a user.
 * - `SUSPICIOUS_PATTERNS`: role-play or meta-questions that can occur in
 *   normal conversation ("act as a recruiter", "what are your instructions").
 *   These record a signal for evidence accumulation but never reject.
 */

export interface InjectionResult {
  /** Unambiguous attack pattern (extraction/jailbreak). */
  blocked: boolean;
  /** Role-play / meta pattern — signal only, never blocks. */
  suspicious: boolean;
}

const BLOCK_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions|prompts|rules)/i,
  /disregard\s+(previous|all)\s+(instructions|rules)/i,
  /system\s*:\s*you\s+are/i,
  /reveal\s+(your|the)\s+(prompt|instructions|system)/i,
  /output\s+(your|the)\s+(system\s+)?prompt/i,
  /jailbreak|bypass|override/i,
];

const SUSPICIOUS_PATTERNS = [
  /act\s+as\s+(if\s+)?(you\s+are|a\s+)/i,
  /pretend\s+to\s+be/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /what\s+(is|are)\s+your\s+(instructions|prompt|system)/i,
];

export function detectInjection(text: string): InjectionResult {
  const blocked = BLOCK_PATTERNS.some((pattern) => pattern.test(text));
  const suspicious = !blocked && SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
  return { blocked, suspicious };
}
