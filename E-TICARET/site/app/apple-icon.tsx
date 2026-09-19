import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#e8e4de",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 101,
            height: 11,
            background: "#111111",
            borderRadius: 6,
            marginBottom: 22,
          }}
        />
        <div
          style={{
            width: 101,
            height: 11,
            background: "#111111",
            borderRadius: 6,
            marginBottom: 22,
          }}
        />
        <div
          style={{
            width: 101,
            height: 11,
            background: "#111111",
            borderRadius: 6,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
