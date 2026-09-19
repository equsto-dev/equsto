import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/** Google Search favicon — üç çizgi, 48×48 */
export default function Icon() {
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
            width: 27,
            height: 3,
            background: "#111111",
            borderRadius: 2,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            width: 27,
            height: 3,
            background: "#111111",
            borderRadius: 2,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            width: 27,
            height: 3,
            background: "#111111",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
