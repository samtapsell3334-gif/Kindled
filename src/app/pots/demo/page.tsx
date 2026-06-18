"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Share2, Check, Lock, Plus, Users, ChevronUp, ChevronDown,
  Play, Pause, SkipForward, Volume2, VolumeX, X, Zap,
  ShoppingBag, RefreshCw, CreditCard, Gift,
} from "lucide-react";
import { FundingBar } from "@/components/pots/FundingBar";
import { CountdownTimer } from "@/components/pots/CountdownTimer";
import { cn } from "@/lib/utils";
import type { GiftingMode } from "@/types/pots";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryCard {
  id: string;
  name: string;
  emoji: string;
  message: string;
  rot: number;
  delay: number;
  hasVideo?: boolean;
}

interface DemoPot {
  id: string;
  title: string;
  emoji: string;
  goal: number;
  raised: number;
  mode: GiftingMode;
  continuous: boolean;
  eventLabel: string;
  eventDate: string;
  eventIso: string;
  contributors: number;
  boosterEntries: number;
  accentGradient: string;
  tributes: MemoryCard[];
}

interface ChecklistItem {
  id: string;
  name: string;
  price: number;
  status: "claimed" | "available";
  claimedBy?: string;
  claimedEmoji?: string;
  shippingNote?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  tag: string;
  tagColor: string;
  glowColor: string;
}

