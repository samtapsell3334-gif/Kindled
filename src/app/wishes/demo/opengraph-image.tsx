import { ImageResponse } from "next/og";
import { NIGHT_CANVAS, NIGHT_INK } from "@/lib/theme";

/**
 * Demo share card (v11.1 P0-4) — Billy's-list framing on the night set.
 * The demo layout declares summary_large_image; this supplies the image.
 */
export const runtime = "edge";
export const alt = "See a live Kindled wish — Billy's list, funded by the people who love him";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function DemoOgImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: NIGHT_CANVAS,
      }}>
        <div style={{ display: "flex", position: "relative", width: 110, height: 110 }}>
          <div style={{ position: "absolute", left: 6, top: 78, width: 11, height: 11, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
          <div style={{ position: "absolute", left: 27, top: 63, width: 15, height: 15, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
          <div style={{ position: "absolute", left: 50, top: 44, width: 19, height: 19, borderRadius: 99, background: "#F0A63C", display: "flex" }} />
          <div style={{ position: "absolute", left: 76, top: 22, width: 23, height: 23, borderRadius: 99, background: "#EE7A3A", display: "flex" }} />
        </div>
        <p style={{ marginTop: 26, fontSize: 56, fontWeight: 700, color: NIGHT_INK, textAlign: "center", maxWidth: 940, lineHeight: 1.15 }}>
          Billy built his list. Everyone chipped in.
        </p>
        <p style={{ marginTop: 10, fontSize: 28, color: "#9FE1CB", textAlign: "center" }}>
          Explore the live Kindled demo — chip in, browse, preview the reveal
        </p>
        <p style={{ marginTop: 24, fontSize: 24, fontWeight: 700, color: "#F0A63C" }}>kindledgift.co.uk/wishes/demo</p>
      </div>
    ),
    size,
  );
}
