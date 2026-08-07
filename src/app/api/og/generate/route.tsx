import { person } from "@/content";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const INITIALS = person.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
          Building production GraphQL APIs &amp; autonomous AI agents
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
    },
  );
}
