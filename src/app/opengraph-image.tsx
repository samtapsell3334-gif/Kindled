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
          {/* the "Catching On" mark — rising dots into a spark */}
          <div style={{ display: "flex", position: "relative", width: 72, height: 72 }}>
            <div style={{ position: "absolute", left: 8, top: 58, width: 7, height: 7, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
            <div style={{ position: "absolute", left: 20, top: 50, width: 10, height: 10, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
            <div style={{ position: "absolute", left: 33, top: 40, width: 13, height: 13, borderRadius: 99, background: "#F0A63C", display: "flex" }} />
            <div style={{ position: "absolute", left: 46, top: 27, width: 16, height: 16, borderRadius: 99, background: "#EE7A3A", display: "flex" }} />
            <div style={{ position: "absolute", left: 54, top: 6, width: 22, height: 22, background: "#F0A63C", clipPath: "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)", display: "flex" }} />
          </div>
          <div style={{ display: "flex", color: "#FAF5EE", fontSize: 38, fontWeight: 800, letterSpacing: -0.5 }}>Kindled</div>
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
