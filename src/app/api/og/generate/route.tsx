import { person } from "@/content";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

async function loadGoogleFont(font: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(\w+)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }
}

export async function GET(request: Request) {
  const fontData = await loadGoogleFont("Geist:wght@400").catch(() => undefined);
  const avatarUrl = new URL(person.avatar, request.url).toString();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "3rem",
        background: "#151515",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          fontStyle: "normal",
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
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse (Satori) requires raw <img> */}
          <img
            src={avatarUrl}
            alt="Fábio Ritzel Borges - Senior Full-Stack Engineer and AI Systems Architect"
            style={{
              width: "7rem",
              height: "7rem",
              objectFit: "cover",
              borderRadius: "100%",
            }}
          />
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
                whiteSpace: "pre-wrap",
                textWrap: "balance",
              }}
            >
              {person.name}
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                lineHeight: "1.5rem",
                whiteSpace: "pre-wrap",
                textWrap: "balance",
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
      fonts: fontData
        ? [
            {
              name: "Geist",
              data: fontData,
              style: "normal",
            },
          ]
        : undefined,
    },
  );
}
