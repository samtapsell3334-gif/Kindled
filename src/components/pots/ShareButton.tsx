"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  potId: string;
  className?: string;
}

export function ShareButton({ potId, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (copied) return;

    const url = `${window.location.origin}/pots/${potId}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button
      onClick={() => { void handleCopy(); }}
      aria-label={copied ? "Link copied!" : "Copy share link"}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium",
        "border transition-all duration-200 active:scale-95",
        copied
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
          : "border-stone-600/60 bg-stone-800/60 text-stone-400 hover:border-amber-500/40 hover:text-amber-400",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Link2 className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied!" : "Share link"}
    </button>
  );
}
