"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  image?: string;
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
  // Parent Knows Best / checklist pots
  tag?: string;
  isClaimed?: boolean;
  claimedBy?: string;
  claimedEmoji?: string;
  claimedNote?: string;
}


interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  image: string;
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
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80",
    goal: 450, raised: 310, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 7, boosterEntries: 0,
    accentGradient: "from-emerald-500 via-teal-400 to-cyan-400",
    tributes: [],
  },
  {
    id: "p2", title: "LEGO Star Wars Millennium Falcon", emoji: "🚀",
    image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=400&h=400&fit=crop&q=80",
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
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80",
    goal: 250, raised: 80, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 3, boosterEntries: 0,
    accentGradient: "from-fuchsia-500 via-purple-400 to-indigo-500",
    tributes: [],
  },
  {
    id: "p4", title: "Cosy Log Burner", emoji: "🔥",
    image: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?w=400&h=400&fit=crop&q=80",
    goal: 800, raised: 425, mode: "WRAPPED_UP", continuous: false,
    eventLabel: "Birthday", eventDate: "Jun 28", eventIso: "2026-06-28T10:00:00Z",
    contributors: 5, boosterEntries: 3,
    accentGradient: "from-violet-500 via-fuchsia-400 to-pink-500",
    tributes: [
      { id: "b1", name: "The Kids", emoji: "👨‍👩‍👦", rot: -3, delay: 0,
        message: "Mum, you are always cold — this one's for you! Cosy nights ahead ❤️🔥", hasVideo: true },
      { id: "b2", name: "Auntie Claire", emoji: "👩‍🦰", rot: 4, delay: 140,
        message: "You've wanted one of these for years! Enjoy every warm evening 🥰" },
      { id: "b3", name: "Work Crew", emoji: "👫", rot: -1, delay: 260,
        message: "From all of us — you deserve every cosy moment! 🔥🎉", hasVideo: true },
    ],
  },
];

const CHECKLIST_POTS: DemoPot[] = [
  {
    id: "cl1", title: "LEGO Space Shuttle Explorer", emoji: "🚀",
    goal: 25, raised: 25, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-emerald-400 to-teal-500",
    tributes: [],
    tag: "Grandma Linda",
    isClaimed: true, claimedBy: "Grandma Linda", claimedEmoji: "👵",
    claimedNote: "Shipped directly from Amazon · Arrives Dec 23",
  },
  {
    id: "cl2", title: "Adventure Book Series (x3)", emoji: "📚",
    goal: 15, raised: 15, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-sky-400 to-blue-500",
    tributes: [],
    tag: "Uncle Steve",
    isClaimed: true, claimedBy: "Uncle Steve", claimedEmoji: "👨‍🦲",
    claimedNote: "Bringing to the party in person",
  },
  {
    id: "cl3", title: "Marvel Action Figure Set", emoji: "🦸",
    goal: 18, raised: 0, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 0, boosterEntries: 0,
    accentGradient: "from-rose-400 to-red-500",
    tributes: [],
    tag: "Mum Knows Best",
    isClaimed: false,
  },
];