interface ExplainerScene {
  id: number;
  title: string;
  caption: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_POTS: DemoPot[] = [
  {
    id: "p1", title: "Super-Fast Mountain Bike", emoji: "🚵",
    goal: 450, raised: 310, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 7, boosterEntries: 0,
    accentGradient: "from-emerald-500 via-teal-400 to-cyan-400",
    tributes: [],
  },
  {
    id: "p2", title: "LEGO Star Wars Millennium Falcon", emoji: "🚀",
    goal: 730, raised: 730, mode: "UNDER_THE_TREE", continuous: true,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 9, boosterEntries: 8,
    accentGradient: "from-red-700 via-amber-500 to-red-600",
    tributes: [
      { id: "t1", name: "Grandma Jean", emoji: "👵", rot: -4, delay: 0,
        message: "Happy Christmas sweetheart! We knew you wanted this forever. Build it with love! 🎄", hasVideo: true },
      { id: "t2", name: "Uncle Pete", emoji: "🧔", rot: 3, delay: 120,
        message: "7541 pieces... good luck! 😂 Happy Christmas mate, enjoy every single one!" },
      { id: "t3", name: "Dad", emoji: "👨", rot: -2, delay: 240,
        message: "Merry Christmas! Build it before New Year's — I'll time you! 🚀", hasVideo: true },
      { id: "t4", name: "The School Crew", emoji: "👫", rot: 2, delay: 360,
        message: "Happy Christmas from all of us! Can't wait to see it finished! 🎁" },
    ],
  },
  {
    id: "p3", title: "Retro Arcade Cabinet", emoji: "🕹️",
    goal: 250, raised: 80, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 3, boosterEntries: 0,
    accentGradient: "from-fuchsia-500 via-purple-400 to-indigo-500",
    tributes: [],
  },
  {
    id: "p4", title: "Ultimate 10th Birthday Party", emoji: "🎂",
    goal: 300, raised: 300, mode: "WRAPPED_UP", continuous: false,
    eventLabel: "Birthday", eventDate: "Jun 28", eventIso: "2026-06-28T10:00:00Z",
    contributors: 5, boosterEntries: 3,
    accentGradient: "from-violet-500 via-fuchsia-400 to-pink-500",
    tributes: [
      { id: "b1", name: "Mum & Dad", emoji: "👨‍👩‍👦", rot: -3, delay: 0,
        message: "Happy 10th birthday Billy! We are SO proud of you! 🎂❤️", hasVideo: true },
      { id: "b2", name: "Auntie Claire", emoji: "👩‍🦰", rot: 4, delay: 140,
        message: "TEN! Already! Have the best party ever — you deserve it! 🎈🎉" },
      { id: "b3", name: "School Friends", emoji: "👫", rot: -1, delay: 260,
        message: "Happy birthday from the whole class!! Best day ever! 🎈🎈🎈", hasVideo: true },
    ],
  },
];

const CHECKLIST: ChecklistItem[] = [
  {
    id: "cl1", name: "LEGO Space Shuttle Explorer", price: 25,
    status: "claimed", claimedBy: "Grandma Linda", claimedEmoji: "👵",
    shippingNote: "Shipped directly from Amazon · Arrives Dec 23",
  },
  {
    id: "cl2", name: "Adventure Book Series (x3)", price: 15,
    status: "claimed", claimedBy: "Uncle Steve", claimedEmoji: "👨‍🦲",
    shippingNote: "Bringing to the party in person",
  },
  {
    id: "cl3", name: "Marvel Action Figure Set", price: 18,
    status: "available",
  },
];

const CATALOGUE: CatalogItem[] = [
  { id: "c1", name: "Nintendo Switch OLED", emoji: "🎮", price: 309.99, tag: "Popular", tagColor: "bg-red-500/20 text-red-300", glowColor: "#ef4444" },
  { id: "c2", name: "Electric Scooter Pro", emoji: "🛴", price: 399.99, tag: "Trending", tagColor: "bg-emerald-500/20 text-emerald-300", glowColor: "#10b981" },
  { id: "c3", name: "Meta Quest 3 VR", emoji: "🥽", price: 499.99, tag: "High Intent", tagColor: "bg-violet-500/20 text-violet-300", glowColor: "#8b5cf6" },
  { id: "c4", name: "LEGO Technic Ferrari", emoji: "🏎️", price: 189.99, tag: "Bestseller", tagColor: "bg-amber-500/20 text-amber-300", glowColor: "#f59e0b" },
  { id: "c5", name: "Air Hockey Table", emoji: "🏒", price: 199.99, tag: "New", tagColor: "bg-pink-500/20 text-pink-300", glowColor: "#ec4899" },
  { id: "c6", name: "LEGO Star Wars X-Wing", emoji: "✈️", price: 99.99, tag: "Fan Fave", tagColor: "bg-sky-500/20 text-sky-300", glowColor: "#38bdf8" },
];

const SCENES: ExplainerScene[] = [
  { id: 1, title: "The Gifting Paradox",
    caption: "Every year, billions of pounds are wasted on unwanted gifts. Cheap plastic toys pile up... while the things kids actually dream about stay out of reach. There has to be a better way." },
  { id: 2, title: "The Cash-Ask Friction",
    caption: "Asking family for cash directly? Incredibly awkward. Studies show 82% of people feel deeply uncomfortable doing it. Kindling removes that friction entirely — no awkward messages, ever." },
  { id: 3, title: "Continuous Pots",
    caption: "With Kindling, Billy has one Dream Board. Contributions flow in at every birthday, every Christmas, every occasion — stacking up like coins until his dream becomes real." },
  { id: 4, title: "Mum Knows Best",
    caption: "Mum controls the checklist. Grandma claims the LEGO Space Shuttle — it's ticked off instantly. No duplicates. No overspending. Everyone knows exactly what to buy." },
  { id: 5, title: "Simple for Grandma",
    caption: "One WhatsApp link. Two taps on Apple Pay. Done. Grandma just contributed to Billy's Mountain Bike without downloading a single app. That's the magic of Kindling." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-COMPUTED PARTICLES (avoid hydration mismatch)
// ═══════════════════════════════════════════════════════════════════════════════

const SNOW = Array.from({ length: 16 }, (_, i) => ({
  id: i, left: `${5 + (i * 347) % 90}%`,
  dur: `${2.2 + (i * 0.17) % 1.6}s`, delay: `${(i * 0.23) % 2.8}s`,
  sx: `${-8 + (i * 31) % 16}px`, drift: `${4 + (i * 11) % 12}px`, size: 3 + (i % 3),
}));

const CONFETTI_P = Array.from({ length: 18 }, (_, i) => {
  const cols = ["bg-violet-400","bg-pink-400","bg-fuchsia-400","bg-purple-400","bg-rose-400","bg-amber-400"];
  return { id: i, left: `${3 + (i * 293) % 94}%`, dur: `${1.8 + (i * 0.19) % 1.4}s`,
    delay: `${(i * 0.21) % 2.5}s`, rot: `${180 + (i * 73) % 540}deg`,
    color: cols[i % cols.length]!, w: 4 + (i % 4), h: 6 + (i % 5) };
});

// Firework sparks — 3 burst centres × 24 sparks each
const FW_BURSTS = [
  { cx: "50%", cy: "38%" },
  { cx: "18%", cy: "28%" },
  { cx: "82%", cy: "32%" },
  { cx: "35%", cy: "55%" },
  { cx: "68%", cy: "52%" },
];
const FW_SPARKS = Array.from({ length: 24 }, (_, i) => {
  const ang = (i / 24) * Math.PI * 2;
  const dist = 70 + (i * 41) % 70;
  return {
    id: i,
    x: Math.round(Math.cos(ang) * dist),
    y: Math.round(Math.sin(ang) * dist),
    color: ["#f59e0b","#ef4444","#8b5cf6","#10b981","#3b82f6","#f97316","#ec4899","#fbbf24"][i % 8]!,
    dur: `${0.55 + (i * 0.03) % 0.45}s`,
    delay: `${(i * 0.018) % 0.22}s`,
    size: 5 + (i % 6),
  };
});

// Post-circle sparkles
const SPARKLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  spx: `${-35 + (i * 37) % 70}px`,
  spy: `${-30 + (i * 29) % 60}px`,
  color: ["#f59e0b","#fbbf24","#f97316","#fb923c","#fff"][i % 5]!,
  delay: `${i * 0.06}s`,
  size: 4 + (i % 5),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

function useAudio() {
  const ctx = useRef<AudioContext | null>(null);
  const get = useCallback(() => {
    ctx.current ??= new AudioContext();
    return ctx.current;
  }, []);

  const thump = useCallback((t = 0) => {
    try {
      const c = get();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = 70 + Math.random() * 30;
      o.type = "sine";
      g.gain.setValueAtTime(0.55, c.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.18);
      o.start(c.currentTime + t);
      o.stop(c.currentTime + t + 0.18);
    } catch { /* silent */ }
  }, [get]);

  const chime = useCallback(() => {
    try {
      const c = get();
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.frequency.value = f; o.type = "sine";
        const t = c.currentTime + i * 0.13;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.start(t); o.stop(t + 0.5);
      });
    } catch { /* silent */ }
  }, [get]);

  return { thump, chime };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TTS
// ═══════════════════════════════════════════════════════════════════════════════

function speak(text: string, muted: boolean) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  if (muted) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92; u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((vv) =>
    vv.name.includes("Google UK English Female") ||
    vv.name.includes("Samantha") ||
    (vv.lang.startsWith("en") && vv.localService),
  );
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D TILT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function useTilt(maxDeg = 16) {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTiltStyle({
      transform: `perspective(700px) rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg) scale(1.04)`,
      transition: "transform 0.06s linear",
    });
  }, [maxDeg]);
  const onMouseLeave = useCallback(() => {
    setTiltStyle({ transform: "perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)", transition: "transform 0.35s ease-out" });
  }, []);
  return { tiltStyle, onMouseMove, onMouseLeave };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-24 left-1/2 z-50 animate-bounce-in-up">
      <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-5 py-3 shadow-xl shadow-emerald-900/50">
        <Check className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />
        <span className="text-[13px] font-bold text-white">{message}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileHeader({ potCount, totalGoal, onShare }: {
  potCount: number; totalGoal: number; onShare: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-800/60 bg-stone-950/96 backdrop-blur-lg">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-black text-stone-900 shadow-lg shadow-amber-900/30">
                🌟
              </div>
              <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-stone-950 bg-emerald-400 text-[7px] font-black text-stone-900">
                ✓
              </span>
            </div>
            <div>
              <h1 className="text-[16px] font-black tracking-tight text-stone-100 leading-tight">
                Billy&apos;s Dream Board
              </h1>
              <p className="text-[11px] text-stone-400">
                Managed by <span className="font-semibold text-amber-400">Mum (Sarah)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onShare}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-[12px] font-bold text-stone-900 shadow-md shadow-amber-900/30 active:scale-95 transition-transform"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share List
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[17px] font-black text-amber-400 leading-none">{potCount}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-stone-600">pots</p>
            </div>
            <div className="h-6 w-px bg-stone-800" />
            <div className="text-center">
              <p className="text-[17px] font-black text-stone-200 leading-none">£{totalGoal.toLocaleString()}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-stone-600">total goal</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-stone-700/50 bg-stone-900/60 px-2.5 py-1">
            <Lock className="h-2.5 w-2.5 text-emerald-400" />
            <span className="text-[9px] font-semibold text-stone-400">Regulated &amp; Secured by Stripe</span>
          </div>
        </div>
      </div>

      {/* Mode legend */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
        {[
          { dot: "bg-emerald-400", label: "Live Feed" },
          { dot: "bg-red-500", label: "Under the Tree 🎄" },
          { dot: "bg-violet-400", label: "Wrapped Up 🎀" },
          { dot: "bg-teal-400", label: "∞ Continuous" },
        ].map(({ dot, label }) => (
          <span key={label} className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900/60 border border-stone-800/50 px-2.5 py-1 text-[10px] font-medium text-stone-400">
            <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
            {label}
          </span>
        ))}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function LivePotCard({ pot, onRemove }: { pot: DemoPot; onRemove?: (id: string) => void }) {
  const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
  const statusLabel = pct >= 100 ? "Funded 🎉" : pct >= 50 ? "Halfway there ✨" : "Just getting started";
  const statusColor = pct >= 100 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-orange-400";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-stone-800/70 bg-stone-900/80 shadow-lg shadow-black/30 backdrop-blur-sm">
      <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800/80 text-xl shadow-inner">
              {pot.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold tracking-tight text-stone-100">{pot.title}</h3>
              <div className="flex items-center gap-1.5">
                <p className={cn("text-[11px] font-medium", statusColor)}>{statusLabel}</p>
                {pot.continuous && (
                  <span className="rounded-full bg-teal-900/40 px-1.5 py-px text-[9px] font-semibold text-teal-400 border border-teal-800/40">
                    ∞ continuous
                  </span>
                )}
              </div>
            </div>
          </div>
          {onRemove && (
            <button onClick={() => onRemove(pot.id)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-800 text-stone-500 hover:text-red-400 transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <FundingBar raised={pot.raised} goal={pot.goal} className="mt-4" />
        <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pot.contributors} contributors</span>
          <span className="font-medium text-stone-400">£{pot.raised} / £{pot.goal}</span>
        </div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCKED POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function LockedPotCard({ pot, onReveal }: { pot: DemoPot; onReveal: (p: DemoPot) => void }) {
  const isXmas = pot.mode === "UNDER_THE_TREE";
  const th = isXmas
    ? { bg: "bg-[#1a0f0f]", border: "border-red-700/30", glow: "animate-gift-glow",
        box: "from-red-800/30 to-amber-700/20", emoji: "🎁", label: "text-amber-400",
        modeLabel: "Under the Tree 🎄", btn: "from-amber-400 to-orange-500 shadow-amber-900/40" }
    : { bg: "bg-[#1a1028]", border: "border-violet-500/30", glow: "animate-gift-glow-plum",
        box: "from-violet-600/25 to-fuchsia-700/20", emoji: "🎀", label: "text-violet-400",
        modeLabel: "Wrapped Up ✨", btn: "from-violet-500 to-fuchsia-500 shadow-violet-900/40" };

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border shadow-lg shadow-black/50", th.bg, th.border)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {isXmas
          ? SNOW.map((s) => (
              <span key={s.id} className="animate-snow absolute rounded-full bg-white/80"
                style={{ left: s.left, top: 0, width: s.size, height: s.size,
                  "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
            ))
          : CONFETTI_P.map((c) => (
              <span key={c.id} className={cn("animate-confetti absolute rounded-sm", c.color)}
                style={{ left: c.left, top: 0, width: c.w, height: c.h,
                  "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
            ))}
      </div>
      <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-xl">🎁</span>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold text-stone-100">{pot.title}</h3>
              <p className={cn("text-[11px] font-medium", th.label)}>{th.modeLabel}</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-black/20 px-2.5 py-1.5 text-right">
            <p className="text-[9px] uppercase tracking-wider text-stone-500">{pot.eventLabel}</p>
            <p className="text-[12px] font-bold text-stone-200">{pot.eventDate}</p>
          </div>
        </div>
        <div className={cn(th.glow, "mt-4 flex flex-col items-center gap-3 rounded-2xl py-6 border border-white/5 bg-gradient-to-b", th.box)}>
          <span className="text-6xl select-none" role="img">{th.emoji}</span>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-stone-400" />
            <p className="text-[12px] font-semibold text-stone-200">Locked · Unwraps {pot.eventDate}</p>
          </div>
          <CountdownTimer targetIso={pot.eventIso} />
          <button
            onClick={() => onReveal(pot)}
            className={cn(
              "mt-1 flex items-center gap-1.5 rounded-full px-5 py-2.5",
              "bg-gradient-to-r text-[12px] font-bold text-stone-900 shadow-lg active:scale-95 transition-transform",
              th.btn,
            )}
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Trigger Reveal Ceremony
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-stone-500">
          <Users className="h-3 w-3" />
          <span className="text-[11px]">Balance hidden · {pot.contributors} contributors</span>
        </div>
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUM KNOWS BEST CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════

function MumChecklist({ onClaim }: { onClaim: (name: string) => void }) {
  const [items, setItems] = useState<ChecklistItem[]>(CHECKLIST);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const claim = useCallback((id: string) => {
    setClaimingId(id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: "claimed" as const, claimedBy: "You", claimedEmoji: "✋", shippingNote: "Just claimed — great choice!" }
            : it,
        ),
      );
      const item = items.find((i) => i.id === id);
      if (item) onClaim(item.name);
      setClaimingId(null);
    }, 450);
  }, [items, onClaim]);

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">🛍️</span>
        <div>
          <h2 className="text-[14px] font-bold text-stone-100">Cheaper Gift Ideas</h2>
          <p className="text-[11px] text-stone-500">Claim one to prevent duplicates</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-300",
              claimingId === item.id && "animate-claim-pop",
              item.status === "claimed"
                ? "border-emerald-800/40 bg-emerald-900/20"
                : "border-stone-800/60 bg-stone-900/60",
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-all",
              item.status === "claimed" ? "bg-emerald-500" : "border-2 border-stone-700 bg-stone-800",
            )}>
              {item.status === "claimed" ? "✓" : "○"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-[13px] font-semibold",
                  item.status === "claimed" ? "line-through text-stone-500" : "text-stone-100",
                )}>
                  {item.name}
                </p>
                <span className="text-[11px] font-bold text-amber-400">£{item.price}</span>
              </div>
              {item.status === "claimed" && item.claimedBy && (
                <p className="text-[11px] text-emerald-400 font-medium">
                  {item.claimedEmoji} {item.claimedBy} — {item.shippingNote}
                </p>
              )}
              {item.status === "available" && (
                <p className="text-[11px] text-stone-500">Available — tap to claim &amp; prevent duplicates</p>
              )}
            </div>
            {item.status === "available" && (
              <button
                onClick={() => claim(item.id)}
                className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-[11px] font-bold text-stone-900 active:scale-95 transition-transform"
              >
                Claim
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOGUE CARD (SVG circle + 3D tilt)
// ═══════════════════════════════════════════════════════════════════════════════

function CatalogCard({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem) => void }) {
  const [circling, setCircling] = useState(false);
  const [sparkling, setSparkling] = useState(false);
  const [added, setAdded] = useState(false);
  const { tiltStyle, onMouseMove, onMouseLeave } = useTilt(14);

  const handleClick = useCallback(() => {
    if (circling || added) return;
    setCircling(true);
    setTimeout(() => {
      setSparkling(true);
      setTimeout(() => {
        setSparkling(false);
        setAdded(true);
        onAdd(item);
      }, 700);
      setTimeout(() => setCircling(false), 200);
    }, 950);
  }, [circling, added, item, onAdd]);

  return (
    <div
      className={cn(
        "relative overflow-visible rounded-2xl border bg-stone-900/80 p-3.5 cursor-pointer backdrop-blur-sm",
        "transition-all duration-300",
        added ? "border-emerald-500/50 bg-emerald-900/15" : "border-stone-800/60 hover:border-stone-700",
      )}
      style={{
        ...tiltStyle,
        boxShadow: !added ? `0 0 0 0 transparent` : `0 0 20px 0 ${item.glowColor}30`,
      }}
      onClick={handleClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* SVG circle overlay */}
      {circling && (
        <div className="pointer-events-none absolute inset-[-8px] z-20">
          <svg viewBox="0 0 116 100" fill="none" className="absolute inset-0 w-full h-full overflow-visible">
            <path
              d="M 58,7 C 94,3 112,23 112,50 C 112,77 94,95 58,95 C 22,95 4,77 4,50 C 4,23 22,9 58,7"
              stroke="#f59e0b"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="320"
              className="animate-draw-circle"
              style={{ filter: "drop-shadow(0 0 9px #f59e0b)" }}
            />
          </svg>
        </div>
      )}

      {/* Sparkles */}
      {sparkling && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          {SPARKLES.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full animate-sparkle"
              style={{
                width: s.size, height: s.size,
                backgroundColor: s.color,
                "--spx": s.spx, "--spy": s.spy,
                animationDelay: s.delay,
                boxShadow: `0 0 4px ${s.color}`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="text-3xl">{item.emoji}</span>
        <span className={cn("rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", item.tagColor)}>
          {item.tag}
        </span>
      </div>
      <p className="text-[12px] font-bold leading-tight text-stone-100">{item.name}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[15px] font-black text-amber-400">£{item.price.toFixed(2)}</span>
        {added ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
            <Check className="h-3 w-3" />Added
          </span>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-stone-400">
            <Plus className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      {!added && (
        <p className="mt-1.5 text-[9px] text-stone-600 text-center">Tap to circle &amp; add</p>
      )}
    </div>
  );
}

function CatalogueGrid({ onAdd }: { onAdd: (item: CatalogItem) => void }) {
  return (
    <section className="px-4">
      <div className="mb-3">
        <h2 className="text-[14px] font-bold text-stone-100">Browse &amp; Add to Your List</h2>
        <p className="text-[11px] text-stone-500">Tap any card — watch the magic circle draw itself</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CATALOGUE.map((item) => (
          <CatalogCard key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVEAL CEREMONY MODAL
// ═══════════════════════════════════════════════════════════════════════════════

type RevealPhase = "idle" | "shaking" | "flashing" | "fireworks" | "mosaic" | "actions";

function MemoryCardView({ card }: { card: MemoryCard }) {
  const { tiltStyle, onMouseMove, onMouseLeave } = useTilt(12);
  return (
    <div
      className="animate-drift-in rounded-2xl border border-stone-700/70 bg-stone-800/80 p-4 backdrop-blur-sm cursor-default"
      style={{ "--card-rot": `${card.rot}deg`, animationDelay: `${card.delay}ms`, ...tiltStyle } as React.CSSProperties}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{card.emoji}</span>
        <p className="text-[12px] font-bold text-stone-200">{card.name}</p>
        {card.hasVideo && (
          <span className="rounded-sm bg-rose-500/20 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-rose-400">
            VIDEO
          </span>
        )}
      </div>
      <p className="text-[11px] italic leading-relaxed text-stone-300">&ldquo;{card.message}&rdquo;</p>
    </div>
  );
}

const REVEAL_ACTIONS = [
  { icon: ShoppingBag, label: "Merge & Buy", desc: "Combine pots for one milestone", gradient: "from-amber-400 to-orange-500", textCol: "text-stone-900" },
  { icon: CreditCard, label: "Top Up & Order", desc: "Pay the difference, ship now", gradient: "from-emerald-400 to-teal-500", textCol: "text-stone-900" },
  { icon: RefreshCw, label: "Roll Over", desc: "Carry balance to next event", gradient: "from-violet-500 to-fuchsia-500", textCol: "text-white" },
  { icon: Gift, label: "Redeem Vouchers", desc: "Currys · John Lewis · Amazon", gradient: "from-sky-500 to-blue-500", textCol: "text-white" },
];

function RevealModal({ pot, onClose }: { pot: DemoPot; onClose: () => void }) {
  const [phase, setPhase] = useState<RevealPhase>("idle");
  const { thump, chime } = useAudio();
  const rafRef = useRef<number | null>(null);

  const startReveal = useCallback(() => {
    setPhase("shaking");
    // Rhythmic thumps during shake
    [0, 140, 280, 420, 560, 700, 840].forEach((t) => setTimeout(() => thump(0), t));
    setTimeout(() => {
      setPhase("flashing");
      setTimeout(() => {
        setPhase("fireworks");
        chime();
        setTimeout(() => setPhase("mosaic"), 2200);
      }, 450);
    }, 1050);
  }, [thump, chime]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const isXmas = pot.mode === "UNDER_THE_TREE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
      {/* Flash overlay */}
      {phase === "flashing" && (
        <div className="pointer-events-none absolute inset-0 bg-white animate-flash z-10" />
      )}

      {/* Fireworks */}
      {(phase === "fireworks" || phase === "mosaic" || phase === "actions") && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {FW_BURSTS.map((b, bi) => (
            <div key={bi} className="absolute" style={{ left: b.cx, top: b.cy }}>
              {FW_SPARKS.map((s) => (
                <span
                  key={s.id}
                  className="absolute rounded-full animate-fw-spark"
                  style={{
                    width: s.size, height: s.size,
                    backgroundColor: s.color,
                    "--fwx": `${s.x}px`, "--fwy": `${s.y}px`,
                    "--fw-dur": s.dur,
                    animationDelay: `${parseFloat(s.delay) + bi * 0.12}s`,
                    boxShadow: `0 0 5px ${s.color}`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          ))}
          {/* Soundwave rings */}
          {phase === "fireworks" && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {[0, 0.5, 1.1].map((d, i) => (
                <div
                  key={i}
                  className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/50 animate-sw-ring"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative z-20 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-stone-900 shadow-2xl shadow-black/70">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-stone-800/80 text-stone-400 hover:text-stone-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-6 px-6 py-10">
            <div className={cn(
              "rounded-3xl p-6 border",
              isXmas ? "bg-[#1a0f0f] border-red-700/30 animate-gift-glow" : "bg-[#1a1028] border-violet-500/30 animate-gift-glow-plum",
            )}>
              <span className="text-7xl">{isXmas ? "🎁" : "🎀"}</span>
            </div>
            <div className="text-center">
              <p className="text-[17px] font-black text-stone-100">{pot.title}</p>
              <p className="mt-1 text-[12px] text-stone-400">Ready for the big reveal?</p>
            </div>
            <button
              onClick={startReveal}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[15px] font-black text-stone-900 shadow-xl shadow-amber-900/30 active:scale-[0.97] transition-transform"
            >
              <Zap className="h-5 w-5" strokeWidth={2.5} />
              Unwrap Now!
            </button>
          </div>
        )}

        {/* ── SHAKING ── */}
        {(phase === "shaking" || phase === "flashing") && (
          <div className="flex flex-col items-center gap-4 px-6 py-10 overflow-hidden">
            <div className={cn("animate-box-shake rounded-3xl p-6 border", isXmas ? "bg-[#1a0f0f] border-red-700/30" : "bg-[#1a1028] border-violet-500/30")}>
              <span className="text-7xl">{isXmas ? "🎁" : "🎀"}</span>
            </div>
            <p className="text-[14px] font-bold text-amber-400 animate-pulse">Something incredible is inside…</p>
          </div>
        )}

        {/* ── FIREWORKS: show revealed amount ── */}
        {phase === "fireworks" && (
          <div className="flex flex-col items-center gap-5 px-6 py-10">
            <p className="text-[12px] font-bold uppercase tracking-widest text-amber-400">🎉 Fully Funded!</p>
            <div className="font-mono text-6xl font-black text-amber-400 animate-scale-in tabular-nums" style={{ textShadow: "0 0 30px #f59e0b80" }}>
              £{pot.goal.toLocaleString()}
            </div>
            <p className="text-[13px] text-stone-300 font-semibold">{pot.title}</p>
            <div className="w-full animate-fade-up">
              <FundingBar raised={pot.goal} goal={pot.goal} />
              <p className="mt-2 text-center text-[11px] text-emerald-400 font-semibold">
                {pot.contributors} contributors made this happen 🙌
              </p>
            </div>
          </div>
        )}

        {/* ── MOSAIC ── */}
        {phase === "mosaic" && (
          <div className="flex flex-col gap-4 px-4 py-6 max-h-[70vh] overflow-y-auto">
            <p className="text-center text-[12px] font-bold uppercase tracking-widest text-amber-400">
              💌 Messages from the people who love you
            </p>
            {pot.tributes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pot.tributes.map((card) => (
                  <MemoryCardView key={card.id} card={card} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { id: "g1", name: "The Family", emoji: "👨‍👩‍👧‍👦", message: "We all chipped in with love. Enjoy every moment! 🎉", rot: -2, delay: 0 },
                  { id: "g2", name: "Friends", emoji: "🤝", message: "You deserve this so much! Congratulations! ✨", rot: 3, delay: 120 },
                ].map((card) => <MemoryCardView key={card.id} card={card} />)}
              </div>
            )}
            <button
              onClick={() => setPhase("actions")}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[13px] font-bold text-stone-900 active:scale-[0.97] transition-transform"
            >
              What happens next? <SkipForward className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── ACTIONS ── */}
        {phase === "actions" && (
          <div className="flex flex-col gap-4 px-4 py-6">
            <div className="text-center">
              <p className="text-[15px] font-black text-stone-100">What would you like to do?</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Choose how to use your £{pot.goal.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {REVEAL_ACTIONS.map(({ icon: Icon, label, desc, gradient, textCol }) => (
                <button
                  key={label}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-2xl p-3.5 text-left active:scale-95 transition-transform",
                    `bg-gradient-to-br ${gradient}`,
                  )}
                >
                  <Icon className={cn("h-5 w-5", textCol)} strokeWidth={2} />
                  <p className={cn("text-[12px] font-bold leading-tight", textCol)}>{label}</p>
                  <p className={cn("text-[10px] leading-tight opacity-80", textCol)}>{desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="mt-1 text-[11px] text-stone-600 hover:text-stone-400 transition-colors"
            >
              Close ceremony
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINER PLAYER
// ═══════════════════════════════════════════════════════════════════════════════

function SceneVisual({ id, progress }: { id: number; progress: number }) {
  if (id === 1) return (
    <div className="flex h-full items-center justify-center gap-3 px-3">
      <div className="flex-1 flex flex-col items-center gap-1 opacity-60">
        <div className="flex flex-wrap justify-center gap-1">
          {["🧦","🕯️","🪆","📦","🧸"].map((e, i) => (
            <span key={i} className="text-lg grayscale">{e}</span>
          ))}
        </div>
        <p className="text-[9px] text-red-400 font-semibold">Wasted gifts</p>
      </div>
      <span className="text-stone-600 font-bold">vs</span>
      <div className="flex-1 flex flex-col items-center gap-1">
        {["🚵 Mountain Bike","🏠 House Deposit","✈️ Family Holiday"].map((label, i) => (
          <div key={i} className="flex items-center gap-1 rounded-lg bg-amber-400/10 border border-amber-500/20 px-2 py-0.5 w-full">
            <span className="text-[10px] font-semibold text-amber-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (id === 2) return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
      {progress < 0.5 ? (
        <div className="rounded-2xl bg-emerald-900/40 border border-emerald-700/30 px-4 py-3 max-w-[200px]">
          <p className="text-[11px] text-stone-300 italic">
            &ldquo;Hey Auntie... instead of a gift could you just... send us cash?&rdquo;
            <span className="inline-block ml-1 animate-pulse">|</span>
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-3xl mb-2">💔</p>
          <div className="rounded-xl bg-red-900/30 border border-red-700/30 px-4 py-2">
            <p className="text-[11px] font-bold text-red-400">82% feel uncomfortable asking for cash directly</p>
          </div>
        </div>
      )}
    </div>
  );

  if (id === 3) return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
      <div className="flex items-center gap-2 w-full">
        {["🎂 Birthday","🎄 Christmas","🎂 Birthday"].map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="rounded-xl bg-stone-800 border border-stone-700 p-2">
              <p className="text-[9px] font-bold text-stone-300">{label}</p>
              <p className="text-[11px] text-amber-400 font-black mt-0.5">+£{[120, 200, 130][i]}</p>
            </div>
            {i < 2 && <div className="text-stone-600 text-center mt-1">→</div>}
          </div>
        ))}
      </div>
      <div className="w-full rounded-xl bg-emerald-900/30 border border-emerald-700/30 p-2 text-center">
        <p className="text-[11px] font-bold text-emerald-400">🚵 £450 Total · Mountain Bike Funded!</p>
      </div>
    </div>
  );

  if (id === 4) return (
    <div className="flex h-full flex-col justify-center gap-2 px-3">
      {[
        { label: "LEGO Space Shuttle", price: "£25", status: "claimed", who: "👵 Grandma Linda", claimed: true },
        { label: "Adventure Books", price: "£15", status: "claimed", who: "👨 Uncle Steve", claimed: true },
        { label: "Marvel Figure", price: "£18", status: "available", who: "", claimed: progress > 0.6 },
      ].map((item, i) => (
        <div key={i} className={cn("flex items-center gap-2 rounded-xl p-2.5 border transition-all",
          item.claimed ? "bg-emerald-900/20 border-emerald-800/40" : "bg-stone-800/60 border-stone-700/40")}>
          <span className={cn("text-sm font-bold", item.claimed ? "text-emerald-400" : "text-stone-500")}>
            {item.claimed ? "✓" : "○"}
          </span>
          <div className="flex-1 min-w-0">
            <p className={cn("text-[11px] font-semibold", item.claimed && "line-through text-stone-500")}>{item.label}</p>
            {item.claimed && item.who && <p className="text-[9px] text-emerald-400">{item.who}</p>}
          </div>
          <span className="text-[10px] font-bold text-amber-400">{item.price}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
      <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700/30 p-3 w-full max-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💬</span>
          <p className="text-[10px] font-bold text-emerald-300">WhatsApp from Grandma</p>
        </div>
        <p className="text-[11px] text-stone-300">&ldquo;Just clicked the link — paying now!&rdquo;</p>
      </div>
      {progress > 0.4 && (
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          <div className="rounded-2xl bg-stone-800 border border-stone-700 px-5 py-3 text-center">
            <p className="text-[10px] text-stone-400 mb-1">Apple Pay</p>
            <p className="text-[13px] font-black text-stone-100">Pay £50.00</p>
          </div>
          {progress > 0.7 && (
            <div className="flex items-center gap-1.5 animate-scale-in">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[12px] font-bold text-emerald-400">Payment successful!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExplainerPlayer() {
  const [open, setOpen] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SCENE_DUR = 24; // seconds per scene
  const TOTAL = SCENES.length * SCENE_DUR;

  useEffect(() => {
    if (!playing) { window.speechSynthesis?.pause(); return; }
    window.speechSynthesis?.resume();
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e >= TOTAL - 1) { setPlaying(false); return TOTAL; }
        return e + 0.25;
      });
    }, 250);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, TOTAL]);

  const currentScene = Math.min(SCENES.length - 1, Math.floor(elapsed / SCENE_DUR));
  const sceneProgress = (elapsed % SCENE_DUR) / SCENE_DUR;

  useEffect(() => {
    if (currentScene !== sceneIdx) {
      setSceneIdx(currentScene);
      if (playing) speak(SCENES[currentScene]!.caption, muted);
    }
  }, [currentScene, sceneIdx, playing, muted]);

  const jumpTo = (idx: number) => {
    setElapsed(idx * SCENE_DUR);
    window.speechSynthesis?.cancel();
    if (playing) speak(SCENES[idx]!.caption, muted);
  };

  if (!open) return (
    <div className="mx-4">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-stone-800/60 bg-stone-900/60 px-4 py-3.5 text-left hover:border-amber-500/30 transition-colors active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <Play className="h-5 w-5 translate-x-0.5 text-stone-900" strokeWidth={2.5} fill="currentColor" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-stone-100">📺 Watch How It Works</p>
          <p className="text-[11px] text-stone-500">5 scenes · 2 min · with voiceover</p>
        </div>
      </button>
    </div>
  );

  const scene = SCENES[sceneIdx]!;

  return (
    <div className="mx-4 overflow-hidden rounded-3xl border border-stone-800/60 bg-stone-900 shadow-xl shadow-black/40">
      {/* Scene label */}
      <div className="flex items-center justify-between border-b border-stone-800/60 bg-stone-950/60 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
          Scene {sceneIdx + 1}/5 · {scene.title}
        </span>
        <button onClick={() => { setOpen(false); setPlaying(false); window.speechSynthesis?.cancel(); }}
          className="text-stone-500 hover:text-stone-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Viewport */}
      <div className="h-52 bg-stone-950">
        <SceneVisual id={sceneIdx + 1} progress={sceneProgress} />
      </div>

      {/* Caption */}
      <div className="min-h-[56px] border-t border-stone-800/60 px-4 py-3">
        <p key={sceneIdx} className="text-[11px] leading-relaxed text-stone-400 animate-fade-up line-clamp-3">
          {scene.caption}
        </p>
      </div>

      {/* Controls */}
      <div className="border-t border-stone-800/60 px-4 pb-4 pt-3 space-y-3">
        {/* Progress */}
        <div
          className="h-1.5 w-full cursor-pointer rounded-full bg-stone-800"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            const newT = Math.round(ratio * TOTAL);
            setElapsed(newT);
            window.speechSynthesis?.cancel();
            if (playing) speak(SCENES[Math.min(SCENES.length - 1, Math.floor(newT / SCENE_DUR))]!.caption, muted);
          }}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-100"
            style={{ width: `${(elapsed / TOTAL) * 100}%` }} />
        </div>

        {/* Buttons + time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPlaying((p) => { if (!p) speak(scene.caption, muted); return !p; }); }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900 shadow-md shadow-amber-900/30 active:scale-90 transition-transform"
          >
            {playing
              ? <Pause className="h-4 w-4" strokeWidth={2.5} fill="currentColor" />
              : <Play className="h-4 w-4 translate-x-0.5" strokeWidth={2.5} fill="currentColor" />}
          </button>
          <button
            onClick={() => { setMuted((m) => { const n = !m; if (n) window.speechSynthesis?.cancel(); else if (playing) speak(scene.caption, false); return n; }); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 active:scale-90 transition-all"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <span className="flex-1 text-right font-mono text-[10px] text-stone-600 tabular-nums">
            {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")} / 2:00
          </span>
        </div>

        {/* Scene dots */}
        <div className="flex justify-center gap-2">
          {SCENES.map((s, i) => (
            <button key={s.id} onClick={() => jumpTo(i)}
              className={cn("h-1.5 rounded-full transition-all duration-300",
                i === sceneIdx ? "w-6 bg-amber-400" : "w-1.5 bg-stone-700 hover:bg-stone-500")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVESTOR HUD
// ═══════════════════════════════════════════════════════════════════════════════

function useCountUp(target: number, running: boolean, dur = 1200) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!running || started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setVal(Math.round(target * (1 - (1 - p) ** 2) * 100) / 100);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [running, target, dur]);
  return val;
}

function InvestorHUD({ pots, logEntries }: { pots: DemoPot[]; logEntries: string[] }) {
  const [open, setOpen] = useState(false);

  const totalGoal = pots.reduce((s, p) => s + p.goal, 0);
  const totalRaised = pots.reduce((s, p) => s + p.raised, 0);
  const totalContributors = pots.reduce((s, p) => s + p.contributors, 0);

  const affiliateTarget = totalGoal * 0.045;
  const giftCardTarget = totalRaised * 0.04;
  const obTarget = Math.max(0, totalRaised * 0.005 - totalContributors * 0.05);
  const intentTarget = pots.filter((p) => p.goal >= 200).length * 4.75;
  const totalTarget = affiliateTarget + giftCardTarget + obTarget + intentTarget;

  const affiliate = useCountUp(affiliateTarget, open);
  const giftCard = useCountUp(giftCardTarget, open, 1400);
  const ob = useCountUp(obTarget, open, 1600);
  const intent = useCountUp(intentTarget, open, 1800);
  const total = useCountUp(totalTarget, open, 2000);

  const streams = [
    { icon: "🔗", label: "Affiliate Commission", sub: "4.5% on £" + totalGoal.toLocaleString() + " catalogue value", val: affiliate, color: "text-amber-400" },
    { icon: "🎁", label: "Gift Card Margin", sub: "4% wholesale via Tillo / Prezzee", val: giftCard, color: "text-emerald-400" },
    { icon: "🏦", label: "Open Banking Spread", sub: "0.5% minus 5p per A2A transfer", val: ob, color: "text-sky-400" },
    { icon: "📡", label: "Intent Data Leads", sub: "£4.75 CPM × high-ticket nodes", val: intent, color: "text-violet-400" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Handle */}
      <div className="flex justify-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-t-xl border border-b-0 border-stone-700/60 bg-stone-900/98 px-5 py-2.5 backdrop-blur-md"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">🛠️ Investor HUD</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-px text-[9px] font-black text-emerald-400">
            £{total.toFixed(2)} earned
          </span>
          {open ? <ChevronDown className="h-3 w-3 text-stone-500" /> : <ChevronUp className="h-3 w-3 text-stone-500" />}
        </button>
      </div>

      {/* Panel */}
      <div className={cn(
        "border-t border-stone-700/60 bg-stone-950/98 backdrop-blur-lg transition-all duration-500 ease-out overflow-hidden",
        open ? "max-h-[420px]" : "max-h-0",
      )}>
        <div className="overflow-y-auto max-h-[420px] px-4 pb-6 pt-4 space-y-4">
          {/* Revenue streams */}
          <div className="grid grid-cols-2 gap-2">
            {streams.map((s) => (
              <div key={s.label} className="rounded-xl border border-stone-800/40 bg-stone-900/60 px-3 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{s.icon}</span>
                  <p className="text-[10px] font-bold text-stone-300 leading-tight">{s.label}</p>
                </div>
                <p className={cn("font-mono text-[15px] font-black tabular-nums", s.color)}>
                  £{s.val.toFixed(2)}
                </p>
                <p className="text-[9px] text-stone-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-900/15 px-4 py-3">
            <p className="text-[12px] font-bold text-stone-200">Total silent revenue</p>
            <span className="font-mono text-[18px] font-black text-emerald-400 animate-gold-shimmer tabular-nums">
              £{total.toFixed(2)}
            </span>
          </div>

          {/* Intent log */}
          <div className="rounded-xl border border-stone-800/40 bg-stone-950 p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-2">
              📡 IntentDataNode Ledger — Series A Foundation
            </p>
            <div className="space-y-1 font-mono text-[9px] text-stone-500 max-h-28 overflow-y-auto">
              {logEntries.map((entry, i) => (
                <p key={i} className={cn(i === 0 && "text-violet-400")}>{entry}</p>
              ))}
              <p>▶ System initialized. Monitoring intent signals…</p>
            </div>
          </div>

          <p className="text-center text-[9px] text-stone-700">
            Revenue generated silently behind a delightful consumer product · No ads · No subscriptions
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const [pots, setPots] = useState<DemoPot[]>(INITIAL_POTS);
  const [revealPot, setRevealPot] = useState<DemoPot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const addLog = useCallback((entry: string) => {
    setLogEntries((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText("https://kindling.app/list/billys-dreams").catch(() => null);
    showToast("📋 Link copied to share with family!");
    addLog("🔗 Wishlist link shared — referral tracking engaged");
  }, [showToast, addLog]);

  const handleClaim = useCallback((name: string) => {
    showToast(`✅ "${name}" claimed — duplicates prevented!`);
    addLog(`🛍️ Gift claim: "${name}" secured by family member`);
  }, [showToast, addLog]);

  const handleAddItem = useCallback((item: CatalogItem) => {
    if (addedIds.has(item.id)) return;
    setAddedIds((s) => new Set([...s, item.id]));
    const newPot: DemoPot = {
      id: `new_${item.id}`,
      title: item.name,
      emoji: item.emoji,
      goal: item.price,
      raised: 0,
      mode: "LIVE_FEED",
      continuous: true,
      eventLabel: "Ongoing",
      eventDate: "Anytime",
      eventIso: "2027-01-01T00:00:00Z",
      contributors: 0,
      boosterEntries: 0,
      accentGradient: "from-amber-400 to-orange-500",
      tributes: [],
    };
    setPots((prev) => [newPot, ...prev]);
    showToast(`🎯 "${item.name}" added to Billy's Dream Board!`);
    const intentMsg = item.price >= 200
      ? `📡 IntentDataNode CREATED: "${item.name}" £${item.price} — High-ticket Day 1 signal`
      : `📊 Catalogue add: "${item.name}" (£${item.price.toFixed(2)}) — tracking engaged`;
    addLog(intentMsg);
  }, [addedIds, showToast, addLog]);

  const livePots = pots.filter((p) => p.mode === "LIVE_FEED");
  const surprisePots = pots.filter((p) => p.mode !== "LIVE_FEED");

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {revealPot && <RevealModal pot={revealPot} onClose={() => setRevealPot(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <ProfileHeader
        potCount={pots.length}
        totalGoal={pots.reduce((s, p) => s + p.goal, 0)}
        onShare={handleShare}
      />

      <main className="space-y-6 pb-32 pt-4">
        {/* ── Live Pots ── */}
        <section className="px-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-500">
            Live Pots · {livePots.length} active
          </p>
          <div className="flex flex-col gap-3">
            {livePots.map((pot) =>
              pot.id.startsWith("new_")
                ? <LivePotCard key={pot.id} pot={pot} onRemove={(id) => setPots((p) => p.filter((x) => x.id !== id))} />
                : <LivePotCard key={pot.id} pot={pot} />
            )}
          </div>
        </section>

        {/* ── Surprise Pots ── */}
        {surprisePots.length > 0 && (
          <section className="px-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-stone-500">
              Surprise Pots · {surprisePots.length} locked
            </p>
            <div className="flex flex-col gap-3">
              {surprisePots.map((pot) => (
                <LockedPotCard key={pot.id} pot={pot} onReveal={setRevealPot} />
              ))}
            </div>
          </section>
        )}

        {/* ── Mum Knows Best ── */}
        <MumChecklist onClaim={handleClaim} />

        {/* ── Catalogue ── */}
        <CatalogueGrid onAdd={handleAddItem} />

        {/* ── Explainer ── */}
        <ExplainerPlayer />

        {/* ── Bottom CTA ── */}
        <div className="mx-4">
          <button
            onClick={() => setRevealPot(surprisePots[0] ?? pots[0]!)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[14px] font-black text-stone-900 shadow-xl shadow-amber-900/30 active:scale-[0.98] transition-transform"
          >
            <Zap className="h-5 w-5" strokeWidth={2.5} />
            Launch Reveal Ceremony
          </button>
          <p className="mt-2 text-center text-[10px] text-stone-600">
            Cinematic full-screen reveal · touch-optimised · no database required
          </p>
        </div>
      </main>

      <InvestorHUD pots={pots} logEntries={logEntries} />
    </div>
  );
}
