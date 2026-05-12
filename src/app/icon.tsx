import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: "-1px",
            color: "#ffffff",
          }}
        >
          K<span style={{ color: "#C9A84C" }}>.</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
