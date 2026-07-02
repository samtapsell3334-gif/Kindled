"use client";

/**
 * MaterialisingGift (v9 WS-2.1) — the finished wish, becoming visible.
 *
 * One component, three modes, driven only by the server-redacted GiftVisual
 * props (src/lib/sandbox/gift-visual.ts):
 *  - "progress": a sketched gift that fills with ember glow as funding rises.
 *    Detail materialises at 25% (ribbon), 50% (bow), 75% (rising embers).
 *  - "complete": the gift stands whole under the kit spark — the granted state.
 *  - "ambient": the receiver-safe version. No fill level, no numbers — just a
 *    sealed silhouette breathing at the pace of its (deliberately vague) activity.
 *
 * Motion is CSS-only and neutralised globally under prefers-reduced-motion.
 */

import { SPARK } from "@/components/Logo";

export type GiftVisualProp =
  | { mode: "ambient"; activity: "quiet" | "warming" | "glowing" }
  | { mode: "progress"; pct: number }
  | { mode: "complete" };

const EMBER_DOTS: [number, number, number][] = [
  [46, 44, 2.2], [62, 38, 2.8], [76, 46, 2],
];

export function MaterialisingGift({
  visual,
  size = 120,
  className = "",
}: {
  visual: GiftVisualProp;
  size?: number;
  className?: string;
}) {
  const ambient = visual.mode === "ambient";
  const complete = visual.mode === "complete";
  const pct = complete ? 100 : visual.mode === "progress" ? Math.max(0, Math.min(100, visual.pct)) : 0;

  // Box interior spans y=52..104; the ember fill rises through it with pct.
  const fillTop = 104 - (52 * pct) / 100;

  // Soft halo only — the silhouette must stay legible over it (crit round 2).
  const glowOpacity = ambient
    ? { quiet: 0.1, warming: 0.18, glowing: 0.28 }[visual.activity]
    : 0;

  const label = ambient
    ? "A surprise being kept warm"
    : complete
      ? "The gift, fully funded"
      : `The gift taking shape, ${pct}% funded`;

  const breathing = ambient || (visual.mode === "progress" && pct > 0 && pct < 100);

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <linearGradient id="mg-ember" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#E8622C" />
          <stop offset="1" stopColor="#F0A63C" />
        </linearGradient>
        <clipPath id="mg-box">
          <rect x="34" y="52" width="52" height="52" rx="5" />
        </clipPath>
      </defs>

      {/* Ambient halo — warmth without information */}
      {ambient && (
        <circle cx="60" cy="72" r="44" fill="#F0A63C" opacity={glowOpacity} className="animate-mg-breathe" />
      )}

      {/* Ember fill rising inside the box (progress + complete only) */}
      {!ambient && pct > 0 && (
        <g clipPath="url(#mg-box)">
          <rect
            x="34"
            y={fillTop}
            width="52"
            height={104 - fillTop + 2}
            fill="url(#mg-ember)"
            opacity={0.92}
            className={breathing ? "animate-mg-breathe" : undefined}
            style={{ transition: "y 0.7s ease" }}
          />
        </g>
      )}

      {/* The sketched gift: box, lid, ribbon, bow — detail arrives with funding */}
      <g stroke={ambient ? "#FAF5EE" : "#57534e"} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={ambient ? 0.9 : 1}>
        <rect x="34" y="52" width="52" height="52" rx="5" />
        <rect x="30" y="40" width="60" height="13" rx="4" />
        {/* Ribbon at 25% */}
        {(ambient || pct >= 25) && <path d="M60 40 V104" />}
        {/* Bow at 50% */}
        {(ambient || pct >= 50) && (
          <path d="M60 40 C52 28 42 30 46 37 C49 42 56 41 60 38 M60 40 C68 28 78 30 74 37 C71 42 64 41 60 38" />
        )}
      </g>

      {/* Rising embers at 75% */}
      {!ambient && pct >= 75 && pct < 100 &&
        EMBER_DOTS.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#EE7A3A" opacity={0.8} className="animate-mg-breathe" />
        ))}

      {/* Complete: the kit spark stands over the finished gift */}
      {complete && (
        <path d={SPARK} fill="#F0A63C" transform="translate(76 6) scale(0.42)" className="animate-mg-spark-drift" />
      )}
    </svg>
  );
}
