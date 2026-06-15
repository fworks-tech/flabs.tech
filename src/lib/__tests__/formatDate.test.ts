import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate } from "../formatDate";

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns full date when includeRelative is false", () => {
    const result = formatDate("2025-01-10");
    expect(result).toBe("January 10, 2025");
  });

  it("returns 'just now' for the current time", () => {
    const result = formatDate("2026-06-15T12:00:00", true);
    expect(result).toContain("(just now)");
  });

  it("returns minutes ago", () => {
    const result = formatDate("2026-06-15T11:58:00", true);
    expect(result).toContain("(2m ago)");
  });

  it("returns hours ago", () => {
    const result = formatDate("2026-06-15T09:00:00", true);
    expect(result).toContain("(3h ago)");
  });

  it("returns days ago", () => {
    const result = formatDate("2026-06-10T12:00:00", true);
    expect(result).toContain("(5d ago)");
  });

  it("returns months ago", () => {
    const result = formatDate("2026-03-15T12:00:00", true);
    expect(result).toContain("(3mo ago)");
  });

  it("returns years ago", () => {
    const result = formatDate("2024-06-15T12:00:00", true);
    expect(result).toContain("(2y ago)");
  });

  it("handles dates without T separator", () => {
    const result = formatDate("2025-01-10", true);
    expect(result).toBe("January 10, 2025 (1y ago)");
  });

  it("handles includeRelative=true with full date", () => {
    const result = formatDate("2026-06-14", true);
    expect(result).toBe("June 14, 2026 (1d ago)");
  });
});
