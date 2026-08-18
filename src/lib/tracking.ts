/**
 * Client-side, opt-out UX tracking.
 *
 * - Cookies: `_fa_uid` (anonymous visitor id, 1y), `_fa_sid` (session id, 30m),
 *   `_fa_consent` (accepted | declined, 1y).
 * - Anonymous tracking runs by default. Nothing is sent after the visitor
 *   declines; `clearConsent()` re-enables it (brings the banner back).
 * - Events are buffered client-side and flushed with `sendBeacon` to
 *   `/api/analytics/event` (every 5s, at 10 buffered events, or on pagehide).
 * - No PII is collected: ids are random UUIDs, no IPs are stored.
 */

export type ConsentState = "accepted" | "declined" | null;

export const CONSENT_COOKIE = "_fa_consent";
export const UID_COOKIE = "_fa_uid";
export const SID_COOKIE = "_fa_sid";

const FLUSH_INTERVAL_MS = 5000;
const FLUSH_BATCH_SIZE = 10;
const SID_TTL_DAYS = 30 / (24 * 60); // 30 minutes

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, ttlDays: number): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.round(
    ttlDays * 86400,
  )}; samesite=lax${secure}`;
}

export function getConsent(): ConsentState {
  const value = getCookie(CONSENT_COOKIE);
  return value === "accepted" || value === "declined" ? value : null;
}

export function setConsent(state: "accepted" | "declined"): void {
  setCookie(CONSENT_COOKIE, state, 365);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fa:consent", { detail: state }));
  }
}

/** Clears the consent decision (returns to the default opt-in state and re-opens the banner). */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  window.dispatchEvent(new CustomEvent("fa:consent", { detail: null }));
}

export function subscribeConsent(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("fa:consent", callback);
  return () => window.removeEventListener("fa:consent", callback);
}

export function ensureIds(): { uid: string; sid: string } {
  let uid = getCookie(UID_COOKIE);
  if (!uid) {
    uid = crypto.randomUUID();
    setCookie(UID_COOKIE, uid, 365);
  }
  let sid = getCookie(SID_COOKIE);
  if (!sid) {
    sid = crypto.randomUUID();
    setCookie(SID_COOKIE, sid, SID_TTL_DAYS);
  }
  return { uid, sid };
}

interface PendingEvent {
  t: number;
  ty: string;
  p?: string;
  uid?: string;
  sid?: string;
  d?: string;
  b?: string;
  r?: string;
  v?: number;
}

let buffer: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function track(
  type: string,
  props?: { path?: string; value?: number; referrer?: string },
  opts?: { force?: boolean },
): void {
  if (typeof window === "undefined") return;
  const declined = getConsent() === "declined";
  // `consent_declined` records the opt-out itself and must be emitted while
  // the cookie is already set to declined — the only event allowed through
  // while tracking is otherwise stopped.
  if (declined && !(opts?.force && type === "consent_declined")) return;

  const { uid, sid } = ensureIds();
  const { device, browser } = detectEnvironment();

  buffer.push({
    t: Date.now(),
    ty: type,
    p: props?.path ?? window.location.pathname,
    uid,
    sid,
    d: device,
    b: browser,
    r: props?.referrer,
    v: props?.value,
  });

  if (buffer.length >= FLUSH_BATCH_SIZE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

export function startTrackingSession(): void {
  if (getConsent() === "declined") return;
  track("session_start", { referrer: getExternalReferrer() });
  track("page_view");
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0) return;
  const payload = buffer.splice(0, buffer.length);
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", blob);
  } else {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function initTracking(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("pagehide", flush);
}

function getExternalReferrer(): string | undefined {
  const referrer = document.referrer;
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    if (url.origin === window.location.origin) return undefined;
    return url.hostname;
  } catch {
    return undefined;
  }
}

function detectEnvironment(): { device: string; browser: string } {
  const ua = navigator.userAgent;
  let device = "desktop";
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    device = "tablet";
  } else if (/mobi|iphone|ipod|android/i.test(ua)) {
    device = "mobile";
  }

  let browser = "other";
  if (/edg\//i.test(ua)) browser = "edge";
  else if (/chrome|crios/i.test(ua)) browser = "chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "firefox";
  else if (/safari/i.test(ua)) browser = "safari";

  return { device, browser };
}
