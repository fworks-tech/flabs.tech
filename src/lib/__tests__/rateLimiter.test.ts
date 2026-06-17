import { rateLimit } from "@/lib/rateLimiter";
import { describe, expect, it } from "vitest";

describe("rateLimiter", () => {
  it("allows the first request", () => {
    expect(rateLimit("test-ip").allowed).toBe(true);
  });

  it("allows up to 5 requests", () => {
    for (let i = 0; i < 4; i++) {
      expect(rateLimit("test-ip-2").allowed).toBe(true);
    }
    expect(rateLimit("test-ip-2").allowed).toBe(true);
  });

  it("blocks after 5 requests", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("test-ip-3");
    }
    const result = rateLimit("test-ip-3");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("ip-a");
    }
    expect(rateLimit("ip-a").allowed).toBe(false);
    expect(rateLimit("ip-b").allowed).toBe(true);
  });
});
