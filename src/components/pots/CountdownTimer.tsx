"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="tabular-nums text-[22px] font-bold leading-none text-amber-400">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-widest text-stone-500">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return <span className="mb-3 text-[18px] font-light text-amber-600/60">:</span>;
}

interface CountdownTimerProps {
  targetIso: string;
  /** Single-line "Christmas in 184 days" style readout for light, inline contexts. */
  compact?: boolean;
  eventLabel?: string;
}

export function CountdownTimer({ targetIso, compact, eventLabel }: CountdownTimerProps) {
  const target = new Date(targetIso);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(compute(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(compute(target)), 1_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);

  if (compact) {
    return (
      <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
        {eventLabel ? `${eventLabel} in ` : "Unwraps in "}
        {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h
      </span>
    );
  }

  return (
    <div className="flex items-end gap-2" role="timer" aria-live="off">
      <Unit value={timeLeft.days} label="days" />
      <Sep />
      <Unit value={timeLeft.hours} label="hrs" />
      <Sep />
      <Unit value={timeLeft.minutes} label="min" />
      <Sep />
      <Unit value={timeLeft.seconds} label="sec" />
    </div>
  );
}