const CATALOGUE: CatalogItem[] = [
  { id: "c1", name: "Nintendo Switch OLED", emoji: "🎮",
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop&q=80",
    price: 309.99, tag: "Popular", tagColor: "bg-red-100 text-red-600", glowColor: "#ef4444" },
  { id: "c2", name: "Electric Scooter Pro", emoji: "🛴",
    image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=400&h=400&fit=crop&q=80",
    price: 399.99, tag: "Trending", tagColor: "bg-emerald-100 text-emerald-600", glowColor: "#10b981" },
  { id: "c3", name: "Meta Quest 3 VR", emoji: "🥽",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=400&fit=crop&q=80",
    price: 499.99, tag: "High Intent", tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6" },
  { id: "c4", name: "LEGO Technic Ferrari", emoji: "🏎️",
    image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=400&fit=crop&q=80",
    price: 189.99, tag: "Bestseller", tagColor: "bg-amber-100 text-amber-600", glowColor: "#f59e0b" },
  { id: "c5", name: "Air Hockey Table", emoji: "🏒",
    image: "https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?w=400&h=400&fit=crop&q=80",
    price: 199.99, tag: "New", tagColor: "bg-pink-100 text-pink-600", glowColor: "#ec4899" },
  { id: "c6", name: "LEGO Star Wars X-Wing", emoji: "✈️",
    image: "https://images.unsplash.com/photo-1609372332255-611485350f25?w=400&h=400&fit=crop&q=80",
    price: 99.99, tag: "Fan Fave", tagColor: "bg-sky-100 text-sky-600", glowColor: "#38bdf8" },
];

const SCENES: ExplainerScene[] = [
  { id: 1, title: "The Gifting Paradox",
    caption: "Would you rather your family receive duplicate, forgotten gifts... or combine forces to unlock one incredible, life-changing milestone? For kids, that's the dream mountain bike. For adults, it's a cosy log burner, a family sofa, or even a house deposit — completely out of reach for a single buyer's budget." },
  { id: 2, title: "Parent Knows Best",
    caption: "We all prefer those meaningful milestones... but directly asking loved ones for money always feels incredibly awkward. Kindled fixes this — our 'Parent Knows Best' Checklist lets anyone curate the perfect list on behalf of a loved one. Relatives click to instantly Claim or Tick Off an item, securing it in real-time across all shared links. No duplicates. No guessing. Guaranteed to be loved." },
  { id: 3, title: "Continuous Gifting",
    caption: "Unlike temporary registries that expire, Kindled is a continuous ledger built to stack up over time. An incomplete birthday pot seamlessly carries over to Christmas... letting grandparents, aunts, and colleagues keep chipping in. By stacking minor contributions, you unlock massive purchasing power — turning ten minor gifts into a beautiful family sofa or a coding camp." },
  { id: 4, title: "Under Wraps Reveal",
    caption: "And we protect the surprise until the very end. Toggle on 'Under Wraps' mode and progress bars, totals, and greetings are completely hidden from the receiver. Contributions keep flowing in secretly, while the registry looks like a beautiful locked gift box. On the big day, trigger the cinematic Reveal Ceremony — digital fireworks, glitter, and a floating mosaic of notes from the family." },
  { id: 5, title: "Simple for Grandma",
    caption: "Sharing is beautifully effortless. One simple link on WhatsApp lets family chip in securely in just two taps using Apple Pay or Google Pay. No app downloads, no account setup, and absolutely zero hassle for Grandma. Secured globally by Stripe. Kindled doesn't force a new behaviour — it simply makes collaborative family gifting sustainable, emotional, and powerful." },
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
// 3D TILT HOOK
// ═══════════════════════════════════════════════════════════════════════════════


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
    <header className="sticky top-0 z-30 border-b border-orange-100/80 bg-[#fdf9f5]/95 backdrop-blur-lg">
      {/* Warm accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" width="44" height="44" className="shrink-0 drop-shadow-md" role="img" aria-label="Kindled">
              <defs>
                <linearGradient id="hdr-tile" x1="0" y1="0" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFB845"/>
                  <stop offset="100%" stopColor="#F26B2C"/>
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="22" fill="url(#hdr-tile)"/>
              <g fill="#FFF4E6">
                <rect x="28" y="27" width="12" height="46" rx="6"/>
                <rect x="34" y="33" width="34" height="12" rx="6" transform="rotate(-37 51 39)"/>
                <rect x="34" y="56" width="34" height="12" rx="6" transform="rotate(37 51 62)"/>
              </g>
              <path d="M48 22 C41 14 32 17 35.5 25 C38 30 44 29 48 25.5 Z" fill="#FFF4E6"/>
              <path d="M48 22 C55 14 64 17 60.5 25 C58 30 52 29 48 25.5 Z" fill="#FFF4E6"/>
              <circle cx="48" cy="23.5" r="5.5" fill="#FFD27A"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold tracking-tight text-stone-900 leading-tight">Kindled</h1>
                <span className="text-[11px] font-medium text-stone-400">· Billy&apos;s List</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Managed by <span className="font-semibold text-amber-500">Mum (Sarah)</span>
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={onShare}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 text-[12px] font-semibold text-stone-900 shadow-md shadow-amber-200 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            Guide Buyers
          </motion.button>
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-stone-100">
          {[
            { value: potCount, label: "pots", color: "text-amber-500" },
            { value: `£${totalGoal.toLocaleString()}`, label: "goal", color: "text-orange-500" },
            { value: "4", label: "events", color: "text-rose-500" },
          ].map((stat) => (
            <div key={stat.label} className="px-3 first:pl-0 last:pr-0 text-center">
              <p style={{ fontFamily: "var(--font-display)" }} className={`text-[18px] font-semibold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const KINDLE_AMOUNTS = [5, 10, 25, 50];

function LivePotCard({ pot, onRemove, onKindle, onBuy }: {
  pot: DemoPot;
  onRemove?: (id: string) => void;
  onKindle?: (id: string, amount: number) => void;
  onBuy?: (id: string) => void;
}) {
  const [kindleOpen, setKindleOpen] = useState(false);
  const [kindled, setKindled] = useState(false);
  const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
  const statusLabel =
    pot.isClaimed    ? "Ordered ✓" :
    pct >= 100 ? "Fully Lit 🔥" :
    pct >= 75  ? "Blazing 🔥" :
    pct >= 50  ? "Campfire 🏕️" :
    pct >= 25  ? "Kindling 🪵" :
    pct > 0    ? "Embers ✨" :
                 "Spark 🕯️";
  const statusColor =
    pot.isClaimed    ? "text-emerald-500" :
    pct >= 100 ? "text-emerald-500" :
    pct >= 75  ? "text-orange-500" :
    pct >= 50  ? "text-amber-500" :
    pct >= 25  ? "text-amber-400" :
                 "text-orange-400";

  function handleKindle(amount: number) {
    setKindled(true);
    setKindleOpen(false);
    onKindle?.(pot.id, amount);
    setTimeout(() => setKindled(false), 2000);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative overflow-hidden rounded-2xl bg-white"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-amber-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
              {pot.image ? (
                <img src={pot.image} alt={pot.title} className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl">{pot.emoji}</span>
              )}
              {pot.isClaimed && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/80">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 style={{ fontFamily: "var(--font-display)" }} className="truncate text-[15px] font-medium tracking-tight text-stone-900">{pot.title}</h3>
                {pot.tag && (
                  <span className="shrink-0 rounded-full bg-violet-50 border border-violet-200 px-2 py-px text-[9px] font-semibold text-violet-600">
                    {pot.tag}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className={cn("text-[11px] font-medium", statusColor)}>{statusLabel}</p>
                {pot.continuous && !pot.isClaimed && (
                  <span className="rounded-full bg-teal-50 border border-teal-200 px-1.5 py-px text-[9px] font-semibold text-teal-600">
                    ∞ continuous
                  </span>
                )}
              </div>
            </div>
          </div>
          {onRemove && !pot.isClaimed && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemove(pot.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-400 transition-colors">
              <X className="h-3 w-3" />
            </motion.button>
          )}
        </div>

        {/* Claimed state */}
        {pot.isClaimed && pot.claimedBy && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
            <span className="text-base">{pot.claimedEmoji ?? "✅"}</span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-emerald-700">{pot.claimedBy} — ordered</p>
              {pot.claimedNote && <p className="text-[11px] text-emerald-600/80 truncate">{pot.claimedNote}</p>}
            </div>
          </div>
        )}

        {/* Progress */}
        {!pot.isClaimed && (
          <>
            <FundingBar raised={pot.raised} goal={pot.goal} className="mt-4" />
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-stone-400"><Users className="h-3 w-3" />{pot.contributors} contributors</span>
              <span className="text-[12px] font-semibold text-stone-600">£{pot.raised} <span className="text-stone-300">/</span> £{pot.goal}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setKindleOpen((v) => !v)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
                  kindled
                    ? "bg-emerald-500 text-white"
                    : kindleOpen
                      ? "bg-amber-500 text-stone-900 shadow-md shadow-amber-200"
                      : "bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900 shadow-sm shadow-amber-200",
                )}
              >
                <span className="text-[15px]">{kindled ? "✓" : "🔥"}</span>
                {kindled ? "Kindled!" : "Kindle"}
              </motion.button>
              {pot.goal <= 60 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onBuy?.(pot.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-stone-200 bg-white py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:border-stone-300"
                >
                  <span className="text-[13px]">🛒</span>
                  Buy outright · £{pot.goal}
                </motion.button>
              )}
            </div>

            {/* Inline Kindle amount picker */}
            <AnimatePresence>
              {kindleOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {KINDLE_AMOUNTS.map((amt) => (
                      <motion.button
                        key={amt}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleKindle(amt)}
                        disabled={amt > pot.goal - pot.raised}
                        className={cn(
                          "rounded-xl py-2.5 text-[13px] font-bold transition-all",
                          amt > pot.goal - pot.raised
                            ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                            : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100",
                        )}
                      >
                        £{amt}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-[10px] text-stone-400">£{pot.goal - pot.raised} still needed</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.article>
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
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/30">
              {pot.image
                ? <img src={pot.image} alt={pot.title} className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <span className="flex h-full w-full items-center justify-center text-xl">{pot.emoji}</span>}
              <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl-lg bg-black/60 text-[9px]">🎁</span>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold text-white">{pot.title}</h3>
              <p className={cn("text-[11px] font-medium", th.label)}>{th.modeLabel} · 🤫 secret</p>
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
            Open my gift 🎁
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
// CATALOGUE CARD (SVG circle + 3D tilt)
// ═══════════════════════════════════════════════════════════════════════════════

function CatalogCard({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem) => void }) {
  const [circling, setCircling] = useState(false);
  const [sparkling, setSparkling] = useState(false);
  const [added, setAdded] = useState(false);
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
    <motion.div
      whileHover={!added ? { y: -3 } : {}}
      whileTap={!added ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn("relative overflow-visible rounded-2xl cursor-pointer bg-white")}
      style={{ boxShadow: added
        ? `0 0 0 2px #34d399, 0 4px 20px ${item.glowColor}20`
        : "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}
      onClick={handleClick}
    >
      {/* SVG circle overlay */}
      {circling && (
        <div className="pointer-events-none absolute z-20" style={{ inset: "-5px" }}>
          <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <rect x="2" y="2" width="96" height="96" rx="10" ry="10"
              stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray="400" vectorEffect="non-scaling-stroke"
              className="animate-draw-circle"
              style={{ filter: "drop-shadow(0 0 8px #f59e0b)" }}
            />
          </svg>
        </div>
      )}
      {sparkling && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          {SPARKLES.map((s) => (
            <span key={s.id} className="absolute rounded-full animate-sparkle"
              style={{ width: s.size, height: s.size, backgroundColor: s.color,
                "--spx": s.spx, "--spy": s.spy, animationDelay: s.delay,
                boxShadow: `0 0 4px ${s.color}` } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Product image tile */}
      <div className="relative overflow-hidden rounded-t-2xl" style={{ height: 120 }}>
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${item.glowColor}28 0%, transparent 60%)` }} />
        <span className={cn("absolute top-2 right-2 rounded-lg px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider shadow-sm", item.tagColor)}>
          {item.tag}
        </span>
        {/* Emoji badge bottom-left */}
        <div className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 shadow-md text-lg backdrop-blur-sm">
          {item.emoji}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2">
        <p style={{ fontFamily: "var(--font-display)" }} className="text-[13px] font-medium leading-tight text-stone-800 mb-2">{item.name}</p>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-semibold text-amber-500">£{item.price.toFixed(0)}</span>
          {added ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <Check className="h-3 w-3" /> Added
            </span>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${item.glowColor}ee, ${item.glowColor}99)`,
                boxShadow: `0 2px 8px ${item.glowColor}40` }}>
              <Plus className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CatalogueGrid({ onAdd }: { onAdd: (item: CatalogItem) => void }) {
  return (
    <section className="px-4">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Catalogue</p>
        <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-stone-800 leading-tight">Browse &amp; add to your list</p>
        <p className="text-[11px] text-stone-400 mt-0.5">Tap any card — watch the magic circle draw itself</p>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: card.rot }}
      animate={{ opacity: 1, y: 0, rotate: card.rot }}
      transition={{ type: "spring", stiffness: 320, damping: 28, delay: card.delay / 1000 }}
      className="overflow-hidden rounded-2xl border border-white/8"
      style={{ background: "linear-gradient(145deg, #2a2520, #1e1a17)" }}
    >
      {/* Postcard header */}
      <div className="flex items-center gap-2.5 border-b border-white/6 bg-white/5 px-4 py-2.5">
        <span className="text-xl">{card.emoji}</span>
        <div>
          <p style={{ fontFamily: "var(--font-display)" }} className="text-[13px] font-medium text-stone-200">{card.name}</p>
          {card.hasVideo && (
            <span className="rounded-sm bg-rose-500/20 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-rose-400">VIDEO</span>
          )}
        </div>
      </div>
      {/* Message body */}
      <div className="px-4 py-3">
        <p className="text-[12px] italic leading-relaxed text-stone-300">&ldquo;{card.message}&rdquo;</p>
      </div>
    </motion.div>
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

  const defaultTributes = [
    { id: "g1", name: "The Whole Family", emoji: "👨‍👩‍👧‍👦", message: "We all chipped in with so much love. Enjoy every single moment!", rot: -1, delay: 0 },
    { id: "g2", name: "Gran & Grandad", emoji: "👵", message: "So proud of you. You deserve this and so much more. ✨", rot: 2, delay: 150 },
    { id: "g3", name: "Your Best Friends", emoji: "🤝", message: "Couldn't be happier for you — enjoy every second! 🎉", rot: -1, delay: 300 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-xl p-4">
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
                <span key={s.id} className="absolute rounded-full animate-fw-spark"
                  style={{ width: s.size, height: s.size, backgroundColor: s.color,
                    "--fwx": `${s.x}px`, "--fwy": `${s.y}px`, "--fw-dur": s.dur,
                    animationDelay: `${parseFloat(s.delay) + bi * 0.12}s`,
                    boxShadow: `0 0 6px ${s.color}` } as React.CSSProperties}
                />
              ))}
            </div>
          ))}
          {phase === "fireworks" && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {[0, 0.6, 1.2].map((d, i) => (
                <div key={i} className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/40 animate-sw-ring"
                  style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative z-20 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/80"
        style={{ background: "linear-gradient(145deg, #1c1917, #171310)" }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-stone-400 hover:text-stone-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </motion.button>

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-5 px-6 py-9">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1.5">✨ A gift awaits</p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold text-white leading-tight">{pot.title}</p>
            </div>
            {/* Gift box with pulsing rings */}
            <div className="relative flex items-center justify-center py-2">
              {[80, 110, 140].map((size, i) => (
                <div key={i} className="absolute rounded-full border border-amber-400/15 animate-sw-ring"
                  style={{ width: size, height: size, animationDelay: `${i * 0.55}s` }} />
              ))}
              <div className={cn("relative z-10 rounded-3xl p-7 border",
                isXmas ? "bg-gradient-to-br from-red-950 to-red-900/80 border-red-700/40 animate-gift-glow"
                        : "bg-gradient-to-br from-violet-950 to-indigo-900/80 border-violet-500/40 animate-gift-glow-plum")}>
                <span className="text-7xl select-none">{isXmas ? "🎁" : "🎀"}</span>
              </div>
            </div>
            {/* Contributors */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {["👩","👨","👵","👴"].slice(0, Math.min(4, pot.contributors)).map((e, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-800 text-sm">{e}</div>
                ))}
              </div>
              <p className="text-[11px] text-stone-400">{pot.contributors} people chipped in with love</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              onClick={startReveal}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f97316)", boxShadow: "0 4px 20px rgba(251,146,60,0.45)" }}
            >
              <Zap className="h-5 w-5 text-stone-900" strokeWidth={2.5} />
              <span style={{ fontFamily: "var(--font-display)" }} className="text-[17px] font-semibold text-stone-900">Unwrap Now!</span>
            </motion.button>
          </div>
        )}

        {/* ── SHAKING ── */}
        {(phase === "shaking" || phase === "flashing") && (
          <div className="flex flex-col items-center gap-5 px-6 py-10 overflow-hidden">
            <div className={cn("animate-box-shake rounded-3xl p-7 border",
              isXmas ? "bg-gradient-to-br from-red-950 to-red-900/80 border-red-700/40"
                      : "bg-gradient-to-br from-violet-950 to-indigo-900/80 border-violet-500/40")}>
              <span className="text-7xl">{isXmas ? "🎁" : "🎀"}</span>
            </div>
            <p style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-medium text-amber-400 animate-pulse">Something incredible is inside…</p>
            {/* Intensity bar */}
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-tribute-bar" style={{ "--tribute-dur": "1s" } as React.CSSProperties} />
            </div>
          </div>
        )}

        {/* ── FIREWORKS ── */}
        {phase === "fireworks" && (
          <div className="flex flex-col items-center gap-4 px-6 py-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">🎉 Fully Funded!</p>
            {/* Product image reveal */}
            {pot.image && (
              <div className="animate-scale-in overflow-hidden rounded-2xl shadow-xl shadow-black/50" style={{ width: 160, height: 120 }}>
                <img src={pot.image} alt={pot.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="text-center animate-fade-up">
              <p style={{ fontFamily: "var(--font-display)", textShadow: "0 0 40px #f59e0b60" }}
                className="text-[52px] font-semibold text-amber-400 leading-none tabular-nums">
                £{pot.goal.toLocaleString()}
              </p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-300 mt-1">{pot.title}</p>
            </div>
            <div className="w-full">
              <FundingBar raised={pot.goal} goal={pot.goal} />
              <p className="mt-2 text-center text-[11px] text-emerald-400 font-medium">
                {pot.contributors} people made this happen 🙌
              </p>
            </div>
          </div>
        )}

        {/* ── MOSAIC ── */}
        {phase === "mosaic" && (
          <div className="flex flex-col gap-4 px-4 py-6 max-h-[72vh] overflow-y-auto">
            <div className="text-center">
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-white">Messages from the family 💌</p>
              <p className="text-[11px] text-stone-500 mt-0.5">From everyone who loves you</p>
            </div>
            <div className="flex flex-col gap-3">
              {(pot.tributes.length > 0 ? pot.tributes : defaultTributes).map((card) => (
                <MemoryCardView key={card.id} card={card} />
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={() => setPhase("actions")}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f97316)", boxShadow: "0 4px 16px rgba(251,146,60,0.35)" }}
            >
              <span style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-900">What happens next?</span>
              <SkipForward className="h-4 w-4 text-stone-900" />
            </motion.button>
          </div>
        )}

        {/* ── ACTIONS ── */}
        {phase === "actions" && (
          <div className="flex flex-col gap-4 px-4 py-6">
            <div className="text-center">
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-white">What would you like to do?</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Your £{pot.goal.toLocaleString()} is ready</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {REVEAL_ACTIONS.map(({ icon: Icon, label, desc, gradient, textCol }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className={cn("flex flex-col items-start gap-1.5 rounded-2xl p-3.5 text-left", `bg-gradient-to-br ${gradient}`)}
                >
                  <Icon className={cn("h-5 w-5", textCol)} strokeWidth={2} />
                  <p style={{ fontFamily: "var(--font-display)" }} className={cn("text-[13px] font-medium leading-tight", textCol)}>{label}</p>
                  <p className={cn("text-[10px] leading-tight opacity-75", textCol)}>{desc}</p>
                </motion.button>
              ))}
            </div>
            <button onClick={onClose} className="mt-1 text-[11px] text-stone-500 hover:text-stone-300 transition-colors text-center">
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
  /* ── Scene 1: The Gifting Paradox ── */
  if (id === 1) {
    const dupes = ["🧸","📦","🧦","🪆","🕯️","📦","🧸","🧦"];
    const dreams = [
      { e: "🚵", label: "Mountain Bike", val: "£450" },
      { e: "🔥", label: "Cosy Log Burner", val: "£600" },
      { e: "✈️", label: "Dream Holiday", val: "£1,200" },
      { e: "🏠", label: "House Deposit", val: "£5,000" },
    ];
    return (
      <div className="relative flex h-full w-full overflow-hidden">
        {/* Left: junk pile */}
        <div className="flex w-[44%] flex-col items-center justify-center gap-2 bg-red-950/40 px-2 py-3 border-r border-stone-700">
          <div className="flex flex-wrap justify-center gap-1">
            {dupes.map((e, i) => (
              <span key={i} className="text-base grayscale opacity-60" style={{ animationDelay: `${i*0.1}s` }}>{e}</span>
            ))}
          </div>
          <div className="mt-1 rounded-full bg-red-500/90 px-2 py-0.5">
            <p className="text-[9px] font-black text-white tracking-widest">✕ WASTED</p>
          </div>
          <p className="text-[8px] text-red-400 text-center leading-tight">Forgotten in landfill</p>
        </div>
        {/* Centre VS badge */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 border-2 border-amber-400 shadow-lg shadow-amber-900/50">
            <span className="text-[9px] font-black text-amber-400">OR</span>
          </div>
        </div>
        {/* Right: dream cards */}
        <div className="flex w-[56%] flex-col justify-center gap-1.5 px-2.5 py-3">
          {dreams.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/40 to-orange-900/30 px-2.5 py-1.5"
              style={{ opacity: progress > i * 0.18 ? 1 : 0.2, transition: "opacity 0.5s ease", transitionDelay: `${i * 0.1}s` }}
            >
              <span className="text-base">{d.e}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-amber-300 truncate">{d.label}</p>
              </div>
              <span className="text-[9px] font-black text-emerald-400 shrink-0">{d.val}</span>
            </div>
          ))}
          <p className="mt-0.5 text-[8px] text-amber-400 text-center font-bold">✦ Combine forces to unlock</p>
        </div>
        {/* WOULD YOU RATHER stamp */}
        {progress > 0.25 && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <div className="rounded-full bg-amber-400 px-3 py-0.5 shadow-lg shadow-amber-900/40 animate-bounce-in-up">
              <p className="text-[9px] font-black text-stone-900 tracking-widest">WOULD YOU RATHER?</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Scene 2: Parent Knows Best Checklist ── */
  if (id === 2) {
    const items = [
      { label: "Storybook Collection", price: "£15", who: "👵 Grandma Linda", claimAt: 0.2 },
      { label: "Lego Space Set", price: "£25", who: "👨‍🦲 Uncle Steve", claimAt: 0.45 },
      { label: "Marvel Figure Set", price: "£18", who: "👩 Auntie Jo", claimAt: 0.72 },
    ];
    return (
      <div className="flex h-full flex-col justify-center gap-1.5 px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-base">👩</span>
          <div>
            <p className="text-[10px] font-black text-white">Parent&apos;s Checklist</p>
            <p className="text-[8px] text-stone-400">Real-time duplicate protection</p>
          </div>
        </div>
        {items.map((item, i) => {
          const claimed = progress > item.claimAt;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 border transition-all duration-500",
                claimed ? "bg-emerald-900/30 border-emerald-700/50" : "bg-stone-800/70 border-stone-700/50",
              )}
            >
              <div className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 text-[10px]",
                claimed ? "border-emerald-400 bg-emerald-400 text-stone-900" : "border-stone-600 text-stone-600",
              )}>
                {claimed ? "✓" : "○"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[10px] font-semibold transition-all", claimed ? "line-through text-stone-500" : "text-stone-200")}>{item.label}</p>
                {claimed && <p className="text-[8px] text-emerald-400 font-bold">{item.who} · Secured!</p>}
              </div>
              <span className="text-[10px] font-black text-amber-400 shrink-0">{item.price}</span>
            </div>
          );
        })}
        {progress > 0.8 && (
          <div className="mt-1 flex items-center gap-1.5 animate-fade-up">
            <span className="text-[10px]">🛡️</span>
            <p className="text-[9px] font-bold text-emerald-400">All items secured · Zero duplicates guaranteed</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Scene 3: Continuous Gifting Timeline ── */
  if (id === 3) {
    const contributions = [
      { label: "+£20", from: "Grandma", at: 0.15 },
      { label: "+£15", from: "Uncle Steve", at: 0.32 },
      { label: "+£50", from: "Coworkers", at: 0.5 },
      { label: "+£30", from: "Auntie Jo", at: 0.68 },
    ];
    const milestones = ["🎂 Birthday", "🎄 Christmas", "🎓 Graduation"];
    const totalFilled = Math.min(1, progress * 1.3);
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-4 py-3">
        {/* Timeline */}
        <div className="relative flex items-center gap-0">
          {milestones.map((m, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={cn(
                "rounded-lg px-2 py-1 border text-center transition-all duration-500",
                progress > i * 0.3 ? "bg-amber-900/40 border-amber-700/50" : "bg-stone-800/50 border-stone-700/40",
              )}>
                <p className="text-[8px] font-bold text-stone-300 whitespace-nowrap">{m}</p>
              </div>
              {i < 2 && (
                <div className="absolute" style={{ left: `${(i + 1) * 33}%`, top: "8px" }}>
                  <span className="text-amber-600 text-[10px]">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Contribution chips flying in */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {contributions.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-900/30 px-2 py-0.5 transition-all duration-500"
              style={{ opacity: progress > c.at ? 1 : 0, transform: progress > c.at ? "scale(1)" : "scale(0.5)" }}
            >
              <span className="text-[9px] font-black text-amber-400">{c.label}</span>
              <span className="text-[8px] text-stone-400">from {c.from}</span>
            </div>
          ))}
        </div>
        {/* Pot fill */}
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-black text-emerald-300">🛋️ Family Sofa Pot</p>
            <p className="text-[9px] font-black text-amber-400">£{Math.round(totalFilled * 650)} / £650</p>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
              style={{ width: `${totalFilled * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── Scene 4: Under Wraps Reveal ── */
  if (id === 4) {
    const shaking = progress > 0.25 && progress < 0.55;
    const revealed = progress > 0.65;
    const fireworks = progress > 0.72;
    const messages = ["🎉 Happy Birthday!", "Love you so much!", "From Gran ❤️", "You deserve it!", "Woop woop! 🎊"];
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden bg-stone-950">
        {/* Stars bg */}
        <div className="pointer-events-none absolute inset-0">
          {[{l:"10%",t:"15%"},{l:"80%",t:"10%"},{l:"55%",t:"8%"},{l:"30%",t:"20%"},{l:"90%",t:"35%"},{l:"5%",t:"50%"}].map((p,i)=>(
            <span key={i} className="absolute text-[8px] text-white/30" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.2}s ${i*0.3}s ease-in-out infinite alternate`}}>✦</span>
          ))}
        </div>
        {!revealed ? (
          <div
            className={cn("flex flex-col items-center gap-2 transition-all", shaking && "animate-box-shake")}
          >
            <div className="relative flex h-24 w-20 flex-col">
              {/* Box lid */}
              <div className="absolute -top-3 left-0 right-0 flex h-6 items-center justify-center rounded-t-lg bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg">
                <div className="h-2 w-2 rounded-full bg-amber-300" />
              </div>
              {/* Box body */}
              <div className="mt-3 flex-1 rounded-b-lg bg-gradient-to-br from-rose-600 to-pink-700 shadow-xl shadow-rose-900/50 flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              {/* Bow */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">🎀</div>
            </div>
            <p className="text-[9px] font-bold text-stone-400">Under Wraps · progress hidden</p>
            {shaking && <p className="text-[9px] font-black text-amber-400 animate-pulse">🔥 Igniting reveal...</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-scale-in">
            {/* Firework sparks */}
            {fireworks && FW_SPARKS.slice(0, 12).map((s) => (
              <div
                key={s.id}
                className="pointer-events-none absolute h-2 w-2 rounded-full animate-fw-spark"
                style={{
                  left: "50%", top: "40%",
                  backgroundColor: s.color,
                  ["--fwx" as string]: `${s.x * 0.6}px`,
                  ["--fwy" as string]: `${s.y * 0.5}px`,
                  ["--fw-dur" as string]: s.dur,
                  animationDelay: s.delay,
                }}
              />
            ))}
            <p className="text-xl font-black text-amber-400">🎊 Reveal!</p>
            <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 px-2 py-1 animate-drift-in"
                  style={{ animationDelay: `${i * 0.1}s`, ["--card-rot" as string]: `${(i % 3 - 1) * 3}deg` }}
                >
                  <p className="text-[9px] font-bold text-stone-200">{msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Scene 5: Simple for Grandma ── */
  const phase = progress < 0.33 ? 0 : progress < 0.65 ? 1 : 2;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-3">
      {phase === 0 && (
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          {/* Mock WhatsApp bubble */}
          <div className="rounded-2xl rounded-tl-sm bg-emerald-800/60 border border-emerald-700/40 px-4 py-2.5 max-w-[200px]">
            <p className="text-[10px] font-bold text-emerald-300 mb-0.5">💬 WhatsApp · Mum</p>
            <p className="text-[11px] text-stone-200">Billy&apos;s wishlist 🎁</p>
            <p className="text-[9px] text-stone-400 mt-0.5 underline">kindledgift.co.uk/billy</p>
          </div>
          <p className="text-[9px] font-bold text-stone-400">One link · no account needed</p>
        </div>
      )}
      {phase === 1 && (
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          {/* Stripe badge */}
          <div className="flex items-center gap-1.5 rounded-xl bg-indigo-900/50 border border-indigo-700/40 px-3 py-1.5">
            <span className="text-base">🔒</span>
            <p className="text-[9px] font-black text-indigo-300">Regulated &amp; Secured by Stripe</p>
          </div>
          {/* Apple Pay button */}
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-stone-100 px-6 py-3 shadow-lg">
            <span className="text-[16px]"></span>
            <span className="text-[12px] font-black text-stone-900">Pay</span>
          </div>
          <p className="text-[9px] text-stone-400">Two taps · Apple Pay or Google Pay</p>
        </div>
      )}
      {phase === 2 && (
        <div className="flex flex-col items-center gap-3 animate-scale-in">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/40">
              <Check className="h-5 w-5 text-white" strokeWidth={3} />
            </div>
            <p className="text-[12px] font-black text-emerald-400">Payment successful!</p>
          </div>
          {/* Mini family tree / logo sign-off */}
          <div className="flex flex-col items-center gap-1">
            {[["👵","👴"],["👩","👨","👩‍🦲"],["🧒","👧","🧒"]].map((row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.map((e, ei) => (
                  <span key={ei} className="text-lg animate-bounce" style={{ animationDelay: `${(ri*3+ei)*0.08}s` }}>{e}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 100 100" width="18" height="18">
              <defs><linearGradient id="sc5-tile" x1="0" y1="0" x2="60" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FFB845"/><stop offset="100%" stopColor="#F26B2C"/></linearGradient></defs>
              <rect width="100" height="100" rx="22" fill="url(#sc5-tile)"/>
              <g fill="#FFF4E6">
                <rect x="28" y="27" width="12" height="46" rx="6"/>
                <rect x="34" y="33" width="34" height="12" rx="6" transform="rotate(-37 51 39)"/>
                <rect x="34" y="56" width="34" height="12" rx="6" transform="rotate(37 51 62)"/>
              </g>
              <path d="M48 22 C41 14 32 17 35.5 25 C38 30 44 29 48 25.5 Z" fill="#FFF4E6"/>
              <path d="M48 22 C55 14 64 17 60.5 25 C58 30 52 29 48 25.5 Z" fill="#FFF4E6"/>
              <circle cx="48" cy="23.5" r="5.5" fill="#FFD27A"/>
            </svg>
            <span className="text-[13px] font-black text-amber-400">Kindled</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Gentle ambient music via Web Audio API
function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const start = useCallback(() => {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      // Pentatonic notes: C4, E4, G4, A4, C5
      const notes = [261.63, 329.63, 392.0, 440.0, 523.25];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);
      masterGain.connect(ctx.destination);
      nodesRef.current.push(masterGain);

      // Soft pad — slow sine waves on pentatonic notes
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = 0.015 + (i % 2) * 0.008;
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        nodesRef.current.push(osc, g);
      });

      // Gentle arpeggiated melody
      let t = ctx.currentTime + 0.5;
      const melody = [0, 2, 4, 3, 1, 4, 2, 0];
      const loop = () => {
        melody.forEach((ni, i) => {
          const freq = notes[ni]! * (i > 4 ? 2 : 1);
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(0.06, t + 0.05);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          osc.connect(env);
          env.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.9);
          t += 0.75;
        });
        // Repeat every ~6s
        setTimeout(() => { if (nodesRef.current.length > 0) loop(); }, (t - ctx.currentTime) * 1000 - 200);
      };
      loop();
    } catch { /* silent */ }
  }, []);

  const stop = useCallback(() => {
    try {
      const ctx = ctxRef.current;
      if (!ctx) return;
      // Fade out master gain
      nodesRef.current.forEach((n) => {
        if (n instanceof GainNode) {
          n.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        }
      });
      setTimeout(() => {
        nodesRef.current.forEach((n) => { try { (n as OscillatorNode).stop?.(); } catch { /* ok */ } });
        nodesRef.current = [];
      }, 900);
    } catch { /* silent */ }
  }, []);

  return { start, stop };
}

// Animated caption — reveals words one by one, no overlap
function AnimatedCaption({ text, playing }: { text: string; playing: boolean }) {
  const words = text.split(" ");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (!playing) { setVisibleCount(words.length); return; }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= words.length) clearInterval(interval);
    }, 110);
    return () => clearInterval(interval);
  }, [text, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <p className="text-[12px] leading-relaxed text-stone-700 font-medium">
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block mr-1 transition-all duration-200"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "translateY(0)" : "translateY(6px)",
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

function ExplainerPlayer() {
  const [open, setOpen] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { start: startMusic, stop: stopMusic } = useAmbientMusic();
  const SCENE_DUR = 24;
  const TOTAL = SCENES.length * SCENE_DUR;

  useEffect(() => {
    if (!playing) return;
    if (!muted) startMusic();
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e >= TOTAL - 1) { setPlaying(false); return TOTAL; }
        return e + 0.25;
      });
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopMusic();
    };
  }, [playing, muted, startMusic, stopMusic, TOTAL]);

  const currentScene = Math.min(SCENES.length - 1, Math.floor(elapsed / SCENE_DUR));
  const sceneProgress = (elapsed % SCENE_DUR) / SCENE_DUR;

  useEffect(() => {
    if (currentScene !== sceneIdx) setSceneIdx(currentScene);
  }, [currentScene, sceneIdx]);

  const jumpTo = (idx: number) => setElapsed(idx * SCENE_DUR);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) stopMusic();
      else if (!muted) startMusic();
      return !p;
    });
  }, [muted, startMusic, stopMusic]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) stopMusic();
      else if (playing) startMusic();
      return !m;
    });
  }, [playing, startMusic, stopMusic]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setPlaying(false);
    stopMusic();
  }, [stopMusic]);

  if (!open) return (
    <div className="mx-4">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <Play className="h-5 w-5 translate-x-0.5 text-stone-900" strokeWidth={2.5} fill="currentColor" />
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-800">📺 Watch How Kindled Works</p>
          <p className="text-[11px] text-stone-400">5 scenes · multi-seasonal gifting · ambient music</p>
        </div>
      </motion.button>
    </div>
  );

  const scene = SCENES[sceneIdx]!;

  return (
    <div className="mx-4 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-200/60">
      {/* Scene label */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
          Scene {sceneIdx + 1}/5 · {scene.title}
        </span>
        <button onClick={handleClose} className="text-stone-400 hover:text-stone-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Viewport */}
      <div className="h-52 bg-stone-950">
        <SceneVisual id={sceneIdx + 1} progress={sceneProgress} />
      </div>

      {/* Caption — fixed height, no clamp, words animate in */}
      <div className="min-h-[72px] border-t border-stone-100 bg-amber-50/40 px-5 py-3.5 flex items-center">
        <AnimatedCaption key={sceneIdx} text={scene.caption} playing={playing} />
      </div>

      {/* Controls */}
      <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-3">
        {/* Progress bar */}
        <div
          className="h-1.5 w-full cursor-pointer rounded-full bg-stone-200"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            setElapsed(Math.round(ratio * TOTAL));
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-100"
            style={{ width: `${(elapsed / TOTAL) * 100}%` }}
          />
        </div>

        {/* Buttons + time */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900 shadow-md shadow-amber-200 active:scale-90 transition-transform"
          >
            {playing
              ? <Pause className="h-4 w-4" strokeWidth={2.5} fill="currentColor" />
              : <Play className="h-4 w-4 translate-x-0.5" strokeWidth={2.5} fill="currentColor" />}
          </button>
          <button
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 active:scale-90 transition-all"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <span className="flex-1 text-right font-mono text-[10px] text-stone-400 tabular-nums">
            {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")} / 2:00
          </span>
        </div>

        {/* Scene dots */}
        <div className="flex justify-center gap-2">
          {SCENES.map((s, i) => (
            <button key={s.id} onClick={() => jumpTo(i)}
              className={cn("h-1.5 rounded-full transition-all duration-300",
                i === sceneIdx ? "w-6 bg-amber-400" : "w-1.5 bg-stone-300 hover:bg-stone-400")}
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
// KINDLED STARS — KIDS SPACE
// ═══════════════════════════════════════════════════════════════════════════════

// Pre-computed twinkling stars
const TWINKLE_STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  cx: 5 + (i * 237) % 90,
  cy: 2 + (i * 173) % 35,
  r: 1 + (i % 3),
  delay: `${(i * 0.31) % 2.8}s`,
  dur: `${1.4 + (i * 0.19) % 1.2}s`,
}));

const CHORES = [
  { id: "c1", emoji: "🪥", title: "Toothbrush Hero", desc: "Brush teeth morning & night", stars: 1, color: "from-sky-400 to-blue-500", shadow: "shadow-sky-200" },
  { id: "c2", emoji: "🧸", title: "Toy Castle Tidyer", desc: "Put toys back in the box", stars: 2, color: "from-violet-400 to-purple-500", shadow: "shadow-violet-200" },
  { id: "c3", emoji: "🥦", title: "Veggie Victory", desc: "Eat all your greens at dinner", stars: 1, color: "from-emerald-400 to-green-500", shadow: "shadow-emerald-200" },
  { id: "c4", emoji: "📚", title: "Storytime Sleepyhead", desc: "Bed on time without a fuss", stars: 2, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-200" },
];

// Flying star particle type
interface FlyingStar {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

function useMagicChime() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      [880, 1108, 1318, 1760].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        const t = ctx.currentTime + i * 0.09;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.55);
      });
    } catch { /* silent */ }
  }, []);
}

function StarIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

const BURST_EMOJIS = ["⭐", "✨", "🌟", "💫", "⭐", "✨", "🌟", "💫", "⭐", "✨", "🌟", "💫"];
const BURST_COLORS = ["#fbbf24", "#f59e0b", "#fb923c", "#a78bfa", "#38bdf8", "#4ade80", "#f472b6", "#facc15", "#60a5fa", "#34d399", "#fb7185", "#c084fc"];

function StarBurst({ x, y }: { x: number; y: number }) {
  const particles = BURST_EMOJIS.map((emoji, i) => {
    const angle = (i / BURST_EMOJIS.length) * Math.PI * 2 - Math.PI / 2;
    const dist = 55 + (i % 3) * 22;
    return { id: i, emoji, color: BURST_COLORS[i]!, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
  });
  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {/* Screen flash */}
      <motion.div
        initial={{ opacity: 0.5 }} animate={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 bg-amber-300/30"
      />
      {/* Expanding ring × 2 */}
      {[0, 0.12].map((delay, ri) => (
        <motion.div key={ri}
          initial={{ scale: 0.1, opacity: 0.9 }} animate={{ scale: 4.5, opacity: 0 }}
          transition={{ duration: 0.55, delay, ease: "easeOut" }}
          className="absolute rounded-full border-[3px] border-amber-400"
          style={{ left: x - 24, top: y - 24, width: 48, height: 48 }}
        />
      ))}
      {/* Emoji burst particles */}
      {particles.map((p) => (
        <motion.span key={p.id}
          initial={{ x: 0, y: 0, scale: 1.4, opacity: 1 }}
          animate={{ x: p.tx, y: p.ty, scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.4, 1] }}
          className="absolute text-[18px] select-none"
          style={{ left: x - 9, top: y - 9, color: p.color }}
        >
          {p.emoji}
        </motion.span>
      ))}
      {/* Big pop star in centre */}
      <motion.span
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2.2, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.5, times: [0, 0.45, 1] }}
        className="absolute text-[32px] select-none"
        style={{ left: x - 16, top: y - 16 }}
      >🌟</motion.span>
    </div>
  );
}

