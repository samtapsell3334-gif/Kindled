import { ImageResponse } from "next/og";

/**
 * Code-rendered OG image (1200×630) — closes the founder TODO without shipping a
 * binary asset: Next renders this at request time in the brand's ember language.
 * Swap for photographic art direction whenever real imagery exists.
 */
export const alt = "Kindled — group gifting for friends & family";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  // Deterministic ember field (no Math.random — stable across renders/CDN caches).
  const embers = Array.from({ length: 42 }, (_, i) => ({
    left: (i * 137.5) % 1200,
    top: 180 + ((i * 89.3) % 420),
    s: 3 + ((i * 7) % 9),
    o: 0.15 + ((i * 13) % 50) / 100,
  }));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "72px",
          background: "linear-gradient(160deg, #1a0800 0%, #0a0400 60%, #050200 100%)",
          position: "relative", fontFamily: "sans-serif",
        }}
      >
        {embers.map((e, i) => (
          <div key={i} style={{
            position: "absolute", left: e.left, top: e.top, width: e.s, height: e.s,
            borderRadius: 999, background: "#fbbf24", opacity: e.o, display: "flex",
          }} />
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #fbbf24, #f97316)",
            color: "#1c1917", fontSize: 34, fontWeight: 800,
          }}>K</div>
          <div style={{ display: "flex", color: "#fbbf24", fontSize: 34, fontWeight: 700 }}>Kindled</div>
        </div>
        <div style={{
          display: "flex", marginTop: 40, color: "white", fontSize: 76,
          fontWeight: 800, lineHeight: 1.1, maxWidth: 900,
        }}>
          The gifts they&apos;ll actually love, funded together.
        </div>
        <div style={{ display: "flex", marginTop: 28, color: "rgba(255,255,255,0.65)", fontSize: 32 }}>
          One pot · one link · sealed until the reveal
        </div>
      </div>
    ),
    size,
  );
}
