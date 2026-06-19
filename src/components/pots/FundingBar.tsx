"use client";

import { cn } from "@/lib/utils";

interface FundingBarProps {
  raised: number;
  goal: number;
  className?: string;
  /** Under Wraps mode — hides the exact raised £ and numeric %, showing a heat-themed label instead. */
  hideAmounts?: boolean;
}

function heatLabel(pct: number) {
  if (pct >= 95) return "Combustion Level: Blazing Hot!";
  if (pct >= 70) return "Flame Intensity: Stoking up!";
  if (pct >= 40) return "Kindle Progress: Catching Sparks";
  return "Spark Level: Smoldering";
}

export function FundingBar({ raised, goal, className, hideAmounts }: FundingBarProps) {
  const pct = Math.min(100, Math.round((raised / goal) * 100));

  const trackColor =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-400"
        : "bg-orange-500";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-700/60">
        <div
          role="progressbar"
          aria-valuenow={hideAmounts ? undefined : pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={hideAmounts ? heatLabel(pct) : `${pct}% funded`}
          style={{ width: `${pct}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            "shadow-[0_0_8px_0_rgba(251,191,36,0.45)]",
            trackColor,
          )}
        />
      </div>

      {/* Legend */}
      {hideAmounts ? (
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-amber-300">{heatLabel(pct)}</p>
          <span className="text-[12px] font-semibold text-stone-400">
            Target: £{goal.toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-stone-200">
            <span className="text-amber-400">£{raised.toLocaleString()}</span>
            <span className="text-stone-400"> raised of </span>
            <span className="text-stone-300">£{goal.toLocaleString()}</span>
          </p>
          <span className="text-[12px] font-semibold tabular-nums text-stone-400">
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
