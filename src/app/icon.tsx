import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const avatarData = await readFile(path.join(process.cwd(), "public/images/avatar.png"));
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
      {/* next/og ImageResponse (Satori) requires raw <img> */}
      <img 
        src={avatarBase64} 
        alt="Fábio Ritzel Borges - Senior Full-Stack Engineer and AI Systems Architect" 
        style={{ width: 32, height: 32, objectFit: "cover" }} 
      />
    </div>,
    { ...size },
  );
}
