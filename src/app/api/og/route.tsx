import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold radial glow top */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(201,168,76,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Subtle grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gold accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #E8C96B, #C9A84C, #A8893A)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-3px",
            }}
          >
            KRAV
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#C9A84C",
              letterSpacing: "-3px",
            }}
          >
            .
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Personal Trainer Online
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.1,
              textAlign: "center",
              background: "linear-gradient(90deg, #E8C96B, #C9A84C, #A8893A)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Personalizado.
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 26,
            color: "#71717a",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Coaching fitness premium com acompanhamento real, no teu telemóvel, 24/7.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 48,
            background: "linear-gradient(135deg, #E8C96B, #C9A84C)",
            borderRadius: 100,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 36,
            paddingRight: 36,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#000000",
              letterSpacing: "-0.5px",
            }}
          >
            Trial grátis de 7 dias · kravcoaching.com
          </span>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
            opacity: 0.4,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
