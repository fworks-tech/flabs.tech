import { readFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "@/lib/logger";
import { ImageResponse } from "next/og";

/** Static favicon dimensions (32×32 PNG) */
export const size = { width: 32, height: 32 };
/** MIME type returned by the favicon route */
export const contentType = "image/png";

/**
 * Generates the site favicon from the avatar image.
 *
 * Reads `public/images/avatar.png` at request time and renders it
 * as a circular PNG via `ImageResponse`. Falls back to a solid
 * indigo square if the avatar file is missing or unreadable.
 */
export default async function Icon() {
  let avatarData: Buffer;
  try {
    avatarData = await readFile(path.join(process.cwd(), "public/images/avatar.png"));
  } catch (error) {
    logger.error(error, "failed to read avatar for favicon");
    return new ImageResponse(
      <div style={{ width: 32, height: 32, background: "#6366f1" }} />,
      { ...size },
    );
  }
  const avatarBase64 = `data:image/png;base64,${avatarData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* next/og ImageResponse (Satori) requires raw <img> — not next/image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={avatarBase64} 
        alt="Fábio Ritzel Borges - Full Stack Web Developer & AI Engineer" 
        style={{ width: 32, height: 32, objectFit: "cover" }} 
      />
    </div>,
    { ...size },
  );
}
