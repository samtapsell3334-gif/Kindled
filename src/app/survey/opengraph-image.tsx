import { ImageResponse } from "next/og";
import { NIGHT_CANVAS, NIGHT_INK } from "@/lib/theme";

/**
 * Survey share card (v11 WS-14) — built for the parent WhatsApp group:
 * night-set ground, the kit mark, one warm question, legible at thumbnail size.
 */
export const runtime = "edge";
export const alt = "Two minutes on gift-giving — a quick Kindled survey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SurveyOgImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: NIGHT_CANVAS,
      }}>
        {/* The kit mark: rising dots into the spark */}
        <div style={{ display: "flex", position: "relative", width: 120, height: 120 }}>
          <div style={{ position: "absolute", left: 8, top: 84, width: 12, height: 12, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
          <div style={{ position: "absolute", left: 30, top: 68, width: 16, height: 16, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
          <div style={{ position: "absolute", left: 54, top: 48, width: 20, height: 20, borderRadius: 99, background: "#F0A63C", display: "flex" }} />
          <div style={{ position: "absolute", left: 82, top: 24, width: 24, height: 24, borderRadius: 99, background: "#EE7A3A", display: "flex" }} />
      </div>
        <p style={{ marginTop: 28, fontSize: 58, fontWeight: 700, color: NIGHT_INK, textAlign: "center", maxWidth: 900, lineHeight: 1.15 }}>
          Two minutes on gift-giving?
        </p>
        <p style={{ marginTop: 8, fontSize: 28, color: "#9FE1CB", textAlign: "center" }}>
          Quick taps, no typing — help shape a better way to give
        </p>
        <p style={{ marginTop: 26, fontSize: 24, fontWeight: 700, color: "#F0A63C" }}>kindledgift.co.uk/survey</p>
      </div>
    ),
    size,
  );
}
