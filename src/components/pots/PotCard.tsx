"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventChip } from "./EventChip";
import { FundingBar } from "./FundingBar";
import { ShareButton } from "./ShareButton";
import { CountdownTimer } from "./CountdownTimer";
import { SurpriseBanner } from "./SurpriseBanner";
import { UnwrapCeremony } from "@/components/UnwrapCeremony";
import type { GiftingMode, PotCardData } from "@/types/pots";

export type { PotCardData };

interface PotCardProps {
  pot: PotCardData;
}

// ─── Snow particles (UNDER_THE_TREE) ─────────────────────────────────────────

const SNOW_SEEDS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 347) % 90}%`,
  dur: `${2.2 + (i * 0.17) % 1.6}s`,
  delay: `${(i * 0.23) % 2.8}s`,
  sx: `${-8 + (i * 31) % 16}px`,
  drift: `${4 + (i * 11) % 12}px`,
  size: 3 + (i % 3),
}));

function SnowOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {SNOW_SEEDS.map((s) => (
        <span
          key={s.id}
          className="animate-snow absolute rounded-full bg-white/80"
          style={{
            left: s.left,
            top: 0,
            width: s.size,
            height: s.size,
            "--dur": s.dur,
            "--sx": s.sx,
            "--drift": s.drift,
            animationDelay: s.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Confetti particles (WRAPPED_UP) ─────────────────────────────────────────

const CONFETTI_SEEDS = Array.from({ length: 20 }, (_, i) => {
  const colors = [
    "bg-violet-400","bg-pink-400","bg-fuchsia-400",
    "bg-purple-400","bg-rose-400","bg-amber-400",
  ];
  return {
    id: i,
    left: `${3 + (i * 293) % 94}%`,
    dur: `${1.8 + (i * 0.19) % 1.4}s`,
    delay: `${(i * 0.21) % 2.5}s`,
    rot: `${180 + (i * 73) % 540}deg`,
    color: colors[i % colors.length]!,
    w: 4 + (i % 4),
    h: 6 + (i % 5),
  };
});

function ConfettiOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {CONFETTI_SEEDS.map((c) => (
        <span
          key={c.id}
          className={cn("animate-confetti absolute rounded-sm", c.color)}
          style={{
            left: c.left,
            top: 0,
            width: c.w,
            height: c.h,
            "--dur": c.dur,
            "--rot": c.rot,
            animationDelay: c.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Locked card themes ───────────────────────────────────────────────────────

interface LockedTheme {
  bg: string;
  border: string;
  glowClass: string;
  boxGradient: string;
  boxEmoji: string;
  boxEmojiLabel: string;
  accentStripe: string;
  labelColor: string;
  modeLabel: string;
  countdownLabel: string;
  unlockBtnClass: string;
  Particles: () => React.ReactElement;
}

function getLockedTheme(mode: GiftingMode): LockedTheme {
  if (mode === "WRAPPED_UP") {
    return {
      bg: "bg-[#1a1028]",
      border: "border-violet-500/30",
      glowClass: "animate-gift-glow-plum",
      boxGradient: "from-violet-600/25 to-fuchsia-700/20",
      boxEmoji: "🎀",
      boxEmojiLabel: "Birthday gift",
      accentStripe: "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500",
      labelColor: "text-violet-400",
      modeLabel: "Wrapped Up ✨",
      countdownLabel: "Birthday",
      unlockBtnClass: "from-violet-500 to-fuchsia-500 shadow-violet-900/40",
      Particles: ConfettiOverlay,
    };
  }
  return {
    bg: "bg-[#1a0f0f]",
    border: "border-red-700/30",
    glowClass: "animate-gift-glow",
    boxGradient: "from-red-800/30 to-amber-700/20",
    boxEmoji: "🎁",
    boxEmojiLabel: "Christmas gift",
    accentStripe: "bg-gradient-to-r from-red-700 via-amber-500 to-red-600",
    labelColor: "text-amber-400",
    modeLabel: "Under the Tree 🎄",
    countdownLabel: "Reveal",
    unlockBtnClass: "from-amber-400 to-orange-500 shadow-amber-900/40",
    Particles: SnowOverlay,
  };
}

// ─── Locked card (receiver view) ─────────────────────────────────────────────

function LockedCard({ pot }: { pot: PotCardData }) {
  const [showCeremony, setShowCeremony] = useState(false);
  const theme = useMemo(() => getLockedTheme(pot.mode), [pot.mode]);
  const { Particles } = theme;

  const isUnlockDay = new Date() >= new Date(pot.event.isoDate);

  return (
    <>
      {showCeremony && (
        <UnwrapCeremony
          potTitle={pot.title}
          potEmoji={pot.emoji}
          raised={pot.raised}
          goal={pot.goal}
          mode={pot.mode}
          tributes={pot.tributes}
          boosterEntries={pot.boosterEntries}
          onClose={() => setShowCeremony(false)}
        />
      )}

      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-lg shadow-black/50",
          theme.bg,
          theme.border,
        )}
      >
        <Particles />
        <div className={cn("h-[3px] w-full", theme.accentStripe)} />

        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-xl">
                🎁
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold tracking-tight text-stone-100">
                  {pot.title}
                </h3>
                <p className={cn("text-[11px] font-medium", theme.labelColor)}>
                  {theme.modeLabel}
                </p>
              </div>
            </div>
            <EventChip label={pot.event.label} date={pot.event.date} className="shrink-0" />
          </div>

          {/* Gift box */}
          <div
            className={cn(
              theme.glowClass,
              "mt-4 flex flex-col items-center gap-3 rounded-xl py-5",
              "border border-white/5 bg-gradient-to-b",
              theme.boxGradient,
            )}
          >
            <span className="text-5xl select-none" role="img" aria-label={theme.boxEmojiLabel}>
              {theme.boxEmoji}
            </span>
            <p className="px-3 text-center text-[13px] font-semibold text-stone-200">
              Locked — Unwraps {pot.event.date}
            </p>

            {isUnlockDay ? (
              <button
                onClick={() => setShowCeremony(true)}
                className={cn(
                  "mt-1 flex items-center gap-1.5 rounded-full px-5 py-2.5",
                  "bg-gradient-to-r text-[13px] font-bold text-stone-900 shadow-lg",
                  "transition-transform active:scale-95",
                  theme.unlockBtnClass,
                )}
              >
                🎉 Unwrap now!
              </button>
            ) : (
              <CountdownTimer targetIso={pot.event.isoDate} />
            )}
          </div>

          {/* Footer */}
          <div className="mt-3.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-stone-500">
              <Users className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[12px] text-stone-500">Contributions hidden until reveal</span>
            </div>
            <ShareButton potId={pot.id} />
          </div>
        </div>
      </article>
    </>
  );
}

// ─── Live / contributor view ──────────────────────────────────────────────────

function LiveCard({ pot }: { pot: PotCardData }) {
  const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
  const isContributorSurpriseView = pot.mode !== "LIVE_FEED" && !pot.isLocked;

  const statusLabel =
    pct >= 100 ? "Funded 🎉" : pct >= 50 ? "Halfway there" : "Just getting started";
  const statusColor =
    pct >= 100 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-orange-400";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl bg-stone-900 shadow-lg shadow-black/40",
        "border border-stone-800/80",
      )}
    >
      <div className={cn("h-[3px] w-full", pot.accentGradient)} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">
              {pot.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-stone-100">
                {pot.title}
              </h3>
              <p className={cn("text-[11px] font-medium", statusColor)}>{statusLabel}</p>
            </div>
          </div>
          <EventChip label={pot.event.label} date={pot.event.date} className="shrink-0" />
        </div>

        {isContributorSurpriseView && (
          <div className="mt-3">
            <SurpriseBanner
              recipientName={pot.recipientName}
              eventLabel={pot.event.label}
            />
          </div>
        )}

        <FundingBar raised={pot.raised} goal={pot.goal} className="mt-4" />

        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-stone-400">
            <Users className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[12px]">
              <span className="font-semibold text-stone-300">{pot.contributors}</span>{" "}
              {pot.contributors === 1 ? "contributor" : "contributors"}
            </span>
          </div>
          <ShareButton potId={pot.id} />
        </div>
      </div>
    </article>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function PotCard({ pot }: PotCardProps) {
  if (pot.isLocked) return <LockedCard pot={pot} />;
  return <LiveCard pot={pot} />;
}
