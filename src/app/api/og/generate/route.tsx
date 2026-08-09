import { person } from "@/content";
import { rankMeta } from "@/features/quiz/lib/ranking";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const INITIALS = person.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

function parseParam(value: string | null, fallback: number, min: number, max: number): number {
  const n = value === null ? NaN : Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * DevSprint result card (1200×630): score, accuracy, max streak and rank
 * badge. Rendered when `?score=` is present; otherwise the classic
 * portfolio card. Always `no-store` — results must never be stale.
 */
function devSprintCard(searchParams: URLSearchParams) {
  const total = parseParam(searchParams.get("total"), 20, 1, 20);
  const score = parseParam(searchParams.get("score"), 0, 0, 10_000);
  const correct = parseParam(searchParams.get("correct"), 0, 0, total);
  const streak = parseParam(searchParams.get("streak"), 0, 0, 50);
  const name =
    (searchParams.get("name") ?? "").replace(/[^\x20-\x7E]/g, "").slice(0, 20) || "Player";
  const accuracy = total === 0 ? 0 : correct / total;
  const rank = rankMeta(correct, total);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "3rem",
        background: "#151515",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "white" }}>DevSprint</span>
        <span
          style={{
            fontSize: "1rem",
            color: "#a8a0d0",
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "1px solid #2a2848",
          }}
        >
          {rank.badge}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1.25rem", color: "#a8a0d0" }}>{name} scored</span>
        <span
          style={{
            fontSize: "7rem",
            lineHeight: "7rem",
            fontWeight: 800,
            color: "white",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}
          <span style={{ fontSize: "3rem", color: "#a8a0d0", fontWeight: 600 }}>
            {" "}
            / {total}
          </span>
        </span>
        <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "white" }}>
              {Math.round(accuracy * 100)}%
            </span>
            <span style={{ fontSize: "0.875rem", color: "#a8a0d0" }}>accuracy</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "white" }}>{streak}</span>
            <span style={{ fontSize: "0.875rem", color: "#a8a0d0" }}>max streak</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "1rem", opacity: 0.4, color: "white" }}>flabs.tech</span>
        <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#a8a0d0", opacity: 0.9 }}>
          Play DevSprint →
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.has("score")) {
    return devSprintCard(searchParams);
  }

  const title = searchParams.get("title") || person.name;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "3rem",
        background: "#151515",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <div
            style={{
              width: "7rem",
              height: "7rem",
              borderRadius: "100%",
              background: "#2a2848",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#a8a0d0",
              flexShrink: 0,
            }}
          >
            {INITIALS}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "2.5rem",
                lineHeight: "2.5rem",
                fontWeight: 700,
                color: "white",
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                lineHeight: "1.5rem",
                opacity: 0.6,
                color: "white",
              }}
            >
              {person.role}
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: "1.5rem",
            lineHeight: "2rem",
            opacity: 0.85,
            color: "#a8a0d0",
            maxWidth: "55rem",
          }}
        >
          10+ years across frontend, backend, testing, devops &amp; AI engineering
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "1rem",
            opacity: 0.4,
            color: "white",
          }}
        >
          flabs.tech
        </span>
        <span
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#a8a0d0",
            opacity: 0.9,
          }}
        >
          View Portfolio →
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}
