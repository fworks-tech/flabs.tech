import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TOKEN_TTL = 60 * 60 * 1000;
const CLEANUP_INTERVAL = 300_000;

describe("tokenStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stores and validates a token", async () => {
    const { storeToken, validateToken } = await import("@/lib/tokenStore");
    storeToken("abc123");
    expect(validateToken("abc123")).toBe(true);
  });

  it("rejects undefined token", async () => {
    const { validateToken } = await import("@/lib/tokenStore");
    expect(validateToken(undefined)).toBe(false);
  });

  it("rejects empty token", async () => {
    const { validateToken } = await import("@/lib/tokenStore");
    expect(validateToken("")).toBe(false);
  });

  it("rejects unknown token", async () => {
    const { validateToken } = await import("@/lib/tokenStore");
    expect(validateToken("unknown")).toBe(false);
  });

  it("expires token after TTL", async () => {
    const { storeToken, validateToken } = await import("@/lib/tokenStore");
    storeToken("expiry-test");
    vi.advanceTimersByTime(TOKEN_TTL + 1000);
    expect(validateToken("expiry-test")).toBe(false);
  });

  it("cleans up expired tokens on interval", async () => {
    const { storeToken, validateToken } = await import("@/lib/tokenStore");
    storeToken("cleanup-test");
    vi.advanceTimersByTime(TOKEN_TTL + 1000);
    vi.advanceTimersByTime(CLEANUP_INTERVAL);
    expect(validateToken("cleanup-test")).toBe(false);
  });

  it("keeps token valid before TTL", async () => {
    const { storeToken, validateToken } = await import("@/lib/tokenStore");
    storeToken("still-valid");
    vi.advanceTimersByTime(TOKEN_TTL - 1000);
    expect(validateToken("still-valid")).toBe(true);
  });
});
