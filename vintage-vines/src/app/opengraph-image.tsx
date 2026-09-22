import { ImageResponse } from "next/og";
import { business } from "@/config/business";

export const alt = `${business.name} — ${business.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// section 2's actual brand photograph was never supplied to this build
// (see the landing page hero for the same gap) — this is a palette-only
// wordmark card, not a stand-in for real photography once it exists.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6efe1",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#7a5f28",
            marginBottom: 24,
          }}
        >
          {`${business.location.city}, ${business.location.state}`}
        </div>
        <div
          style={{
            fontSize: 88,
            color: "#2b2a1f",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {business.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#2f4a34",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          {business.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
