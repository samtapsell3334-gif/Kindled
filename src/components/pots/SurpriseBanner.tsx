"use client";

import { ShieldAlert } from "lucide-react";

interface SurpriseBannerProps {
  recipientName: string;
  eventLabel: string;
}

export function SurpriseBanner({ recipientName, eventLabel }: SurpriseBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-3"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p className="text-[12px] leading-snug text-amber-200">
        <span className="font-semibold">This is a surprise for {recipientName}!</span>{" "}
        Help bridge the gap before {eventLabel} morning — without them knowing. 🤫
      </p>
    </div>
  );
}
