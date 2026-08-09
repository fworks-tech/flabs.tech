import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  zrevrange: vi.fn(async () => []),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { GET } from "../route";

const member = JSON.stringify({
  id: "uuid-1",
  displayName: "Zara",
  score: 3400,
  accuracy: 0.85,
  maxStreak: 9,
  ts: 1786000000000,
});

function request(week?: string) {
  const url = new URL("http://localhost/api/quiz/leaderboard");
  if (week) url.searchParams.set("week", week);
  return new NextRequest(url);
}

describe("GET /api/quiz/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.zrevrange.mockResolvedValue([member, "not json"]);
  });

  it("returns parsed top entries with ranks by default (current week)", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([
      {
        rank: 0,
        id: "uuid-1",
        displayName: "Zara",
        score: 3400,
        accuracy: 0.85,
        maxStreak: 9,
        ts: 1786000000000,
      },
    ]);
    expect(storeMock.zrevrange).toHaveBeenCalledWith(
      expect.stringMatching(/^quiz:leaderboard:\d{4}-W\d{2}$/),
      0,
      9,
    );
  });

  it("reads the all-time key when week=all", async () => {
    await GET(request("all"));
    expect(storeMock.zrevrange).toHaveBeenCalledWith("quiz:leaderboard", 0, 9);
  });

  it("rejects an unknown week value", async () => {
    const res = await GET(request("last-month"));
    expect(res.status).toBe(400);
    expect(storeMock.zrevrange).not.toHaveBeenCalled();
  });

  it("skips malformed members silently", async () => {
    storeMock.zrevrange.mockResolvedValue(["garbage", member]);
    const res = await GET(request("all"));
    const data = await res.json();
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].id).toBe("uuid-1");
  });
});
