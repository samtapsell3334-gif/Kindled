"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventChipProps {
  label: string;
  date: string;
  className?: string;
}

export function EventChip({ label, date, className }: EventChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1",
        "border border-amber-400/25 backdrop-blur-sm",
        className,
      )}
    >
      <CalendarDays className="h-3 w-3 shrink-0 text-amber-400" aria-hidden />
      <span className="whitespace-nowrap text-[11px] font-medium text-amber-300">
        {label} · {date}
      </span>
    </span>
  );
}
