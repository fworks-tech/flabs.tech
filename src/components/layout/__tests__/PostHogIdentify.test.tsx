import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const identifyMock = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    identify: (...args: unknown[]) => identifyMock(...args),
  },
}));

import { PostHogIdentify } from "@/components/layout/PostHogIdentify";

function mockSession(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

describe("PostHogIdentify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("identifies the logged-in owner from the session", async () => {
    mockSession({ user: { id: "user-1", email: "owner@example.com", login: "owner" } });
    render(<PostHogIdentify />);
    await waitFor(() => {
      expect(identifyMock).toHaveBeenCalledWith("user-1", {
        email: "owner@example.com",
        name: undefined,
        login: "owner",
      });
    });
    expect(fetch).toHaveBeenCalledWith("/api/auth/session");
  });

  it("stays anonymous when the session has no user", async () => {
    mockSession({});
    render(<PostHogIdentify />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/session");
    });
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it("does nothing when PostHog is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    mockSession({ user: { id: "user-1" } });
    render(<PostHogIdentify />);
    expect(fetch).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
  });
});