function KindledStars({ pots, onClose }: { pots: DemoPot[]; onClose: () => void }) {
  const [totalStars, setTotalStars] = useState(6);
  const [filledCells, setFilledCells] = useState<Set<number>>(() => new Set(Array.from({ length: 6 }, (_, i) => i)));
  const [newCell, setNewCell] = useState<number | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const [flyingStars, setFlyingStars] = useState<FlyingStar[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [bouncing, setBouncing] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [impactPot, setImpactPot] = useState<string | null>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const chime = useMagicChime();
  const starIdRef = useRef(0);
  const EXCHANGE_RATE = 0.50;
  const targetPot = pots.find((p) => p.mode === "LIVE_FEED") ?? pots[0];

  const handleCellTap = useCallback((idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (filledCells.has(idx)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    chime();
    setBurst({ x, y, key: Date.now() });
    setTimeout(() => {
      setFilledCells((prev) => new Set([...prev, idx]));
      setNewCell(idx);
      setTotalStars((s) => s + 1);
      setBouncing(true);
      setTimeout(() => { setBouncing(false); setNewCell(null); }, 800);
    }, 420);
    setTimeout(() => setBurst(null), 750);
  }, [filledCells, chime]);

  const handleChore = useCallback((chore: typeof CHORES[0], cardEl: HTMLElement) => {
    if (completedToday.has(chore.id)) return;
    chime();
    setCompletedToday((s) => new Set([...s, chore.id]));

    const cardRect = cardEl.getBoundingClientRect();
    const potEl = potRef.current;
    const potRect = potEl ? potEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 200, width: 40, height: 40 };

    // Spawn flying stars
    const newStars: FlyingStar[] = Array.from({ length: chore.stars * 3 }, (_) => ({
      id: starIdRef.current++,
      x: cardRect.left + cardRect.width / 2 + (Math.random() - 0.5) * 40,
      y: cardRect.top + cardRect.height / 2 + (Math.random() - 0.5) * 20,
      tx: potRect.left + potRect.width / 2,
      ty: potRect.top + potRect.height / 2,
    }));
    setFlyingStars((prev) => [...prev, ...newStars]);

    setTimeout(() => {
      setTotalStars((s) => s + chore.stars);
      setBouncing(true);
      setImpactPot(targetPot?.id ?? null);
      setTimeout(() => { setBouncing(false); setImpactPot(null); }, 700);
      setFlyingStars((prev) => prev.filter((s) => !newStars.find((n) => n.id === s.id)));
    }, 900);
  }, [completedToday, chime, targetPot]);

  if (showRedeem) return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-violet-950 to-indigo-950 px-4 pt-6 pb-32">
      <button onClick={() => setShowRedeem(false)} className="mb-4 flex items-center gap-2 text-violet-300 text-[13px] font-bold">
        <span>←</span> Back to Stars
      </button>
      <div className="rounded-3xl bg-white/10 border border-white/20 p-5 text-center">
        <p className="text-4xl mb-2">🎁</p>
        <h2 className="text-[18px] font-black text-white mb-1">Redeem Stars</h2>
        <p className="text-[12px] text-violet-300 mb-5">Ask Mum or Dad to approve your gift card!</p>
        {[
          { brand: "Amazon", emoji: "📦", val: 10, stars: 20 },
          { brand: "Smyths Toys", emoji: "🧸", val: 5, stars: 10 },
          { brand: "LEGO Store", emoji: "🧱", val: 15, stars: 30 },
        ].map((gc) => (
          <div key={gc.brand} className="mb-3 flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{gc.emoji}</span>
              <div className="text-left">
                <p className="text-[13px] font-bold text-white">{gc.brand} Gift Card</p>
                <p className="text-[11px] text-violet-300">£{gc.val} · 0% fees</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black text-amber-400">{gc.stars} ⭐</p>
              <button className={cn(
                "mt-1 rounded-xl px-3 py-1 text-[11px] font-bold",
                totalStars >= gc.stars
                  ? "bg-amber-400 text-stone-900"
                  : "bg-white/10 text-white/40 cursor-not-allowed",
              )}>
                {totalStars >= gc.stars ? "Redeem" : "Need more ⭐"}
              </button>
            </div>
          </div>
        ))}
        <p className="mt-4 text-[10px] text-violet-400">Parent approval required · Powered by Kindled × Tillo</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-950 via-violet-950 to-indigo-900 overflow-hidden pb-32">
      {/* Star burst overlay */}
      <AnimatePresence>
        {burst && <StarBurst key={burst.key} x={burst.x} y={burst.y} />}
      </AnimatePresence>
      {/* Flying stars overlay */}
      {flyingStars.map((s) => (
        <div
          key={s.id}
          className="pointer-events-none fixed z-50 text-amber-400"
          style={{
            left: s.x, top: s.y,
            animation: `fly-to-pot 0.9s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
            ["--tx" as string]: `${s.tx - s.x}px`,
            ["--ty" as string]: `${s.ty - s.y}px`,
          }}
        >
          <StarIcon size={18} />
        </div>
      ))}

      {/* Twinkling star background */}
      <div className="pointer-events-none absolute inset-0">
        <svg className="w-full h-40" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice">
          {TWINKLE_STARS.map((s) => (
            <circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white"
              style={{ animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite alternate`, opacity: 0.6 }} />
          ))}
        </svg>
        {/* Clouds */}
        {[{ x: "5%", y: 48 }, { x: "55%", y: 28 }, { x: "75%", y: 60 }].map((c, i) => (
          <div key={i} className="absolute" style={{ left: c.x, top: c.y }}>
            <div className="flex">
              {[28, 38, 28].map((w, j) => (
                <div key={j} className="rounded-full bg-white/8" style={{ width: w, height: w * 0.6, marginLeft: j > 0 ? -8 : 0 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-5 pb-4">
        <button onClick={onClose} className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-violet-300 active:opacity-70">
          <span>←</span> Back to Dashboard
        </button>
        <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-1">✨ Kindled Stars</p>
        <h1 className="text-[22px] font-black text-white leading-tight">Billy&apos;s Star Dashboard 🚀</h1>
        <p className="text-[12px] text-violet-300 mt-1">Complete adventures to earn stars!</p>
        </div>

        {/* Giant star counter */}
        <div className={cn(
          "mt-4 inline-flex flex-col items-center gap-1 rounded-3xl bg-white/10 border border-white/20 px-8 py-4 transition-transform",
          bouncing && "animate-bounce",
        )}>
          <div className="flex items-center gap-2">
            <StarIcon size={32} className={cn("text-amber-400 drop-shadow-lg", bouncing && "animate-spin")} />
            <span className="text-[48px] font-black text-amber-400 leading-none tabular-nums">{totalStars}</span>
            <StarIcon size={32} className={cn("text-amber-400 drop-shadow-lg", bouncing && "animate-spin")} />
          </div>
          <p className="text-[12px] font-bold text-amber-300">Stars Earned</p>
          <p className="text-[10px] text-violet-400">= £{(totalStars * EXCHANGE_RATE).toFixed(2)} towards your dream!</p>
        </div>
      </header>

      {/* Star exchange rate */}
      <div className="relative z-10 mx-4 mb-4 rounded-2xl bg-white/8 border border-white/15 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-[12px] font-bold text-white">Star Exchange Rate</p>
            <p className="text-[11px] text-violet-300">1 ⭐ = £{EXCHANGE_RATE.toFixed(2)} funded by Mum &amp; Dad</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] font-black text-emerald-400">£{(totalStars * EXCHANGE_RATE).toFixed(2)}</p>
            <p className="text-[9px] text-violet-400">total earned</p>
          </div>
        </div>
      </div>

      {/* Target pot */}
      {targetPot && (
        <div ref={potRef} className="relative z-10 mx-4 mb-5 rounded-2xl bg-white/10 border-2 border-amber-400/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{targetPot.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{targetPot.title}</p>
              <div className="mt-1.5 h-3 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500", impactPot === targetPot.id && "animate-pulse")}
                  style={{ width: `${Math.min(100, Math.round((targetPot.raised / targetPot.goal) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-violet-300 mt-1">£{targetPot.raised} / £{targetPot.goal} · Stars splash here! 🌟</p>
            </div>
            {impactPot === targetPot.id && (
              <div className="text-2xl animate-bounce">✨</div>
            )}
          </div>
        </div>
      )}

      {/* Daily Adventures */}
      <section className="relative z-10 px-4 mb-6">
        <h2 className="text-[14px] font-black text-white mb-1">🗺️ Daily Adventures</h2>
        <p className="text-[11px] text-violet-400 mb-3">Tap to complete · Stars fly to your pot!</p>
        <div className="grid grid-cols-2 gap-3">
          {CHORES.map((chore) => {
            const done = completedToday.has(chore.id);
            return (
              <button
                key={chore.id}
                onClick={(e) => handleChore(chore, e.currentTarget)}
                disabled={done}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-3xl p-4 text-center transition-all duration-300 active:scale-95",
                  done
                    ? "bg-white/15 border-2 border-white/30 opacity-80"
                    : `bg-gradient-to-br ${chore.color} shadow-lg ${chore.shadow}`,
                )}
              >
                {done && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-stone-900 text-2xl font-black shadow-lg">
                      ✓
                    </div>
                  </div>
                )}
                <span className="text-4xl">{chore.emoji}</span>
                <p className="text-[12px] font-black text-white leading-tight">{chore.title}</p>
                <p className="text-[10px] text-white/80 leading-tight">{chore.desc}</p>
                <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 mt-1">
                  <StarIcon size={12} className="text-amber-300" />
                  <span className="text-[11px] font-black text-white">+{chore.stars}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 20-step sticker chart */}
      <section className="relative z-10 mx-4 mb-5 rounded-3xl bg-white/8 border border-white/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white">Star Chart</p>
            <p className="text-[11px] text-violet-300">Fill 20 stars → unlock your reward! 🚀</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black text-amber-400">{filledCells.size}/20</p>
            <p className="text-[9px] text-violet-400">filled</p>
          </div>
        </div>
        {/* 4×5 sticker grid */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }, (_, idx) => {
            const filled = filledCells.has(idx);
            const isNew = newCell === idx;
            const isMilestone = idx === 4 || idx === 9 || idx === 14 || idx === 19;
            return (
              <motion.button
                key={idx}
                onClick={(e) => handleCellTap(idx, e)}
                disabled={filled}
                whileTap={!filled ? { scale: 0.85 } : {}}
                whileHover={!filled ? { scale: 1.08, borderColor: "rgba(251,191,36,0.6)" } : {}}
                animate={isNew ? { scale: [0.3, 1.35, 0.95, 1.1, 1] } : {}}
                transition={isNew ? { duration: 0.55, times: [0, 0.35, 0.55, 0.75, 1], type: "tween" } : { type: "spring", stiffness: 400, damping: 22 }}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-2xl border-2 text-[18px] transition-colors",
                  filled
                    ? isMilestone
                      ? "border-amber-300 bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/40"
                      : "border-amber-400/60 bg-gradient-to-br from-yellow-300/40 to-amber-400/30"
                    : "border-white/20 bg-white/5 cursor-pointer active:bg-white/10",
                )}
              >
                {filled ? (
                  <motion.span
                    initial={isNew ? { scale: 0, rotate: -30 } : false}
                    animate={isNew ? { scale: 1, rotate: 0 } : {}}
                    transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
                    className="select-none"
                    style={{ animation: filled && !isNew ? `twinkle ${1.2 + (idx % 5) * 0.25}s ${idx * 0.07}s ease-in-out infinite alternate` : undefined }}
                  >
                    {isMilestone ? "🌟" : "⭐"}
                  </motion.span>
                ) : (
                  <span className="text-[10px] font-black text-white/25 select-none">{idx + 1}</span>
                )}
                {isMilestone && filled && (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[7px] font-black text-white shadow">!</div>
                )}
                {/* Pulse ring on empty cells to invite tapping */}
                {!filled && idx === filledCells.size && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-amber-400/60"
                    animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-violet-400 text-center">
          {filledCells.size >= 20
            ? "🎉 Chart complete! Ask Mum or Dad to redeem your reward!"
            : `Tap the next square to add your star! ${20 - filledCells.size} to go ✨`}
        </p>
      </section>

      {/* Redeem CTA */}
      <div className="relative z-10 mx-4">
        <button
          onClick={() => setShowRedeem(true)}
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[15px] font-black text-stone-900 shadow-xl shadow-amber-900/30 active:scale-[0.97] transition-transform"
        >
          <StarIcon size={20} />
          Exchange Stars for Gift Cards
        </button>
        <p className="mt-2 text-center text-[10px] text-violet-500">Parent approval required · 0% fees · Instant delivery</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW GIFT SHEET
// ═══════════════════════════════════════════════════════════════════════════════

type EventType = "birthday" | "christmas" | "custom" | "ongoing";
type FetchState = "idle" | "fetching" | "done" | "error";

function parseProductUrl(raw: string): { title: string; price: string } {
  try {
    const u = new URL(raw);
    const amzMatch = u.pathname.match(/\/([A-Za-z0-9][A-Za-z0-9-]{3,})\/dp\//);
    if (amzMatch) {
      const title = (amzMatch[1] ?? "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      return { title, price: "" };
    }
    const segments = u.pathname.split("/").filter(Boolean);
    const last = (segments[segments.length - 1] ?? "").replace(/\.(html?|php|aspx?)$/i, "");
    const title = last
      ? last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : `Product from ${u.hostname.replace(/^www\./, "")}`;
    return { title, price: "" };
  } catch {
    return { title: "", price: "" };
  }
}

const EVENT_OPTIONS: { type: EventType; label: string; emoji: string }[] = [
  { type: "birthday",  label: "Birthday",  emoji: "🎂" },
  { type: "christmas", label: "Christmas", emoji: "🎄" },
  { type: "custom",    label: "Other",     emoji: "🗓️" },
  { type: "ongoing",   label: "Ongoing",   emoji: "∞"  },
];

const ACCENT_GRADIENTS = [
  "from-rose-500 via-pink-400 to-orange-400",
  "from-sky-500 via-blue-400 to-indigo-400",
  "from-green-500 via-emerald-400 to-teal-400",
  "from-amber-500 via-yellow-400 to-orange-400",
  "from-fuchsia-500 via-purple-400 to-indigo-500",
];

function NewGiftSheet({ onAdd, onClose }: { onAdd: (pot: DemoPot) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"link" | "manual">("link");
  const [url, setUrl] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [eventType, setEventType] = useState<EventType>("birthday");
  const [isSurprise, setIsSurprise] = useState(true);
  const [eventDate, setEventDate] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUrlChange = useCallback((val: string) => {
    setUrl(val);
    setFetchState("idle");
    setTitle("");
    setAmount("");
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    const trimmed = val.trim();
    if (trimmed.startsWith("http") && trimmed.length > 15) {
      setFetchState("fetching");
      fetchTimer.current = setTimeout(() => {
        const parsed = parseProductUrl(trimmed);
        setTitle(parsed.title);
        setAmount(parsed.price);
        setFetchState("done");
      }, 1400);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch {
      /* clipboard blocked */
    }
  }, [handleUrlChange]);

  const canSubmit = title.trim().length > 0 && amount.length > 0 && parseFloat(amount) > 0;

  function buildPot(): DemoPot {
    const goal = parseFloat(amount) || 100;
    const isLocked = isSurprise && eventType !== "ongoing";

    let potMode: DemoPot["mode"] = "LIVE_FEED";
    let evLabel = "Ongoing";
    let evDate = "Anytime";
    let evIso = "2027-01-01T00:00:00Z";

    if (isLocked) {
      if (eventType === "christmas") {
        potMode = "UNDER_THE_TREE";
        evLabel = "Christmas";
        evDate = "Dec 25";
        evIso = "2026-12-25T08:00:00Z";
      } else {
        potMode = "WRAPPED_UP";
        const d = eventDate ? new Date(eventDate) : new Date("2026-09-15");
        evLabel = eventType === "birthday" ? "Birthday" : (customLabel || "Event");
        evDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        evIso = d.toISOString();
      }
    } else if (eventType !== "ongoing") {
      if (eventType === "christmas") { evLabel = "Christmas"; evDate = "Dec 25"; evIso = "2026-12-25T08:00:00Z"; }
      else {
        const d = eventDate ? new Date(eventDate) : new Date("2026-09-15");
        evLabel = eventType === "birthday" ? "Birthday" : (customLabel || "Event");
        evDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        evIso = d.toISOString();
      }
    }

    return {
      id: `p${Date.now()}`,
      title: title.trim(),
      emoji: eventType === "christmas" ? "🎄" : eventType === "birthday" ? "🎂" : "🎁",
      goal,
      raised: 0,
      mode: potMode,
      continuous: eventType === "ongoing",
      eventLabel: evLabel,
      eventDate: evDate,
      eventIso: evIso,
      contributors: 0,
      boosterEntries: 0,
      accentGradient: ACCENT_GRADIENTS[Math.floor(Math.random() * ACCENT_GRADIENTS.length)]!,
      tributes: [],
    };
  }

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd(buildPot());
    onClose();
  };

  const showDatePicker = eventType !== "ongoing" && eventType !== "christmas";
  const showSurpriseToggle = eventType !== "ongoing";

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-[#fdf9f5] shadow-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold text-stone-900 leading-tight">New Gift</h2>
            <p className="text-[12px] text-stone-400">Add something special to the list</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 active:scale-95 transition-transform">
            <span className="text-[14px] font-bold leading-none">✕</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
            {(["link", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setTitle(""); setAmount(""); setUrl(""); setFetchState("idle"); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all",
                  mode === m ? "bg-white shadow text-stone-900" : "text-stone-400",
                )}
              >
                {m === "link" ? "🔗  Paste a link" : "✏️  Enter manually"}
              </button>
            ))}
          </div>

          {/* Link mode */}
          {mode === "link" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  placeholder="amazon.co.uk/... or any product URL"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 pr-20 text-[14px] text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => { void handlePaste(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-100 px-3 py-1.5 text-[12px] font-semibold text-amber-700 active:scale-95 transition-transform"
                >
                  Paste
                </button>
              </div>

              {/* Fetch loading state */}
              {fetchState === "fetching" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-amber-400"
                        style={{ animation: `bounce 0.9s ${i * 0.15}s ease-in-out infinite` }}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] font-medium text-amber-700">Fetching product details…</p>
                </motion.div>
              )}

              {/* Fetched result — editable */}
              {fetchState === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px]">✅</span>
                    <p className="text-[12px] font-semibold text-emerald-700">Product details found — edit if needed</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Product name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[14px] text-stone-800 focus:border-amber-400 focus:outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-stone-400">£</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white pl-7 pr-3 py-2 text-[14px] text-stone-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Manual mode */}
          {mode === "manual" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Gift name e.g. LEGO Technic Ferrari"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none transition-colors"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-stone-400">£</span>
                <input
                  type="number"
                  placeholder="Goal amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-8 pr-4 py-3 text-[14px] text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* Event type */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-stone-400">For which event?</p>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <button
                  key={ev.type}
                  onClick={() => setEventType(ev.type)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-3 text-center transition-all",
                    eventType === ev.type
                      ? "bg-amber-400 text-stone-900 shadow-md shadow-amber-200"
                      : "bg-stone-100 text-stone-500",
                  )}
                >
                  <span className="text-[18px]">{ev.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight">{ev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date picker for non-christmas dated events */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {eventType === "custom" && (
                  <input
                    type="text"
                    placeholder="Event name e.g. Graduation"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
                  />
                )}
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-800 focus:border-amber-400 focus:outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Surprise toggle */}
          <AnimatePresence>
            {showSurpriseToggle && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onClick={() => setIsSurprise((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                  isSurprise ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white",
                )}
              >
                <span className="text-2xl">{isSurprise ? "🔒" : "👁️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-stone-800">
                    {isSurprise ? "Keep it a surprise" : "Visible to everyone"}
                  </p>
                  <p className="text-[12px] text-stone-400 mt-0.5">
                    {isSurprise
                      ? "Hidden from the recipient until the big day"
                      : "Recipient can see progress and contributions"}
                  </p>
                </div>
                <div className={cn(
                  "h-6 w-11 rounded-full transition-colors relative",
                  isSurprise ? "bg-amber-400" : "bg-stone-200",
                )}>
                  <div className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    isSurprise ? "translate-x-5" : "translate-x-0.5",
                  )} />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: canSubmit ? 1.01 : 1 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[16px] font-semibold transition-all",
              canSubmit
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900 shadow-lg shadow-amber-200"
                : "bg-stone-100 text-stone-400 cursor-not-allowed",
            )}
          >
            <span className="text-[18px]">🎁</span>
            <span style={{ fontFamily: "var(--font-display)" }}>Add to list</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SWITCHER
// ═══════════════════════════════════════════════════════════════════════════════

function RoleSwitcher({ role, onChange }: { role: "parent" | "receiver"; onChange: (r: "parent" | "receiver") => void }) {
  return (
    <div className="sticky top-0 z-30 flex justify-center px-4 pt-3 pb-2 bg-[#fdf9f5]/90 backdrop-blur-md border-b border-stone-100">
      <div className="flex w-full max-w-sm rounded-2xl bg-stone-100 p-1 gap-1 shadow-inner">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange("parent")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
            role === "parent" ? "bg-white shadow-sm text-stone-900" : "text-stone-400",
          )}
        >
          {role === "parent" && (
            <motion.div layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" style={{ zIndex: -1 }} />
          )}
          <span className="text-base">👩‍👧</span>
          <span>Contributor</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange("receiver")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
            role === "receiver" ? "bg-white shadow-sm text-stone-900" : "text-stone-400",
          )}
        >
          {role === "receiver" && (
            <motion.div layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" style={{ zIndex: -1 }} />
          )}
          <span className="text-base">🧒</span>
          <span>Billy&apos;s view</span>
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVER VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ReceiverView({ pots, onOpenStars }: {
  pots: DemoPot[];
  onOpenStars: () => void;
}) {
  const livePots = pots.filter((p) => p.mode === "LIVE_FEED" && !p.isClaimed);
  const claimedPots = pots.filter((p) => p.mode === "LIVE_FEED" && p.isClaimed);
  const surpriseCount = pots.filter((p) => p.mode !== "LIVE_FEED").length;
  const totalRaised = pots.filter((p) => p.mode === "LIVE_FEED").reduce((s, p) => s + p.raised, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f0] to-[#fdf9f5]">
      {/* Hero greeting */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-3xl shadow-lg shadow-amber-200">
            🧒
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500">Your Kindled list</p>
            <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[24px] font-semibold text-stone-900 leading-tight">Hey Billy! 👋</h1>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { value: `£${totalRaised}`, label: "kindled so far", color: "text-amber-500" },
            { value: livePots.length, label: "wishes", color: "text-orange-500" },
            { value: `${surpriseCount}`, label: "surprises 🔒", color: "text-violet-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <p className={cn("text-[18px] font-bold", s.color)} style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
              <p className="text-[10px] text-stone-400 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pb-20 px-4">

        {/* ── Surprise gifts teaser ── */}
        {surpriseCount > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Surprises waiting</p>
            <div className="flex flex-col gap-3">
              {pots.filter((p) => p.mode !== "LIVE_FEED").map((pot, i) => (
                <motion.div
                  key={pot.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 340, damping: 30 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4",
                    pot.mode === "UNDER_THE_TREE"
                      ? "bg-[#1a0f0f] border-red-700/30"
                      : "bg-[#1a1028] border-violet-500/30",
                  )}
                >
                  {/* snowflakes / confetti */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-40">
                    {[20, 45, 70, 85].map((l, j) => (
                      <span key={j} className="absolute text-white/60 text-[10px]"
                        style={{ left: `${l}%`, top: 0, animation: `snow-fall ${2 + j * 0.4}s ${j * 0.3}s ease-in infinite` }}>
                        {pot.mode === "UNDER_THE_TREE" ? "❄️" : "✨"}
                      </span>
                    ))}
                  </div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl">
                      🎁
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white/80">
                        {pot.mode === "UNDER_THE_TREE" ? "🎄 Christmas surprise" : "🎀 Birthday surprise"}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {pot.eventLabel} · {pot.eventDate} · being secretly planned for you…
                      </p>
                    </div>
                    <div className="text-xl">🔒</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Live wish list ── */}
        {livePots.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Your wish list</p>
            <div className="flex flex-col gap-3">
              {livePots.map((pot, i) => {
                const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
                return (
                  <motion.div
                    key={pot.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 340, damping: 30 }}
                    className="overflow-hidden rounded-2xl bg-white"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}
                  >
                    <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
                    <div className="flex items-center gap-3 p-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-amber-50">
                        {pot.image
                          ? <img src={pot.image} alt={pot.title} className="h-full w-full object-cover" />
                          : <span className="flex h-full w-full items-center justify-center text-2xl">{pot.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 style={{ fontFamily: "var(--font-display)" }} className="truncate text-[15px] font-medium text-stone-900">{pot.title}</h3>
                        <div className="mt-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                              className={cn("h-full rounded-full bg-gradient-to-r", pot.accentGradient)}
                            />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <p className="text-[11px] text-stone-400">£{pot.raised} of £{pot.goal}</p>
                            <p className="text-[11px] font-semibold text-amber-500">{pct}% kindled 🔥</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Ordered / claimed gifts ── */}
        {claimedPots.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Sorted ✓</p>
            <div className="flex flex-col gap-2">
              {claimedPots.map((pot) => (
                <div key={pot.id} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <span className="text-xl">{pot.claimedEmoji ?? "✅"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-stone-700 truncate">{pot.title}</p>
                    <p className="text-[11px] text-emerald-600">{pot.claimedBy} — on its way!</p>
                  </div>
                  <span className="text-emerald-500 text-[18px]">✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Kindled Stars CTA ── */}
        <motion.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={onOpenStars}
          className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 p-5 text-left shadow-xl shadow-indigo-900/30"
        >
          <div className="pointer-events-none absolute inset-0">
            {[{l:"12%",t:"18%"},{l:"78%",t:"12%"},{l:"55%",t:"65%"},{l:"88%",t:"55%"},{l:"30%",t:"75%"}].map((p,i)=>(
              <span key={i} className="absolute text-[10px]" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.3}s ${i*0.4}s ease-in-out infinite alternate`,opacity:0.7}}>⭐</span>
            ))}
          </div>
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">🌟</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200 mb-0.5">Kindled Stars</p>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[19px] font-semibold text-white leading-tight">Your star chart</h3>
              <p className="text-[12px] text-violet-200 mt-0.5">24 ⭐ earned · 4 adventures today</p>
            </div>
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-stone-900">Open →</span>
          </div>
        </motion.button>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const [viewMode, setViewMode] = useState<"parent" | "receiver">("parent");
  const [showStars, setShowStars] = useState(false);
  const [showNewGift, setShowNewGift] = useState(false);
  const [pots, setPots] = useState<DemoPot[]>([...INITIAL_POTS, ...CHECKLIST_POTS]);
  const [revealPot, setRevealPot] = useState<DemoPot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const addLog = useCallback((entry: string) => {
    setLogEntries((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText("https://kindledgift.co.uk/list/billys-dreams").catch(() => null);
    showToast("📋 Link copied to share with family!");
    addLog("🔗 Wishlist link shared — referral tracking engaged");
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

  const handleKindle = useCallback((id: string, amount: number) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: Math.min(p.goal, p.raised + amount), contributors: p.contributors + 1 } : p,
    ));
    showToast(`🔥 £${amount} kindled!`);
    addLog(`🔥 Contribution: £${amount} added to pot`);
  }, [showToast, addLog]);

  const handleBuy = useCallback((id: string) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: p.goal, isClaimed: true, claimedBy: "You", claimedEmoji: "✋", claimedNote: "Bought outright — no duplicate risk!" } : p,
    ));
    showToast("🛒 Bought outright — duplicate prevented!");
    addLog("🛒 Outright purchase: item fully claimed");
  }, [showToast, addLog]);

  const handleAddNewGift = useCallback((pot: DemoPot) => {
    setPots((prev) => [pot, ...prev]);
    showToast(`🎁 "${pot.title}" added to the list!`);
    addLog(`✨ New gift created: "${pot.title}" £${pot.goal} — ${pot.mode}`);
  }, [showToast, addLog]);

  const livePots = pots.filter((p) => p.mode === "LIVE_FEED");
  const surprisePots = pots.filter((p) => p.mode !== "LIVE_FEED");

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      {revealPot && <RevealModal pot={revealPot} onClose={() => setRevealPot(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showNewGift && <NewGiftSheet onAdd={handleAddNewGift} onClose={() => setShowNewGift(false)} />}

      {/* ── Kids Space (full-screen overlay) ── */}
      {showStars && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <KindledStars pots={pots} onClose={() => setShowStars(false)} />
        </div>
      )}

      {/* ── Role switcher (always visible) ── */}
      <RoleSwitcher role={viewMode} onChange={setViewMode} />

      {/* ── Receiver view ── */}
      <AnimatePresence mode="wait">
      {viewMode === "receiver" ? (
        <motion.div key="receiver" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <ReceiverView pots={pots} onOpenStars={() => setShowStars(true)} />
        </motion.div>
      ) : (
      <motion.div key="parent" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
      {/* ── Parent Dashboard ── */}
      {<>
      <ProfileHeader
        potCount={pots.length}
        totalGoal={pots.reduce((s, p) => s + p.goal, 0)}
        onShare={handleShare}
      />

      <main className="space-y-7 pb-36 pt-4">
        {/* ── Live Pots ── */}
        <section className="px-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Gift List</p>
            <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-stone-800 leading-tight">{livePots.length} gifts · kindle or buy</p>
          </div>
          <div className="flex flex-col gap-3">
            {livePots.map((pot) => (
              <LivePotCard
                key={pot.id}
                pot={pot}
                {...((pot.id.startsWith("new_") || pot.id.startsWith("p")) && { onRemove: (id: string) => setPots((p) => p.filter((x) => x.id !== id)) })}
                onKindle={handleKindle}
                onBuy={handleBuy}
              />
            ))}
            {/* Add new gift card */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={() => setShowNewGift(true)}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-xl font-bold text-stone-900 shadow">
                +
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-700">New gift</p>
                <p className="text-[12px] text-stone-400">Paste a link or enter manually</p>
              </div>
            </motion.button>
          </div>
        </section>

        {/* ── Surprise Pots ── */}
        {surprisePots.length > 0 && (
          <section className="px-4">
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Surprise Pots</p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-stone-800 leading-tight">{surprisePots.length} locked &amp; waiting</p>
            </div>
            <div className="flex flex-col gap-3">
              {surprisePots.map((pot) => (
                <LockedPotCard key={pot.id} pot={pot} onReveal={setRevealPot} />
              ))}
            </div>
          </section>
        )}

        {/* ── Kindled Stars entry ── */}
        <section className="px-4">
          <motion.button
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => setShowStars(true)}
            className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 p-5 text-left shadow-xl shadow-indigo-900/30"
          >
            {/* Twinkling dots */}
            <div className="pointer-events-none absolute inset-0">
              {[{l:"12%",t:"18%"},{l:"78%",t:"12%"},{l:"55%",t:"65%"},{l:"88%",t:"55%"},{l:"30%",t:"75%"}].map((p,i)=>(
                <span key={i} className="absolute text-[10px]" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.3}s ${i*0.4}s ease-in-out infinite alternate`,opacity:0.7}}>⭐</span>
              ))}
            </div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                🌟
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200 mb-0.5">Kids Rewards</p>
                <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[19px] font-semibold text-white leading-tight">Kindled Stars</h3>
                <p className="text-[12px] text-violet-200 mt-0.5">Billy&apos;s star chart · 4 adventures today</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-stone-900">Open →</span>
                <span className="text-[10px] text-violet-300">24 ⭐ earned</span>
              </div>
            </div>
          </motion.button>
        </section>

        {/* ── Catalogue ── */}
        <CatalogueGrid onAdd={handleAddItem} />

        {/* ── Explainer ── */}
        <ExplainerPlayer />

        {/* ── Bottom CTA ── */}
        <div className="mx-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            onClick={() => setRevealPot(surprisePots[0] ?? pots[0]!)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 shadow-xl shadow-amber-200"
            style={{ boxShadow: "0 4px 24px rgba(251,146,60,0.45), 0 0 0 1px rgba(251,146,60,0.2)" }}
          >
            <Zap className="h-5 w-5 text-stone-900" strokeWidth={2.5} />
            <span style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-semibold text-stone-900">Launch Reveal Ceremony</span>
          </motion.button>
          <p className="mt-2.5 text-center text-[10px] text-stone-400 tracking-wide">
            Cinematic full-screen reveal · touch-optimised · no database required
          </p>
        </div>
      </main>

      <InvestorHUD pots={pots} logEntries={logEntries} />
      </>}
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
