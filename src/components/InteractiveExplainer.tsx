"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Scene config ─────────────────────────────────────────────────────────────

const TOTAL = 120; // seconds

interface SceneConfig {
  index: number;
  title: string;
  startSec: number;
  endSec: number;
  caption: string;
}

const SCENES: SceneConfig[] = [
  {
    index: 0,
    title: "The Gifting Problem",
    startSec: 0,
    endSec: 20,
    caption:
      "Every year, billions of pounds are wasted on unwanted gifts that end up in landfills. Why do we keep buying clutter when we could be funding memories instead?",
  },
  {
    index: 1,
    title: "Meet Your Continuous Pots",
    startSec: 20,
    endSec: 45,
    caption:
      "Meet Kindling. Instead of temporary wish lists, you maintain lifetime Continuous Pots for the things you actually want — open year-round, steadily collecting contributions.",
  },
  {
    index: 2,
    title: "The Secret Gifting Layer",
    startSec: 45,
    endSec: 70,
    caption:
      "Got a birthday or Christmas coming up? Toggle on Wrapped Up mode. Your progress bar instantly locks — keeping the suspense alive so your surprise stays a surprise.",
  },
  {
    index: 3,
    title: "The Social Spark",
    startSec: 70,
    endSec: 95,
    caption:
      "While you're in the dark, your friends see the real progress. They can chip in instantly with one tap and record personal video messages — the closer to the goal, the more the word spreads!",
  },
  {
    index: 4,
    title: "The Magical Unwrap",
    startSec: 95,
    endSec: 120,
    caption:
      "On the big day, swipe to ignite! Watch the jackpot ticker climb to £450, a mosaic of friends snap together, and their video tributes play one by one. Gifting — made magical.",
  },
];

// per-scene accent classes (must be full Tailwind strings — no string building)
const SCENE_TEXT: readonly string[] = [
  "text-rose-400",
  "text-emerald-400",
  "text-violet-400",
  "text-sky-400",
  "text-amber-400",
];
const SCENE_DOT_ACTIVE: readonly string[] = [
  "bg-rose-400",
  "bg-emerald-400",
  "bg-violet-400",
  "bg-sky-400",
  "bg-amber-400",
];
const SCENE_BADGE_BG: readonly string[] = [
  "bg-rose-500/15",
  "bg-emerald-500/15",
  "bg-violet-500/15",
  "bg-sky-500/15",
  "bg-amber-500/15",
];

function getSceneIndex(time: number): number {
  for (let i = 0; i < SCENES.length; i++) {
    if (time < SCENES[i]!.endSec) return i;
  }
  return SCENES.length - 1;
}

function getSceneProgress(time: number, idx: number): number {
  const s = SCENES[idx]!;
  return Math.min(1, Math.max(0, (time - s.startSec) / (s.endSec - s.startSec)));
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Speech synthesis hook ────────────────────────────────────────────────────

function useSpeech() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const available = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!available) return;
    function load() {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.name === "Google UK English Female") ??
        voices.find((v) => v.name === "Google UK English Male") ??
        voices.find((v) => v.name === "Daniel") ??   // Apple UK male
        voices.find((v) => v.name === "Samantha") ?? // Apple US
        voices.find((v) => v.lang.startsWith("en-GB")) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [available]);

  const speak = useCallback((text: string, muted: boolean) => {
    if (!available || muted) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  }, [available]);

  const cancel = useCallback(() => {
    if (!available) return;
    window.speechSynthesis.cancel();
  }, [available]);

  const pauseSpeech = useCallback(() => {
    if (!available) return;
    window.speechSynthesis.pause();
  }, [available]);

  const resumeSpeech = useCallback(() => {
    if (!available) return;
    window.speechSynthesis.resume();
  }, [available]);

  return { speak, cancel, pauseSpeech, resumeSpeech };
}

// ─── Scene 1: The Gifting Problem ─────────────────────────────────────────────

