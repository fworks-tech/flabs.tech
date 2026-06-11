import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const avatarData = await readFile(path.join(process.cwd(), "public/images/avatar.png"));
  const avatarBase64 = `data:image/png;base64,${avatarData.toString("base64")}`;

  return new ImageResponse(
    (
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
        <img
          src={avatarBase64}
          style={{ width: 32, height: 32, objectFit: "cover" }}
        />
      </div>
    ),
    { ...size },
  );
}
