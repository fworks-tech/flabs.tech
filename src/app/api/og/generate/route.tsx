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
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          color: "white",
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
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                lineHeight: "1.5rem",
                opacity: "0.6",
              }}
            >
              {person.role}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          fontSize: "1rem",
          opacity: "0.4",
          color: "white",
        }}
      >
        flabs.tech
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
