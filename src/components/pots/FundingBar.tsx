"use client";

import { cn } from "@/lib/utils";

interface FundingBarProps {
  raised: number;
  goal: number;
  className?: string;
  /** Under Wraps mode — hides the exact raised £ and numeric %, showing a heat-themed label instead. */
  hideAmounts?: boolean;
  /** Palette: "dark" for charcoal/reveal surfaces (default), "light" for bone Monochrome-Luxe cards. */
  tone?: "dark" | "light";
}

function heatLabel(pct: number) {
  if (pct >= 95) return "Combustion Level: Blazing Hot!";
  if (pct >= 70) return "Flame Intensity: Stoking up!";
  if (pct >= 40) return "Kindle Progress: Catching Sparks";
  return "Spark Level: Smoldering";
}

export function FundingBar({ raised, goal, className, hideAmounts, tone = "dark" }: FundingBarProps) {
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const light = tone === "light";

  // Light (Monochrome Luxe) uses the single Electric-Amber accent; dark keeps the heat ramp.
  const trackColor = light
    ? "bg-[#ffb800]"
    : pct >= 100
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-400"
        : "bg-orange-500";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Track */}
      <div className={cn("relative h-2 w-full overflow-hidden", light ? "bg-[rgba(10,10,10,0.1)]" : "rounded-full bg-stone-700/60")}>
        <div
          role="progressbar"
          aria-valuenow={hideAmounts ? undefined : pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={hideAmounts ? heatLabel(pct) : `${pct}% funded`}
          style={{ width: `${pct}%` }}
          className={cn(
            "h-full transition-all duration-700 ease-out",
            light ? "" : "rounded-full",
            "shadow-[0_0_8px_0_rgba(255,184,0,0.5)]",
            trackColor,
          )}
        />
      </div>

      {/* Legend */}
      {hideAmounts ? (
        <div className="flex items-baseline justify-between">
          <p className={cn("text-[13px] font-medium", light ? "text-[#0a0a0a]/70" : "text-amber-300")}>{heatLabel(pct)}</p>
          <span className={cn("text-[12px] font-semibold", light ? "text-[#0a0a0a]/45" : "text-stone-400")}>
            Target: £{goal.toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium">
            <span className={light ? "font-semibold text-[#0a0a0a]" : "text-amber-400"}>£{raised.toLocaleString()}</span>
            <span className={light ? "text-[#0a0a0a]/45" : "text-stone-400"}> raised of </span>
            <span className={light ? "text-[#0a0a0a]/60" : "text-stone-300"}>£{goal.toLocaleString()}</span>
          </p>
          <span className={cn("text-[12px] font-semibold tabular-nums", light ? "text-[#0a0a0a]/50" : "text-stone-400")}>
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