function Scene1({ p }: { p: number }) {
  const showWallet = p >= 0;
  const showMoney  = p >= 0.15;
  const showArrow  = p >= 0.28;
  const showJunk   = p >= 0.40;
  const showBin    = p >= 0.60;
  const binFull    = p >= 0.82;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-[#1a0505] to-[#0d0d0d] px-4 py-5">
      <div className={cn("absolute top-3 left-3 rounded-lg px-2 py-1", SCENE_BADGE_BG[0])}>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", SCENE_TEXT[0])}>The Problem</span>
      </div>

      {/* Wallet + money */}
      <div className={cn("flex items-center gap-3 transition-all duration-700", showWallet ? "opacity-100 scale-100" : "opacity-0 scale-75")}>
        <span className="text-5xl">👛</span>
        {showMoney && (
          <div className="flex flex-col gap-0.5">
            {["£50", "£75", "£30"].map((v, i) => (
              <span
                key={v}
                className={cn(
                  "text-[11px] font-black text-emerald-400 transition-all duration-400",
                  showMoney ? "-translate-x-1 opacity-100" : "translate-x-2 opacity-0",
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {v} →
              </span>
            ))}
          </div>
        )}
      </div>

      {showArrow && <div className="text-stone-600 text-base animate-fade-up">↓ becomes</div>}

      {/* Junk items */}
      {showJunk && (
        <div className="flex items-end gap-4 animate-fade-up">
          {[
            { e: "🧦", l: "socks" },
            { e: "🗿", l: "trinket" },
            { e: "🛍️", l: "clutter" },
          ].map(({ e, l }, i) => (
            <div
              key={l}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-all duration-500",
                showJunk ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
              )}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="text-3xl animate-wobble">{e}</span>
              <span className="text-[8px] text-stone-600">{l}</span>
            </div>
          ))}
        </div>
      )}

      {showBin && <div className="text-stone-600 text-base animate-fade-up">↓</div>}

      {/* Trash bin */}
      {showBin && (
        <div className="flex flex-col items-center gap-1 animate-scale-in">
          <span className="text-5xl">{binFull ? "🗑️" : "🗑️"}</span>
          {binFull && (
            <div className="rounded-full bg-rose-500/20 px-2.5 py-0.5 animate-fade-up">
              <span className={cn("text-[9px] font-bold", SCENE_TEXT[0])}>
                £6.4 billion wasted every year
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scene 2: Continuous Pots ─────────────────────────────────────────────────

function Scene2({ p }: { p: number }) {
  const showCard  = p >= 0.05;
  const fillPct   = Math.min(100, Math.round(Math.max(0, (p - 0.05) / 0.75) * 100));
  const showCoins = p >= 0.18;
  const showChip  = p >= 0.62;

  const raised = Math.round((fillPct / 100) * 450);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-[#031208] to-[#0d0d0d] px-4 py-5">
      <div className={cn("absolute top-3 left-3 rounded-lg px-2 py-1", SCENE_BADGE_BG[1])}>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", SCENE_TEXT[1])}>The Solution</span>
      </div>

      {/* Falling coins */}
      {showCoins && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 flex justify-around">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="animate-coin-drop text-base"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              🪙
            </span>
          ))}
        </div>
      )}

      {/* Mock pot card */}
      {showCard && (
        <div className={cn(
          "w-full max-w-[252px] rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-xl transition-all duration-700",
          showCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">🚵</div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-stone-100">Mountain Bike</p>
              <p className={cn("text-[11px] font-medium transition-colors duration-500", fillPct >= 100 ? SCENE_TEXT[1] : "text-amber-400")}>
                {fillPct >= 100 ? "Fully funded! 🎉" : "Collecting contributions..."}
              </p>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <div className="mt-1.5 flex justify-between">
            <span className="text-[11px] text-stone-600">£0</span>
            <span className="text-[11px] font-semibold text-stone-300">
              £{raised}<span className="text-stone-600"> / £450</span>
            </span>
          </div>

          {/* Avatar row */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {(
                [
                  { i: "JO", bg: "#451a03", c: "#f59e0b", thresh: 20 },
                  { i: "SC", bg: "#2e1065", c: "#8b5cf6", thresh: 45 },
                  { i: "MD", bg: "#450a0a", c: "#ef4444", thresh: 65 },
                ] as const
              ).map(({ i, bg, c, thresh }) => (
                <div
                  key={i}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-stone-900 text-[8px] font-bold transition-all duration-500"
                  style={{
                    backgroundColor: bg,
                    color: c,
                    opacity: fillPct >= thresh ? 1 : 0,
                    transform: fillPct >= thresh ? "scale(1)" : "scale(0.6)",
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
            {fillPct >= 20 && (
              <span className="text-[10px] text-stone-500 animate-fade-up">
                {Math.max(1, Math.ceil(fillPct / 25))} contributors
              </span>
            )}
          </div>
        </div>
      )}

      {showChip && (
        <div className={cn("animate-fade-up rounded-full border px-3 py-1.5", "border-emerald-500/30 bg-emerald-500/10")}>
          <span className={cn("text-[11px] font-semibold", SCENE_TEXT[1])}>
            ♾️ Open year-round — never expires
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Scene 3: The Secret Gifting Layer ────────────────────────────────────────

function Scene3({ p }: { p: number }) {
  const toggled      = p >= 0.36;
  const showGiftBox  = p >= 0.52;
  const showCountdown = p >= 0.72;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-[#100820] to-[#0d0d0d] px-4 py-5">
      <div className={cn("absolute top-3 left-3 rounded-lg px-2 py-1", SCENE_BADGE_BG[2])}>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", SCENE_TEXT[2])}>Receiver View</span>
      </div>

      <div className={cn(
        "w-full max-w-[252px] rounded-2xl border bg-stone-900 p-4 shadow-xl transition-all duration-600",
        toggled ? "border-violet-500/30 bg-[#150b25]" : "border-stone-800",
      )}>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚵</span>
            <span className="text-[13px] font-bold text-stone-100">Mountain Bike</span>
          </div>
          {/* Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-stone-500">Wrapped Up</span>
            <div className={cn(
              "relative h-5 w-9 rounded-full transition-all duration-500",
              toggled ? "bg-violet-500" : "bg-stone-700",
            )}>
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-500",
                toggled ? "left-4" : "left-0.5",
              )} />
            </div>
          </div>
        </div>

        {/* Progress bar → gift box swap */}
        <div className="relative overflow-hidden">
          {/* Before */}
          <div className={cn("transition-all duration-500", showGiftBox ? "opacity-0 max-h-0" : "opacity-100 max-h-20")}>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800">
              <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[11px] text-stone-500">£320 / £450</span>
              <span className={cn("text-[11px]", SCENE_TEXT[1])}>71%</span>
            </div>
          </div>

          {/* After */}
          {showGiftBox && (
            <div className="animate-gift-glow-plum rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-700/25 to-fuchsia-800/15">
              <div className="animate-scale-in flex flex-col items-center gap-2 py-4">
                <span className="text-4xl">🎀</span>
                <p className="text-[12px] font-semibold text-stone-200">Locked — Unwraps Jun 28</p>
                <div className="flex items-center gap-1 rounded-full bg-stone-800/60 px-2.5 py-1">
                  <span className="text-[10px]">🔒</span>
                  <span className="text-[10px] text-stone-400">Balance hidden from you</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Countdown */}
        {showCountdown && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 animate-fade-up">
            {[{ v: "12", l: "days" }, { v: "06", l: "hrs" }, { v: "43", l: "min" }].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center rounded-lg border border-violet-500/20 bg-violet-900/30 px-2.5 py-1.5">
                <span className="text-[15px] font-black tabular-nums text-violet-300">{v}</span>
                <span className="text-[7px] text-violet-500 uppercase">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="animate-fade-up rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
        <span className={cn("text-[11px] font-semibold", SCENE_TEXT[2])}>🔮 Suspense fully preserved</span>
      </div>
    </div>
  );
}

// ─── Scene 4: The Social Spark ────────────────────────────────────────────────

function Scene4({ p }: { p: number }) {
  const showCard     = p >= 0.05;
  const showTransfer = p >= 0.38;
  const transferDone = p >= 0.60;
  const showCamera   = p >= 0.72;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-gradient-to-b from-[#031218] to-[#0d0d0d] px-4 py-5">
      <div className={cn("absolute top-3 left-3 rounded-lg px-2 py-1", SCENE_BADGE_BG[3])}>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", SCENE_TEXT[3])}>Giver View</span>
      </div>

      {showCard && (
        <div className={cn(
          "w-full max-w-[252px] rounded-2xl border border-stone-800 bg-stone-900 p-4 shadow-xl transition-all duration-700",
          showCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-xl">🚵</div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-stone-100">Mountain Bike</p>
              <p className={cn("text-[11px] font-medium", SCENE_TEXT[3])}>85% funded — help push it over!</p>
            </div>
          </div>

          {/* 85% bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-700" />
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-[11px] text-stone-500">£383 raised</span>
            <span className={cn("text-[11px]", SCENE_TEXT[3])}>£67 to go</span>
          </div>

          {/* CTA / transfer */}
          <div className="mt-3">
            {!showTransfer && (
              <div className="rounded-xl bg-gradient-to-r from-sky-500 to-teal-400 px-4 py-2.5 text-center">
                <span className="text-[12px] font-bold text-stone-900">⚡ Chip In £20</span>
              </div>
            )}
            {showTransfer && !transferDone && (
              <div className="relative overflow-hidden rounded-xl bg-stone-800 px-4 py-2.5 text-center">
                <span className="text-[12px] text-stone-400">Processing via Open Banking...</span>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="animate-transfer text-xl">💸</span>
                </div>
              </div>
            )}
            {transferDone && (
              <div className="animate-scale-in rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center">
                <span className={cn("text-[12px] font-bold", SCENE_TEXT[1])}>✅ £20 sent instantly!</span>
              </div>
            )}
          </div>

          {/* Camera prompt */}
          {showCamera && (
            <div className="mt-2.5 animate-fade-up flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
              <span className="text-xl shrink-0">🎥</span>
              <div>
                <p className="text-[11px] font-semibold text-amber-300">Record a video tribute?</p>
                <p className="text-[9px] text-stone-500">Leave Leo a personal message</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="animate-fade-up rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1">
        <span className={cn("text-[11px] font-semibold", SCENE_TEXT[3])}>🔗 A2A Open Banking · instant settlement</span>
      </div>
    </div>
  );
}

// ─── Scene 5: The Magical Unwrap ─────────────────────────────────────────────

const S5_AVATARS = [
  { initials: "JO", bg: "#451a03", color: "#f59e0b" },
  { initials: "SC", bg: "#2e1065", color: "#8b5cf6" },
  { initials: "MD", bg: "#450a0a", color: "#ef4444" },
  { initials: "TW", bg: "#022c22", color: "#10b981" },
  { initials: "PP", bg: "#172554", color: "#3b82f6" },
  { initials: "WC", bg: "#431407", color: "#f97316" },
] as const;

function Scene5({ p }: { p: number }) {
  const swiped      = p >= 0.22;
  const showCounter = p >= 0.22;
  const counterVal  = showCounter ? Math.min(450, Math.round(((p - 0.22) / 0.30) * 450)) : 0;
  const showMosaic  = p >= 0.52;
  const showTributes = p >= 0.74;

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-2.5 overflow-hidden bg-gradient-to-b from-[#1a0e04] to-[#0d0d0d] px-4 py-4">
      <div className={cn("absolute top-3 left-3 rounded-lg px-2 py-1", SCENE_BADGE_BG[4])}>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", SCENE_TEXT[4])}>The Reveal</span>
      </div>

      {/* Pre-swipe ignition */}
      {!swiped && (
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <span className="text-5xl">🎁</span>
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2.5">
            <span className={cn("animate-swipe-bounce text-sm", SCENE_TEXT[4])}>→</span>
            <span className={cn("text-[13px] font-bold", SCENE_TEXT[4])}>Slide to ignite</span>
            <span className={cn("animate-swipe-bounce text-sm", SCENE_TEXT[4])}>→</span>
          </div>
        </div>
      )}

      {/* Jackpot counter */}
      {showCounter && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[16px] font-black text-stone-500">£</span>
            <span className={cn("text-[52px] font-black tabular-nums leading-none animate-digit-lock", SCENE_TEXT[4])}>
              {String(counterVal).padStart(3, "0")}
            </span>
          </div>
          {counterVal >= 450 && (
            <div className="animate-scale-in rounded-full bg-emerald-500/20 px-3 py-1">
              <span className={cn("text-[11px] font-bold", SCENE_TEXT[1])}>✨ 100% FUNDED</span>
            </div>
          )}
        </div>
      )}

      {/* Avatar mosaic */}
      {showMosaic && (
        <div className="grid grid-cols-3 gap-1.5 animate-scale-in">
          {S5_AVATARS.map((a, i) => (
            <div
              key={a.initials}
              className="avatar-fly flex h-11 w-11 items-center justify-center rounded-xl text-[11px] font-bold"
              style={{
                backgroundColor: a.bg,
                color: a.color,
                border: `1.5px solid ${a.color}55`,
                animationDelay: `${i * 55}ms`,
              }}
            >
              {a.initials}
            </div>
          ))}
        </div>
      )}

      {/* Tribute bubbles */}
      {showTributes && (
        <div className="flex w-full max-w-[240px] flex-col gap-1.5">
          {[
            { e: "🧔", name: "Jamie", msg: "Get shredding mate! 🤘" },
            { e: "👩‍🦱", name: "Sarah", msg: "So well deserved! 🚵‍♀️" },
          ].map((t, i) => (
            <div
              key={t.name}
              className="animate-fade-up flex items-center gap-2 rounded-xl border border-stone-700/50 bg-stone-800/80 p-2"
              style={{ animationDelay: `${i * 180}ms` }}
            >
              <span className="shrink-0 text-lg">{t.e}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-stone-300">{t.name}</p>
                <p className="truncate text-[10px] text-stone-400">&ldquo;{t.msg}&rdquo;</p>
              </div>
              <span className="shrink-0 text-xs">▶️</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline scrub bar ────────────────────────────────────────────────────────

function TimelineBar({
  currentTime,
  onSeek,
}: {
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function seekAt(clientX: number) {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(pct * TOTAL);
  }

  return (
    <div
      ref={barRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={TOTAL}
      aria-valuenow={Math.round(currentTime)}
      aria-label="Playback position"
      className="group relative flex h-6 w-full cursor-pointer items-center select-none"
      onMouseDown={(e) => { dragging.current = true; seekAt(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) seekAt(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => { e.preventDefault(); seekAt(e.touches[0]!.clientX); }}
      onTouchMove={(e) => { e.preventDefault(); seekAt(e.touches[0]!.clientX); }}
    >
      {/* Track */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-none"
          style={{ width: `${(currentTime / TOTAL) * 100}%` }}
        />
      </div>

      {/* Scene boundary markers */}
      {SCENES.slice(0, -1).map((s) => (
        <div
          key={s.index}
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-stone-600"
          style={{ left: `${(s.endSec / TOTAL) * 100}%` }}
        />
      ))}

      {/* Thumb */}
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
        style={{ left: `${(currentTime / TOTAL) * 100}%` }}
      />
    </div>
  );
}

// ─── InteractiveExplainer ─────────────────────────────────────────────────────

const SCENE_COMPONENTS = [Scene1, Scene2, Scene3, Scene4, Scene5] as const;

export interface InteractiveExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InteractiveExplainer({ isOpen, onClose }: InteractiveExplainerProps) {
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isMuted, setIsMuted]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [captionKey, setCaptionKey] = useState(0);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSceneRef   = useRef(-1);
  const mountedRef     = useRef(false);

  const { speak, cancel, pauseSpeech, resumeSpeech } = useSpeech();

  const sceneIndex    = getSceneIndex(currentTime);
  const sceneProgress = getSceneProgress(currentTime, sceneIndex);
  const scene         = SCENES[sceneIndex]!;
  const SceneComponent = SCENE_COMPONENTS[sceneIndex]!;

  // ── Playback timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          const next = +(t + 0.1).toFixed(1);
          if (next >= TOTAL) { setIsPlaying(false); return TOTAL; }
          return next;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  // ── Scene change → speech ───────────────────────────────────────────────────
  useEffect(() => {
    if (sceneIndex !== prevSceneRef.current) {
      prevSceneRef.current = sceneIndex;
      setCaptionKey((k) => k + 1);
      speak(scene.caption, isMuted);
    }
  }, [sceneIndex, scene.caption, isMuted, speak]);

  // ── Play/pause → speech engine ──────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) resumeSpeech(); else pauseSpeech();
  }, [isPlaying, pauseSpeech, resumeSpeech]);

  // ── Mute toggle → speech engine ─────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (isMuted) {
      cancel();
    } else if (isPlaying) {
      speak(scene.caption, false);
    }
  }, [isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) { setIsPlaying(false); cancel(); }
  }, [isOpen, cancel]);

  function handleSeek(t: number) {
    const clamped = Math.max(0, Math.min(TOTAL, t));
    setCurrentTime(clamped);
    cancel();
    const newIdx = getSceneIndex(clamped);
    if (newIdx !== prevSceneRef.current) {
      prevSceneRef.current = newIdx;
      setCaptionKey((k) => k + 1);
    }
    if (!isMuted) speak(SCENES[newIdx]!.caption, false);
  }

  function handlePlayPause() {
    if (currentTime >= TOTAL) {
      setCurrentTime(0);
      prevSceneRef.current = -1;
      setCaptionKey((k) => k + 1);
    }
    setIsPlaying((v) => !v);
  }

  function handleClose() {
    cancel();
    setIsPlaying(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Modal card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-700/50 bg-stone-950 shadow-2xl shadow-black/70 animate-scale-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-stone-800/60 px-5 pt-4 pb-3">
          <div>
            <p className="text-[13px] font-bold text-stone-100">How Kindling Works</p>
            <p className="text-[11px] text-stone-500">
              Scene {sceneIndex + 1}/{SCENES.length} &nbsp;·&nbsp;
              <span className={SCENE_TEXT[sceneIndex]}>{scene.title}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-100 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scene viewport (mock phone frame) ── */}
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-stone-800">
          {/* Fake status bar */}
          <div className="flex items-center justify-between bg-stone-900 px-4 py-1.5">
            <span className="text-[9px] font-medium tabular-nums text-stone-600">9:41</span>
            <div className="flex items-center gap-1.5 text-[9px] text-stone-600">
              <span>▲▲▲</span>
              <span>WiFi</span>
              <span>🔋</span>
            </div>
          </div>
          {/* Scene */}
          <div className="h-56">
            <SceneComponent p={sceneProgress} />
          </div>
        </div>

        {/* ── Subtitle panel ── */}
        <div className="mx-4 mt-3 min-h-[68px] rounded-xl border border-stone-800/40 bg-stone-900/40 px-4 py-3">
          <p
            key={captionKey}
            className="animate-caption text-[12px] leading-relaxed text-stone-300"
          >
            <span className={cn("mr-1 font-black", SCENE_TEXT[sceneIndex])}>
              {sceneIndex + 1}.
            </span>
            {scene.caption}
          </p>
        </div>

        {/* ── Controls ── */}
        <div className="px-5 pt-3 pb-5">
          {/* Timeline */}
          <TimelineBar currentTime={currentTime} onSeek={handleSeek} />

          {/* Control row */}
          <div className="mt-2.5 flex items-center justify-between">
            {/* Elapsed */}
            <span className="min-w-[76px] text-[11px] tabular-nums text-stone-500">
              {fmt(currentTime)} / {fmt(TOTAL)}
            </span>

            {/* Play / pause */}
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-gradient-to-br from-amber-400 to-orange-500",
                "shadow-lg shadow-amber-900/30 transition-transform active:scale-90",
              )}
            >
              {isPlaying
                ? <Pause className="h-5 w-5 text-stone-900" strokeWidth={2.5} fill="currentColor" />
                : <Play  className="h-5 w-5 translate-x-0.5 text-stone-900" strokeWidth={2.5} fill="currentColor" />
              }
            </button>

            {/* Mute */}
            <div className="flex min-w-[76px] justify-end">
              <button
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 transition-colors",
                  isMuted ? "text-stone-600" : "text-stone-400 hover:text-stone-200",
                )}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Scene dot navigation */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {SCENES.map((s, i) => (
              <button
                key={s.index}
                onClick={() => handleSeek(s.startSec + 0.1)}
                aria-label={`Jump to scene ${i + 1}: ${s.title}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === sceneIndex
                    ? cn("w-6", SCENE_DOT_ACTIVE[i])
                    : "w-1.5 bg-stone-700 hover:bg-stone-500",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
