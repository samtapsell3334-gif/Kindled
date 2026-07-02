/**
 * Kindled logo — "Catching On" (2026 kit, /public/logo/README in the handoff zip).
 * Contribution dots rise on an arc (teal givers → ember) into a gold spark burst.
 *
 * Per the kit's handoff: the mark is inlined (pure geometry, safe everywhere) and
 * the wordmark is HTML text in Gabarito 800 (loaded via next/font in layout.tsx) so
 * it renders identically with or without page fonts. Colour variants:
 *  - "light"  → full-colour mark + ink wordmark (light backgrounds)
 *  - "dark"   → reversed mark (cream/gold dots) + cream wordmark (dark backgrounds)
 * Below 32px rendered size use `compact` (2-dot simplified mark, per kit rules).
 */

const SPARK = "M32 6l5 21 21 5-21 5-5 21-5-21-21-5 21-5Z";

export function LogoMark({
  variant = "light",
  compact = false,
  size = 32,
  className = "",
}: {
  variant?: "light" | "dark";
  compact?: boolean;
  size?: number;
  className?: string;
}) {
  const dark = variant === "dark";
  const dots = compact
    ? [
        { cx: 22, cy: 46, r: 7, fill: dark ? "#FAF5EE" : "#14807C" },
        { cx: 40, cy: 30, r: 9, fill: dark ? "#EE7A3A" : "#E8622C" },
      ]
    : [
        { cx: 9, cy: 55, r: 2.8, fill: dark ? "#FAF5EE" : "#128280" },
        { cx: 20, cy: 49.5, r: 4, fill: dark ? "#FAF5EE" : "#14807C" },
        { cx: 31.5, cy: 41.5, r: 5.2, fill: dark ? "#F0A63C" : "#EE7A3A" },
        { cx: 43, cy: 31, r: 6.4, fill: dark ? "#EE7A3A" : "#E8622C" },
      ];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      {dots.map((d, i) => <circle key={i} {...d} />)}
      <path d={SPARK} fill="#F0A63C" transform={compact ? "translate(34 2) scale(0.55)" : "translate(37 1) scale(0.45)"} />
    </svg>
  );
}

export function Logo({
  variant = "light",
  size = 30,
  className = "",
  wordmark = true,
}: {
  variant?: "light" | "dark";
  size?: number;
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.3) }}>
      <LogoMark variant={variant} size={size} compact={size < 32} />
      {wordmark && (
        <span
          style={{ fontFamily: "var(--font-logo), 'Avenir Next', 'Trebuchet MS', sans-serif", fontWeight: 800, letterSpacing: "-0.01em", fontSize: Math.round(size * 0.66) }}
          className={variant === "dark" ? "text-[#FAF5EE]" : "text-[#23201C]"}
        >
          Kindled
        </span>
      )}
    </span>
  );
}
