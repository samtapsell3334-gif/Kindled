import { ImageResponse } from "next/og";
import { getPotBySlug, ensureHydrated } from "@/lib/sandbox/store";

/**
 * v7 Stage-0 P0: dynamic per-pot og:image in the ember brand. Surprise-safe by
 * construction — renders only title/occasion/date; amounts and items never appear.
 */
export const alt = "Chip in together on Kindled";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PotOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureHydrated();
  const pot = getPotBySlug(slug);
  const title = pot ? pot.title : "A Kindled wish";
  const line = pot
    ? `${pot.occasion} · ${new Date(pot.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
    : "One wish, one link, revealed on the big day";
  const embers = Array.from({ length: 36 }, (_, i) => ({
    left: (i * 151.7) % 1200, top: 160 + ((i * 97.3) % 440),
    s: 3 + ((i * 7) % 8), o: 0.15 + ((i * 11) % 45) / 100,
  }));
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "72px", position: "relative", fontFamily: "sans-serif",
        background: "linear-gradient(160deg, #1a0800 0%, #0a0400 60%, #050200 100%)",
      }}>
        {embers.map((e, i) => (
          <div key={i} style={{ position: "absolute", left: e.left, top: e.top, width: e.s, height: e.s, borderRadius: 999, background: "#fbbf24", opacity: e.o, display: "flex" }} />
        ))}
        <div style={{ display: "flex", color: "#F0A63C", fontSize: 30, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4 }}>
          You&apos;re invited to chip in
        </div>
        <div style={{ display: "flex", marginTop: 26, color: "white", fontSize: 84, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 26, color: "rgba(255,255,255,0.7)", fontSize: 36 }}>
          {line} · sealed until the reveal
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 44 }}>
          <div style={{ display: "flex", position: "relative", width: 52, height: 52 }}>
            <div style={{ position: "absolute", left: 5, top: 42, width: 6, height: 6, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
            <div style={{ position: "absolute", left: 14, top: 36, width: 8, height: 8, borderRadius: 99, background: "#FAF5EE", display: "flex" }} />
            <div style={{ position: "absolute", left: 24, top: 28, width: 10, height: 10, borderRadius: 99, background: "#F0A63C", display: "flex" }} />
            <div style={{ position: "absolute", left: 34, top: 18, width: 12, height: 12, borderRadius: 99, background: "#EE7A3A", display: "flex" }} />
            <div style={{ position: "absolute", left: 38, top: 2, width: 16, height: 16, background: "#F0A63C", clipPath: "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)", display: "flex" }} />
          </div>
          <div style={{ display: "flex", color: "#FAF5EE", fontSize: 32, fontWeight: 800 }}>Kindled</div>
        </div>
      </div>
    ),
    size,
  );
}
