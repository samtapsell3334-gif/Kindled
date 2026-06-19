"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Check, Lock, Plus, Users, ChevronUp, ChevronDown,
  Play, Pause, SkipForward, Volume2, VolumeX, X, Zap,
  ShoppingBag, RefreshCw, CreditCard, Gift, Flame,
  Package, Leaf, ShieldCheck, Sparkles, Star, Link2,
  Landmark, Radio, Wrench, Trophy, Wallet, Eye,
  Bike, Plane, Home, Cake, TreePine, GraduationCap, Armchair, PenLine,
  Trash2, AlertCircle, Copy, TrendingUp, Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FundingBar } from "@/components/pots/FundingBar";
import { CountdownTimer } from "@/components/pots/CountdownTimer";
import { cn } from "@/lib/utils";
import type { GiftingMode } from "@/types/pots";
import { GiftingImpactPanel } from "@/components/GiftingImpactPanel";
import { FirstKindlersCTA } from "@/components/FirstKindlersCTA";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryCard {
  id: string;
  name: string;
  message: string;
  rot: number;
  delay: number;
  hasVideo?: boolean;
}

interface DemoPot {
  id: string;
  title: string;
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
  claimedNote?: string;
  /** Secondary "stack to the next event" line shown beneath covered pots. */
  stackNote?: string;
}


interface CatalogItem {
  id: string;
  name: string;
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
    id: "p1", title: "Super-Fast Mountain Bike",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80",
    goal: 450, raised: 310, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 7, boosterEntries: 0,
    accentGradient: "from-emerald-500 via-teal-400 to-cyan-400",
    tributes: [],
    stackNote: "Next up: Birthday 2027 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p2", title: "LEGO Star Wars Millennium Falcon",
    image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?w=400&h=400&fit=crop&q=80",
    goal: 730, raised: 730, mode: "UNDER_THE_TREE", continuous: true,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 9, boosterEntries: 8,
    accentGradient: "from-red-700 via-amber-500 to-red-600",
    tributes: [
      { id: "t1", name: "Grandma Jean", rot: -4, delay: 0,
        message: "Happy Christmas sweetheart! We knew you wanted this forever. Build it with love!", hasVideo: true },
      { id: "t2", name: "Uncle Pete", rot: 3, delay: 120,
        message: "7541 pieces... good luck! Happy Christmas mate, enjoy every single one!" },
      { id: "t3", name: "Dad", rot: -2, delay: 240,
        message: "Merry Christmas! Build it before New Year's — I'll time you!", hasVideo: true },
      { id: "t4", name: "The School Crew", rot: 2, delay: 360,
        message: "Happy Christmas from all of us! Can't wait to see it finished!" },
    ],
    stackNote: "Next up: 11th Birthday in 2027 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p3", title: "Retro Arcade Cabinet",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80",
    goal: 250, raised: 80, mode: "LIVE_FEED", continuous: true,
    eventLabel: "Ongoing", eventDate: "Anytime", eventIso: "2027-01-01T00:00:00Z",
    contributors: 3, boosterEntries: 0,
    accentGradient: "from-fuchsia-500 via-purple-400 to-indigo-500",
    tributes: [],
    stackNote: "Next up: Christmas 2026 — stack balance to unlock an even larger milestone",
  },
  {
    id: "p4", title: "Cosy Log Burner",
    image: "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?w=400&h=400&fit=crop&q=80",
    goal: 800, raised: 425, mode: "WRAPPED_UP", continuous: false,
    eventLabel: "Birthday", eventDate: "Jun 28", eventIso: "2026-06-28T10:00:00Z",
    contributors: 5, boosterEntries: 3,
    accentGradient: "from-violet-500 via-fuchsia-400 to-pink-500",
    tributes: [
      { id: "b1", name: "The Kids", rot: -3, delay: 0,
        message: "Mum, you are always cold — this one's for you! Cosy nights ahead.", hasVideo: true },
      { id: "b2", name: "Auntie Claire", rot: 4, delay: 140,
        message: "You've wanted one of these for years! Enjoy every warm evening." },
      { id: "b3", name: "Work Crew", rot: -1, delay: 260,
        message: "From all of us — you deserve every cosy moment!", hasVideo: true },
    ],
    stackNote: "Next up: Christmas 2026 — stack balance to unlock an even larger milestone",
  },
];

const CHECKLIST_POTS: DemoPot[] = [
  {
    id: "cl1", title: "LEGO Space Shuttle Explorer",
    goal: 25, raised: 25, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-emerald-400 to-teal-500",
    tributes: [],
    tag: "Grandma Linda",
    isClaimed: true, claimedBy: "Grandma Linda",
    claimedNote: "Shipped directly from Amazon · Arrives Dec 23",
  },
  {
    id: "cl2", title: "Adventure Book Series (x3)",
    goal: 15, raised: 15, mode: "LIVE_FEED", continuous: false,
    eventLabel: "Christmas", eventDate: "Dec 25", eventIso: "2026-12-25T08:00:00Z",
    contributors: 1, boosterEntries: 0,
    accentGradient: "from-sky-400 to-blue-500",
    tributes: [],
    tag: "Uncle Steve",
    isClaimed: true, claimedBy: "Uncle Steve",
    claimedNote: "Bringing to the party in person",
  },
  {
    id: "cl3", title: "Marvel Action Figure Set",
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
  { id: "c1", name: "Nintendo Switch OLED",
    image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop&q=80",
    price: 309.99, tag: "Popular", tagColor: "bg-red-100 text-red-600", glowColor: "#ef4444" },
  { id: "c2", name: "Electric Scooter Pro",
    image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=400&h=400&fit=crop&q=80",
    price: 399.99, tag: "Trending", tagColor: "bg-emerald-100 text-emerald-600", glowColor: "#10b981" },
  { id: "c3", name: "Meta Quest 3 VR",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=400&fit=crop&q=80",
    price: 499.99, tag: "High Intent", tagColor: "bg-violet-100 text-violet-600", glowColor: "#8b5cf6" },
  { id: "c4", name: "LEGO Technic Ferrari",
    image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=400&fit=crop&q=80",
    price: 189.99, tag: "Bestseller", tagColor: "bg-amber-100 text-amber-600", glowColor: "#f59e0b" },
  { id: "c5", name: "Air Hockey Table",
    image: "https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?w=400&h=400&fit=crop&q=80",
    price: 199.99, tag: "New", tagColor: "bg-pink-100 text-pink-600", glowColor: "#ec4899" },
  { id: "c6", name: "LEGO Star Wars X-Wing",
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

// Ascending light-leak bubbles — birthday seasonal backdrop
const BUBBLES_P = Array.from({ length: 12 }, (_, i) => ({
  id: i, left: `${4 + (i * 211) % 92}%`,
  dur: `${2.6 + (i * 0.27) % 2.2}s`, delay: `${(i * 0.31) % 2.6}s`,
  size: 6 + (i % 5) * 2,
  color: ["#f0abfc","#a78bfa","#fbbf24","#f9a8d4","#818cf8"][i % 5]!,
}));

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

// Reveal ceremony — slow-rising golden embers (background layer)
const EMBERS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${2 + (i * 421) % 96}%`,
  size: 3 + (i % 4),
  emberX: `${-20 + (i * 17) % 40}px`,
  emberY: `${-180 - (i * 23) % 140}px`,
  dur: `${2.8 + (i * 0.21) % 2.4}s`,
  delay: `${(i * 0.17) % 2.2}s`,
  color: ["#fbbf24", "#f59e0b", "#fde68a", "#fb923c"][i % 4]!,
}));

// Reveal ceremony — organic light-leak streaks
const LIGHT_LEAKS = [
  { color: "rgba(251,191,36,0.5)", size: 520, dur: "3.4s", delay: "0s", peak: 0.5 },
  { color: "rgba(249,115,22,0.4)", size: 420, dur: "4.1s", delay: "0.5s", peak: 0.4 },
  { color: "rgba(236,72,153,0.3)", size: 360, dur: "3.8s", delay: "1.1s", peak: 0.35 },
];

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

  // One plucked "harp string" — quick attack, long shimmering decay, two
  // slightly-detuned oscillators for a richer, more organic pluck.
  const pluck = useCallback((c: AudioContext, freq: number, t: number, gain: number, dur: number) => {
    const g = c.createGain();
    g.connect(c.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    [1, 1.0035, 2.005].forEach((mult, i) => {
      const o = c.createOscillator();
      const og = c.createGain();
      o.type = i === 2 ? "sine" : "triangle";
      o.frequency.value = freq * mult;
      og.gain.value = i === 2 ? 0.18 : 0.5;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur);
    });
  }, []);

  // Ascending harp-like glissando — a fast run up a pentatonic scale across
  // two octaves, ending in a sustained, shimmering high chord.
  const chime = useCallback(() => {
    try {
      const c = get();
      const base = c.currentTime + 0.02;
      // C major pentatonic across two octaves, run upward.
      const run = [523.25, 587.33, 659.25, 784.0, 880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0];
      run.forEach((f, i) => {
        pluck(c, f, base + i * 0.052, 0.16, 1.1);
      });
      // Sustained shimmering chord on top, slightly after the run lands.
      const chordAt = base + run.length * 0.052 + 0.04;
      [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, i) => {
        pluck(c, f, chordAt + i * 0.03, 0.13, 2.2);
      });
    } catch { /* silent */ }
  }, [get, pluck]);

  // A single bright, randomised sparkle blip — for layering over visual
  // spark bursts so the fireworks feel reactive rather than scripted.
  const sparkleBlip = useCallback((t = 0) => {
    try {
      const c = get();
      const freq = 1800 + Math.random() * 1400;
      pluck(c, freq, c.currentTime + t, 0.05, 0.35);
    } catch { /* silent */ }
  }, [get, pluck]);

  // ── Brazilian samba fanfare ─────────────────────────────────────────────────
  // Punchy brass stabs + driving samba percussion. Fires on reveal ceremony.
  // Synthesised entirely in Web Audio: no network requests, no external files.
  const sambaFanfare = useCallback(() => {
    try {
      const c = get();
      const now = c.currentTime + 0.05;
      const BPM = 128;
      const beat = 60 / BPM;        // 0.469 s
      const bar  = beat * 4;        // 1.875 s

      // Master limiter — prevents clipping when all layers stack.
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 6;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.08;
      limiter.connect(c.destination);

      // ── Brass stab: sawtooth + bandpass, punchy staccato envelope ──────────
      const brassStab = (t: number, freq: number, gain = 0.38) => {
        const mg = c.createGain();
        mg.gain.setValueAtTime(0, t);
        mg.gain.linearRampToValueAtTime(gain, t + 0.012);
        mg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        mg.connect(limiter);

        const osc = c.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = freq;

        const bpf = c.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 1100;
        bpf.Q.value = 1.8;

        // Slight pitch-bend on attack for natural brass articulation
        osc.frequency.setValueAtTime(freq * 1.03, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

        osc.connect(bpf); bpf.connect(mg);
        osc.start(t); osc.stop(t + 0.28);
      };

      // ── Chord voicings ──────────────────────────────────────────────────────
      // Bb major (I): Bb3, Eb4, G4, Bb4
      const Bb = [233.08, 311.13, 392.0, 466.16];
      // F dominant (V): F4, A4, C5, Eb5
      const Fdom = [349.23, 440.0, 523.25, 622.25];
      // Bb upper (climax): Bb4, Eb5, G5, Bb5
      const BbHi = [466.16, 622.25, 783.99, 932.33];

      const stab = (t: number, chord: number[], gain = 0.38) =>
        chord.forEach((f, i) => brassStab(t + i * 0.007, f, gain));

      // ── Surdo bass drum: pitched sine sweep 90→35 Hz ───────────────────────
      const surdo = (t: number, gain = 0.65) => {
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        g.connect(limiter);
        const o = c.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(32, t + 0.28);
        o.connect(g); o.start(t); o.stop(t + 0.4);
      };

      // ── Tamborim: filtered noise burst, very short (samba snare-rim) ───────
      const tamborim = (t: number, gain = 0.18) => {
        const len = Math.ceil(c.sampleRate * 0.055);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const bpf = c.createBiquadFilter();
        bpf.type = "bandpass"; bpf.frequency.value = 3800; bpf.Q.value = 4;
        const hpf = c.createBiquadFilter();
        hpf.type = "highpass"; hpf.frequency.value = 2200;
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
        src.connect(bpf); bpf.connect(hpf); hpf.connect(g); g.connect(limiter);
        src.start(t);
      };

      // ── Agogô bell: two-tone metallic cowbell (sine cluster) ───────────────
      const agogo = (t: number, hi: boolean, gain = 0.14) => {
        const freqs = hi ? [1250, 1875, 2500] : [940, 1410, 1880];
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        g.connect(limiter);
        freqs.forEach((f, i) => {
          const o = c.createOscillator();
          const og = c.createGain();
          o.type = "sine"; o.frequency.value = f;
          og.gain.value = [0.55, 0.3, 0.15][i]!;
          o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.5);
        });
      };

      // ── Shaker: hi-freq noise sixteenths ───────────────────────────────────
      const shaker = (t: number, gain = 0.08) => {
        const len = Math.ceil(c.sampleRate * 0.03);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const hpf = c.createBiquadFilter();
        hpf.type = "highpass"; hpf.frequency.value = 7000;
        const g = c.createGain();
        g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.connect(hpf); hpf.connect(g); g.connect(limiter);
        src.start(t);
      };

      // ════════════════════════════════════════════════════════════════════════
      // ARRANGEMENT  (≈ 24 s, 128 BPM)
      // ════════════════════════════════════════════════════════════════════════

      // ── INTRO (bars 1-2): Brass fanfare hits + light percussion ─────────────
      stab(now, Bb, 0.35);
      surdo(now);
      agogo(now + beat * 0.5, true);
      agogo(now + beat * 1.5, false);
      stab(now + beat * 2, Fdom, 0.32);
      surdo(now + beat * 2);
      agogo(now + beat * 2.5, true);
      agogo(now + beat * 3.5, false);
      // Bar 2 tamborim starts
      for (let i = 0; i < 8; i++) tamborim(now + bar + i * beat * 0.5, 0.15);
      stab(now + bar, Bb, 0.36);
      surdo(now + bar);
      stab(now + bar + beat * 2, Fdom, 0.33);
      surdo(now + bar + beat * 2);

      // ── BUILD (bars 3-4): Staccato brass every beat + denser perc ───────────
      for (let b = 2; b < 4; b++) {
        for (let q = 0; q < 4; q++) {
          const t = now + bar * b + beat * q;
          stab(t, q % 2 === 0 ? Bb : Fdom, 0.34 + q * 0.01);
          surdo(t);
          agogo(t + beat * 0.25, q % 2 === 0);
        }
        // Full 16th tamborim + shaker
        for (let i = 0; i < 16; i++) {
          tamborim(now + bar * b + i * beat * 0.25, 0.17);
          shaker(now + bar * b + i * beat * 0.25, 0.09);
        }
      }

      // ── TENSION RISE (bars 4-5): Fast repeated hits, chromatic ascent ───────
      const riseChords = [Fdom, Bb, Fdom, BbHi];
      for (let i = 0; i < 8; i++) {
        const t = now + bar * 4 + i * beat * 0.5;
        stab(t, riseChords[Math.floor(i / 2)]!, 0.38 + i * 0.012);
        surdo(t);
        tamborim(t + beat * 0.125, 0.2);
        agogo(t + beat * 0.25, i % 2 === 0, 0.16);
      }

      // ── CLIMAX EXPLOSION (bars 5-8): Full brass + percussion storm ──────────
      const climax = now + bar * 5;

      // Giant downbeat chord — both octave layers simultaneously
      BbHi.forEach((f, i) => brassStab(climax + i * 0.005, f, 0.55));
      Bb.forEach((f, i)   => brassStab(climax + i * 0.005, f, 0.48));
      surdo(climax, 0.8);

      // Every beat of the climax: alternating Bb/F brass + surdo pair
      for (let b = 0; b < 12; b++) {
        const t = climax + b * beat;
        const chord = b % 2 === 0 ? BbHi : Fdom;
        stab(t, chord, 0.45 + Math.min(b, 4) * 0.01);
        surdo(t, 0.72);
        surdo(t + beat * 0.5, 0.45);            // off-beat surdo for carnival pulse
        agogo(t + beat * 0.25, b % 2 === 1, 0.18);
        agogo(t + beat * 0.75, b % 2 === 0, 0.16);
      }

      // Continuous 16th tamborim + shaker storm through climax
      for (let i = 0; i < 48; i++) {
        tamborim(climax + i * beat * 0.25, 0.2);
        shaker(climax + i * beat * 0.25, 0.1);
      }

      // ── FINAL BURST (last downbeat): massive chord + percussion hits ─────────
      const finale = climax + beat * 12;
      BbHi.forEach((f, i) => brassStab(finale + i * 0.004, f, 0.62));
      Bb.forEach((f, i)   => brassStab(finale + i * 0.004, f, 0.56));
      [0, beat * 0.25, beat * 0.5, beat * 0.75].forEach((d) => {
        surdo(finale + d, 0.8);
        tamborim(finale + d + beat * 0.125, 0.24);
      });
      agogo(finale, true, 0.22); agogo(finale + beat * 0.5, false, 0.2);

    } catch { /* silent */ }
  }, [get]);

  return { thump, chime, sparkleBlip, sambaFanfare };
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

function ProfileHeader({ potCount, totalGoal, onShare, isContributor }: {
  potCount: number; totalGoal: number; onShare: () => void; isContributor?: boolean;
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
                {isContributor
                  ? <>Contributing to <span className="font-semibold text-amber-500">Billy&apos;s List</span></>
                  : <>Managed by <span className="font-semibold text-amber-500">Mum (Sarah)</span></>}
              </p>
            </div>
          </div>
          {isContributor && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={onShare}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3.5 py-2 text-[12px] font-semibold text-white shadow-md shadow-violet-200 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Make a list
            </motion.button>
          )}
        </div>
        {isContributor && (
          <p className="mt-1.5 text-right text-[10px] text-stone-400 pr-0.5">start your own dream board for someone you love</p>
        )}

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
// SEASONAL OCCASION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

type Occasion = "christmas" | "birthday";

/** Whichever major occasion lands soonest from today — used for pots without a fixed date. */
function nextMajorOccasion(): Occasion {
  const now = new Date();
  const year = now.getFullYear();
  let xmas = new Date(year, 11, 25);
  if (xmas.getTime() < now.getTime()) xmas = new Date(year + 1, 11, 25);
  let bday = new Date(year, 5, 28);
  if (bday.getTime() < now.getTime()) bday = new Date(year + 1, 5, 28);
  return xmas.getTime() <= bday.getTime() ? "christmas" : "birthday";
}

function occasionFor(pot: DemoPot): Occasion {
  const label = pot.eventLabel.toLowerCase();
  if (label.includes("christmas")) return "christmas";
  if (label.includes("birthday")) return "birthday";
  return nextMajorOccasion();
}

/** Real countdown target for pots whose own eventIso is just a placeholder ("Ongoing"). */
function occasionTargetIso(pot: DemoPot): string {
  if (pot.eventLabel !== "Ongoing") return pot.eventIso;
  const occasion = occasionFor(pot);
  const now = new Date();
  const year = now.getFullYear();
  if (occasion === "christmas") {
    let d = new Date(year, 11, 25);
    if (d.getTime() < now.getTime()) d = new Date(year + 1, 11, 25);
    return d.toISOString();
  }
  let d = new Date(year, 5, 28);
  if (d.getTime() < now.getTime()) d = new Date(year + 1, 5, 28);
  return d.toISOString();
}

function occasionLabel(occasion: Occasion): string {
  return occasion === "christmas" ? "Christmas" : "Birthday";
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE POT CARD
// ═══════════════════════════════════════════════════════════════════════════════

const KINDLE_AMOUNTS = [5, 10, 25, 50];

function LivePotCard({ pot, onRemove, onKindle, onBuy, onAmountSelected }: {
  pot: DemoPot;
  onRemove?: (id: string) => void;
  onKindle?: (id: string, amount: number) => void;
  onBuy?: (id: string) => void;
  onAmountSelected?: (pot: DemoPot, amount: number) => void;
}) {
  const [kindleOpen, setKindleOpen] = useState(false);
  const [kindled, setKindled] = useState(false);
  const pct = Math.min(100, Math.round((pot.raised / pot.goal) * 100));
  const statusLabel =
    pot.isClaimed    ? "Ordered" :
    pct >= 100 ? "Fully Lit" :
    pct >= 75  ? "Blazing" :
    pct >= 50  ? "Campfire" :
    pct >= 25  ? "Kindling" :
    pct > 0    ? "Embers" :
                 "Spark";
  const statusColor =
    pot.isClaimed    ? "text-emerald-500" :
    pct >= 100 ? "text-emerald-500" :
    pct >= 75  ? "text-orange-500" :
    pct >= 50  ? "text-amber-500" :
    pct >= 25  ? "text-amber-400" :
                 "text-orange-400";

  function handleKindle(amount: number) {
    if (onAmountSelected) {
      setKindleOpen(false);
      onAmountSelected(pot, amount);
      return;
    }
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
                <div className="flex h-full w-full items-center justify-center">
                  <Gift className="h-5 w-5 text-stone-400" strokeWidth={1.5} />
                </div>
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
            <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-emerald-700">{pot.claimedBy} — ordered</p>
              {pot.claimedNote && <p className="text-[11px] text-emerald-600/80 truncate">{pot.claimedNote}</p>}
            </div>
          </div>
        )}

        {/* Progress — Under Wraps: heat-themed, totals hidden */}
        {!pot.isClaimed && (
          <>
            <FundingBar raised={pot.raised} goal={pot.goal} className="mt-4" />
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-stone-400"><Users className="h-3 w-3" />{pot.contributors} contributors</span>
              <CountdownTimer targetIso={pot.eventIso} compact />
            </div>
            {pot.stackNote && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-2.5 py-1.5">
                <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <p className="text-[10px] leading-snug text-amber-700">{pot.stackNote}</p>
              </div>
            )}

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
                {kindled
                  ? <Check className="h-4 w-4" />
                  : <Flame className="h-4 w-4" />}
                {kindled ? "Kindled!" : "Kindle"}
              </motion.button>
              {pot.goal <= 60 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onBuy?.(pot.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-stone-200 bg-white py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:border-stone-300"
                >
                  <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2} />
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
  const occasion = occasionFor(pot);
  const isXmas = occasion === "christmas";
  const targetIso = occasionTargetIso(pot);

  // Days until occasion
  const daysUntil = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 86_400_000));

  const th = isXmas
    ? { bg: "bg-[#1a0f0f]", border: "border-red-700/30", glow: "animate-gift-glow",
        box: "from-red-800/30 to-amber-700/20", label: "text-amber-400",
        modeLabel: "Under the Tree", btn: "from-amber-400 to-orange-500 shadow-amber-900/40" }
    : { bg: "bg-[#1a1028]", border: "border-violet-500/30", glow: "animate-gift-glow-plum",
        box: "from-violet-600/25 to-fuchsia-700/20", label: "text-violet-400",
        modeLabel: "Wrapped Up", btn: "from-violet-500 to-fuchsia-500 shadow-violet-900/40" };

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border shadow-lg shadow-black/50", th.bg, th.border)}>
      {/* Seasonal particle backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {isXmas
          ? SNOW.map((s) => (
              <span key={s.id} className="animate-snow absolute rounded-full bg-white/80"
                style={{ left: s.left, top: 0, width: s.size, height: s.size,
                  "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
            ))
          : (
            <>
              {CONFETTI_P.map((c) => (
                <span key={c.id} className={cn("animate-confetti absolute rounded-sm", c.color)}
                  style={{ left: c.left, top: 0, width: c.w, height: c.h,
                    "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
              ))}
              {BUBBLES_P.map((b) => (
                <span key={b.id} className="animate-bubble-rise absolute bottom-0 rounded-full opacity-70"
                  style={{ left: b.left, width: b.size, height: b.size, backgroundColor: b.color,
                    "--dur": b.dur, animationDelay: b.delay,
                    boxShadow: `0 0 8px ${b.color}80` } as React.CSSProperties} />
              ))}
            </>
          )}
      </div>
      <div className={cn("h-[3px] w-full bg-gradient-to-r", pot.accentGradient)} />
      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/30">
              {pot.image
                ? <img src={pot.image} alt={pot.title} className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                : <div className="flex h-full w-full items-center justify-center"><Gift className="h-5 w-5 text-stone-500" strokeWidth={1.5} /></div>}
              <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl-lg bg-black/60"><Lock className="h-2.5 w-2.5 text-white/60" /></span>
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold text-white">{pot.title}</h3>
              <p className={cn("text-[11px] font-medium", th.label)}>{th.modeLabel} · hidden</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-black/20 px-2.5 py-1.5 text-right">
            <p className="text-[9px] uppercase tracking-wider text-stone-500">{pot.eventLabel}</p>
            <p className="text-[12px] font-bold text-stone-200">{pot.eventDate}</p>
          </div>
        </div>
        <div className={cn(th.glow, "mt-4 flex flex-col items-center gap-3 rounded-2xl py-6 border border-white/5 bg-gradient-to-b", th.box)}>
          {/* Occasion countdown headline */}
          <p className={cn("text-[13px] font-bold", isXmas ? "text-amber-300" : "text-violet-300")}>
            {occasionLabel(occasion)} in {daysUntil} {daysUntil === 1 ? "day" : "days"}
          </p>
          <Gift className={cn("h-14 w-14", isXmas ? "text-amber-400" : "text-violet-300")} strokeWidth={1.2} />
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-stone-400" />
            <p className="text-[12px] font-semibold text-stone-200">Locked · Unwraps {pot.eventDate}</p>
          </div>
          <CountdownTimer targetIso={targetIso} eventLabel={pot.eventLabel} />
          <button
            onClick={() => onReveal(pot)}
            className={cn(
              "mt-1 flex items-center gap-1.5 rounded-full px-5 py-2.5",
              "bg-gradient-to-r text-[12px] font-bold text-stone-900 shadow-lg active:scale-95 transition-transform",
              th.btn,
            )}
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            Open my gift
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-stone-500">
          <Users className="h-3 w-3" />
          <span className="text-[11px]">Balance hidden · {pot.contributors} contributors</span>
        </div>
        <FundingBar raised={pot.raised} goal={pot.goal} hideAmounts className="mt-2" />
        {pot.stackNote && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-violet-300" />
            <p className="text-[10px] leading-snug text-stone-400">{pot.stackNote}</p>
          </div>
        )}
      </div>
    </article>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTRIBUTION PROMPT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ContributionPromptModal({
  pot,
  amount,
  onConfirm,
  onClose,
}: {
  pot: DemoPot;
  amount: number;
  onConfirm: (id: string, amount: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"card" | "video">("card");
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function finalize() {
    setSubmitted(true);
    onConfirm(pot.id, amount);
    setTimeout(onClose, 1200);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="contrib-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="contrib-sheet"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
          className="w-full max-w-lg overflow-hidden rounded-t-3xl"
          style={{ background: "linear-gradient(160deg, #1c1917 0%, #171310 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="mb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
                Chipping in £{amount} to {pot.title}
              </p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold text-white leading-tight">
                Add a personal touch?
              </p>
              <p className="mt-1 text-[12px] text-stone-400">
                Make Billy&apos;s reveal morning even more magical
              </p>
            </div>

            {/* Option tabs */}
            <div className="mb-4 flex gap-2 rounded-2xl bg-white/5 p-1">
              <button
                onClick={() => setTab("card")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
                  tab === "card"
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900 shadow-md"
                    : "text-stone-400",
                )}
              >
                <PenLine className="h-4 w-4" />
                Digital Card
              </button>
              <button
                onClick={() => setTab("video")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
                  tab === "video"
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                    : "text-stone-400",
                )}
              >
                <Radio className="h-4 w-4" />
                Video Wish
              </button>
            </div>

            {/* Option A — Digital Card */}
            {tab === "card" && (
              <motion.div
                key="card-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                <div
                  className="relative rounded-2xl border-2 transition-all"
                  style={{ borderColor: message.length > 0 ? "#f59e0b" : "rgba(255,255,255,0.1)",
                    boxShadow: message.length > 0 ? "0 0 0 3px rgba(245,158,11,0.15), 0 0 20px rgba(245,158,11,0.12)" : "none" }}
                >
                  <div className="absolute left-3 top-2.5 flex items-center gap-1.5 text-amber-400">
                    <PenLine className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Your message</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a beautiful note to float onto Billy's screen on his big reveal morning…"
                    rows={4}
                    className="w-full resize-none rounded-2xl bg-transparent px-3 pb-3 pt-8 text-[13px] leading-relaxed text-stone-200 placeholder:text-stone-600 focus:outline-none"
                  />
                </div>
                <p className="text-center text-[11px] text-stone-500">
                  &ldquo;Stoke the Fire with a Digital Card&rdquo; — your words will float onto Billy&apos;s screen at the moment of reveal.
                </p>
              </motion.div>
            )}

            {/* Option B — Video Wish */}
            {tab === "video" && (
              <motion.div
                key="video-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Pulsating record button */}
                <div className="relative flex items-center justify-center py-4">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="absolute rounded-full bg-rose-500/20"
                      style={{ width: 60 + i * 28, height: 60 + i * 28,
                        animation: `ping ${1 + i * 0.35}s ${i * 0.2}s ease-out infinite` }}
                    />
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setRecording((r) => !r)}
                    className={cn(
                      "relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all",
                      recording
                        ? "bg-rose-600 shadow-lg shadow-rose-900/60"
                        : "bg-gradient-to-br from-rose-500 to-pink-600 shadow-xl shadow-rose-900/50",
                    )}
                  >
                    {recording
                      ? <span className="h-5 w-5 rounded bg-white" />
                      : <Radio className="h-7 w-7 text-white" strokeWidth={2} />}
                  </motion.button>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-stone-200">
                    {recording ? "Recording… tap to stop" : "Press to record"}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500">
                    &ldquo;Spark a Smile with a Video Wish&rdquo; — a heartfelt 15-second clip woven into Billy&apos;s cinematic unboxing celebration!
                  </p>
                </div>
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-700 bg-white/5 py-2.5 text-[12px] font-medium text-stone-400 hover:border-stone-500 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  Or upload a video instead
                  <input type="file" accept="video/*" className="sr-only" />
                </label>
              </motion.div>
            )}

            {/* CTAs */}
            <div className="mt-5 flex flex-col gap-2">
              {submitted ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4">
                  <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
                  <span className="text-[15px] font-semibold text-white">Contribution sent!</span>
                </div>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={finalize}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold text-stone-900"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f97316)", boxShadow: "0 4px 20px rgba(251,146,60,0.4)" }}
                  >
                    <Flame className="h-5 w-5" />
                    Send £{amount} {tab === "card" && message.trim() ? "+ Digital Card" : tab === "video" ? "+ Video Wish" : ""}
                  </motion.button>
                  <button
                    onClick={finalize}
                    className="text-center text-[12px] text-stone-500 hover:text-stone-300 transition-colors py-1"
                  >
                    Skip — just contribute £{amount}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
      {/* Marker-pen overlay — imperfect, hand-drawn felt-tip loop around the card boundary */}
      {circling && (
        <div className="pointer-events-none absolute z-20" style={{ inset: "-6px" }}>
          <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
            <path
              d="M 6 3 C 30 0, 55 4, 80 1 C 92 0, 99 8, 97 22 C 100 45, 96 60, 99 78 C 100 92, 88 100, 70 98 C 48 101, 28 96, 12 99 C -1 101, -2 88, 1 70 C -3 50, 2 32, -1 18 C -3 6, 1 1, 6 3 Z"
              stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="440" vectorEffect="non-scaling-stroke"
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
        {/* Category badge bottom-left */}
        <div className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 shadow-md backdrop-blur-sm">
          <Gift className="h-4 w-4 text-stone-500" strokeWidth={1.5} />
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
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <section className="px-4">
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={() => setActive(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <ShoppingBag className="h-5 w-5 text-stone-900" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-800">Catalogue Circling Mode</p>
            <p className="text-[11px] text-stone-400">Circle any item with a marker pen to add it</p>
          </div>
        </motion.button>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Catalogue Circling Mode</p>
          <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-stone-800 leading-tight">Browse &amp; add to your list</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Tap any card — watch the marker pen circle it</p>
        </div>
        <button onClick={() => setActive(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200">
          <X className="h-3.5 w-3.5" />
        </button>
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-300">
          {card.name.charAt(0)}
        </div>
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
  const { thump, chime, sparkleBlip, sambaFanfare } = useAudio();
  const rafRef = useRef<number | null>(null);

  const startReveal = useCallback(() => {
    setPhase("shaking");
    // Rhythmic thumps during shake — speeds up into a crescendo
    [0, 160, 300, 420, 520, 600, 670, 730, 780].forEach((t) => setTimeout(() => thump(0), t));
    setTimeout(() => {
      setPhase("flashing");
      setTimeout(() => {
        setPhase("fireworks");
        chime();
        sambaFanfare();
        // Bright sparkle blips layered over each visual firework burst
        FW_BURSTS.forEach((_, bi) => {
          [0, 90, 180].forEach((d) => setTimeout(() => sparkleBlip(0), bi * 120 + d));
        });
        setTimeout(() => setPhase("mosaic"), 2400);
      }, 450);
    }, 1050);
  }, [thump, chime, sparkleBlip, sambaFanfare]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const isXmas = pot.mode === "UNDER_THE_TREE";

  const defaultTributes = [
    { id: "g1", name: "The Whole Family", message: "We all chipped in with so much love. Enjoy every single moment!", rot: -1, delay: 0 },
    { id: "g2", name: "Gran & Grandad", message: "So proud of you. You deserve this and so much more.", rot: 2, delay: 150 },
    { id: "g3", name: "Your Best Friends", message: "Couldn't be happier for you — enjoy every second!", rot: -1, delay: 300 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-xl p-4">
      {/* Flash overlay */}
      {phase === "flashing" && (
        <div className="pointer-events-none absolute inset-0 bg-white animate-flash z-10" />
      )}

      {/* Fireworks + light-leak + ember layers */}
      {(phase === "fireworks" || phase === "mosaic" || phase === "actions") && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Organic light-leak streaks — soft, hardware-accelerated blurred blobs sweeping across the screen */}
          {LIGHT_LEAKS.map((l, i) => (
            <div
              key={i}
              className="absolute animate-light-leak rounded-full mix-blend-screen blur-3xl"
              style={{
                left: `${20 + i * 25}%`, top: `${10 + i * 18}%`,
                width: l.size, height: l.size, background: l.color,
                "--leak-dur": l.dur, "--leak-peak": l.peak, animationDelay: l.delay,
              } as React.CSSProperties}
            />
          ))}

          {/* Slow-rising golden embers */}
          {EMBERS.map((e) => (
            <span
              key={e.id}
              className="absolute bottom-0 animate-ember-rise rounded-full"
              style={{
                left: e.left, width: e.size, height: e.size, backgroundColor: e.color,
                boxShadow: `0 0 6px ${e.color}`,
                "--ember-x": e.emberX, "--ember-y": e.emberY,
                "--ember-dur": e.dur, animationDelay: e.delay,
              } as React.CSSProperties}
            />
          ))}

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
              {/* Warm chime-pulse wash, syncs roughly with the glissando landing */}
              <div className="absolute inset-0 h-screen w-screen -translate-x-1/2 -translate-y-1/2 animate-chime-pulse rounded-full"
                style={{ background: "radial-gradient(circle, rgba(251,191,36,0.5), transparent 70%)", width: "140vmax", height: "140vmax", "--pulse-peak": 0.4 } as React.CSSProperties} />
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-1.5">A gift awaits</p>
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
                <Gift className={cn("h-16 w-16", isXmas ? "text-amber-400" : "text-violet-300")} strokeWidth={1.2} />
              </div>
            </div>
            {/* Contributors */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {["#f59e0b","#a78bfa","#6ee7b7","#fb923c"].slice(0, Math.min(4, pot.contributors)).map((color, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-stone-900 text-[11px] font-bold text-stone-900" style={{ background: color }}>{["M","F","G","S"][i]}</div>
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
              <Gift className={cn("h-16 w-16", isXmas ? "text-amber-400" : "text-violet-300")} strokeWidth={1.2} />
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
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400"><Sparkles className="h-3 w-3" /> Fully Funded!</p>
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
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-emerald-400 font-medium">
                <Users className="h-3 w-3" /> {pot.contributors} people made this happen
              </p>
            </div>
          </div>
        )}

        {/* ── MOSAIC ── */}
        {phase === "mosaic" && (
          <div className="flex flex-col gap-4 px-4 py-6 max-h-[72vh] overflow-y-auto">
            <div className="text-center">
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-white">Messages from the family</p>
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
    const dupes = [Package, Package, Package, Gift, Package, Gift, Package, Package];
    const dreams = [
      { Icon: Bike, label: "Mountain Bike", val: "£450" },
      { Icon: Flame, label: "Cosy Log Burner", val: "£600" },
      { Icon: Plane, label: "Dream Holiday", val: "£1,200" },
      { Icon: Home, label: "House Deposit", val: "£5,000" },
    ];
    return (
      <div className="relative flex h-full w-full overflow-hidden">
        {/* Left: junk pile */}
        <div className="flex w-[44%] flex-col items-center justify-center gap-2 bg-red-950/40 px-2 py-3 border-r border-stone-700">
          <div className="flex flex-wrap justify-center gap-1">
            {dupes.map((Icon, i) => (
              <Icon key={i} className="h-4 w-4 text-stone-400 opacity-60" style={{ animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5">
            <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            <p className="text-[9px] font-black text-white tracking-widest">WASTED</p>
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
              <d.Icon className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-amber-300 truncate">{d.label}</p>
              </div>
              <span className="text-[9px] font-black text-emerald-400 shrink-0">{d.val}</span>
            </div>
          ))}
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[8px] text-amber-400 text-center font-bold"><Sparkles className="h-2.5 w-2.5" /> Combine forces to unlock</p>
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
      { label: "Storybook Collection", price: "£15", who: "Grandma Linda", claimAt: 0.2 },
      { label: "Lego Space Set", price: "£25", who: "Uncle Steve", claimAt: 0.45 },
      { label: "Marvel Figure Set", price: "£18", who: "Auntie Jo", claimAt: 0.72 },
    ];
    return (
      <div className="flex h-full flex-col justify-center gap-1.5 px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <Users className="h-4 w-4 text-stone-300" strokeWidth={1.75} />
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
            <ShieldCheck className="h-3 w-3 text-emerald-400" strokeWidth={2} />
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
    const milestones = [
      { Icon: Cake, label: "Birthday" },
      { Icon: TreePine, label: "Christmas" },
      { Icon: GraduationCap, label: "Graduation" },
    ];
    const totalFilled = Math.min(1, progress * 1.3);
    return (
      <div className="flex h-full flex-col justify-center gap-3 px-4 py-3">
        {/* Timeline */}
        <div className="relative flex items-center gap-0">
          {milestones.map((m, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 border text-center transition-all duration-500",
                progress > i * 0.3 ? "bg-amber-900/40 border-amber-700/50" : "bg-stone-800/50 border-stone-700/40",
              )}>
                <m.Icon className="h-3 w-3 text-amber-300" strokeWidth={1.75} />
                <p className="text-[8px] font-bold text-stone-300 whitespace-nowrap">{m.label}</p>
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
            <p className="flex items-center gap-1 text-[9px] font-black text-emerald-300"><Armchair className="h-3 w-3" /> Family Sofa Pot</p>
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
    const messages = ["Happy Birthday!", "Love you so much!", "From Gran", "You deserve it!", "Woop woop!"];
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden bg-stone-950">
        {/* Stars bg */}
        <div className="pointer-events-none absolute inset-0">
          {[{l:"10%",t:"15%"},{l:"80%",t:"10%"},{l:"55%",t:"8%"},{l:"30%",t:"20%"},{l:"90%",t:"35%"},{l:"5%",t:"50%"}].map((p,i)=>(
            <Star key={i} className="absolute h-2 w-2 fill-white/30 text-white/30" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.2}s ${i*0.3}s ease-in-out infinite alternate`}} />
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
                <Gift className="h-8 w-8 text-white/80" strokeWidth={1.5} />
              </div>
              {/* Bow accent */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/80" />
            </div>
            <p className="text-[9px] font-bold text-stone-400">Under Wraps · progress hidden</p>
            {shaking && <p className="text-[9px] font-black text-amber-400 animate-pulse">Igniting reveal…</p>}
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
            <p className="flex items-center gap-1.5 text-xl font-black text-amber-400"><Sparkles className="h-5 w-5" /> Reveal!</p>
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
            <p className="text-[10px] font-bold text-emerald-300 mb-0.5">WhatsApp · Mum</p>
            <p className="text-[11px] text-stone-200">Billy&apos;s wishlist</p>
            <p className="text-[9px] text-stone-400 mt-0.5 underline">kindledgift.co.uk/billy</p>
          </div>
          <p className="text-[9px] font-bold text-stone-400">One link · no account needed</p>
        </div>
      )}
      {phase === 1 && (
        <div className="flex flex-col items-center gap-2 animate-fade-up">
          {/* Stripe badge */}
          <div className="flex items-center gap-1.5 rounded-xl bg-indigo-900/50 border border-indigo-700/40 px-3 py-1.5">
            <Lock className="h-3 w-3 text-indigo-300" strokeWidth={2} />
            <p className="text-[9px] font-black text-indigo-300">Regulated &amp; Secured by Stripe</p>
          </div>
          {/* Apple Pay button */}
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-stone-100 px-6 py-3 shadow-lg">
            <CreditCard className="h-4 w-4 text-stone-900" strokeWidth={2} />
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
            {[2, 3, 3].map((count, ri) => (
              <div key={ri} className="flex gap-2">
                {Array.from({ length: count }, (_, ei) => (
                  <Users key={ei} className="h-4 w-4 text-amber-300 animate-bounce" style={{ animationDelay: `${(ri*3+ei)*0.08}s` }} />
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
          <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-800">Watch How Kindled Works</p>
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
    { icon: Link2, label: "Affiliate Commission", sub: "4.5% on £" + totalGoal.toLocaleString() + " catalogue value", val: affiliate, color: "text-amber-400" },
    { icon: Gift, label: "Gift Card Margin", sub: "4% wholesale via Tillo / Prezzee", val: giftCard, color: "text-emerald-400" },
    { icon: Landmark, label: "Open Banking Spread", sub: "0.5% minus 5p per A2A transfer", val: ob, color: "text-sky-400" },
    { icon: Radio, label: "Intent Data Leads", sub: "£4.75 CPM × high-ticket nodes", val: intent, color: "text-violet-400" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Handle */}
      <div className="flex justify-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-t-xl border border-b-0 border-stone-700/60 bg-stone-900/98 px-5 py-2.5 backdrop-blur-md"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400"><Wrench className="h-3 w-3" /> Investor HUD</span>
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
                  <s.icon className={cn("h-3.5 w-3.5", s.color)} strokeWidth={2} />
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
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-2">
              <Radio className="h-3 w-3" /> IntentDataNode Ledger — Series A Foundation
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
  { id: "c1", Icon: Zap,         title: "Toothbrush Hero",    desc: "Brush teeth morning & night",   stars: 1, color: "from-sky-400 to-blue-500",       shadow: "shadow-sky-200" },
  { id: "c2", Icon: Package,     title: "Toy Castle Tidyer",  desc: "Put toys back in the box",       stars: 2, color: "from-violet-400 to-purple-500",  shadow: "shadow-violet-200" },
  { id: "c3", Icon: Leaf,        title: "Veggie Victory",     desc: "Eat all your greens at dinner",  stars: 1, color: "from-emerald-400 to-green-500",  shadow: "shadow-emerald-200" },
  { id: "c4", Icon: ShieldCheck, title: "Storytime Sleepyhead", desc: "Bed on time without a fuss",  stars: 2, color: "from-amber-400 to-orange-500",   shadow: "shadow-amber-200" },
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

const BURST_COLORS = ["#fbbf24", "#f59e0b", "#fb923c", "#a78bfa", "#38bdf8", "#4ade80", "#f472b6", "#facc15", "#60a5fa", "#34d399", "#fb7185", "#c084fc"];

function StarBurst({ x, y }: { x: number; y: number }) {
  const particles = BURST_COLORS.map((color, i) => {
    const angle = (i / BURST_COLORS.length) * Math.PI * 2 - Math.PI / 2;
    const dist = 55 + (i % 3) * 22;
    const size = 6 + (i % 3) * 4;
    return { id: i, color, size, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
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
      {/* Dot burst particles */}
      {particles.map((p) => (
        <motion.div key={p.id}
          initial={{ x: 0, y: 0, scale: 1.4, opacity: 1 }}
          animate={{ x: p.tx, y: p.ty, scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.4, 1] }}
          className="absolute rounded-full"
          style={{ left: x - p.size / 2, top: y - p.size / 2, width: p.size, height: p.size, background: p.color }}
        />
      ))}
      {/* Centre pop circle */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2.2, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.5, times: [0, 0.45, 1] }}
        className="absolute rounded-full bg-amber-300"
        style={{ left: x - 16, top: y - 16, width: 32, height: 32 }}
      />
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
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 mx-auto">
          <Gift className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-[18px] font-black text-white mb-1">Redeem Stars</h2>
        <p className="text-[12px] text-violet-300 mb-5">Ask Mum or Dad to approve your gift card!</p>
        {[
          { brand: "Amazon", color: "#f59e0b", val: 10, stars: 20 },
          { brand: "Smyths Toys", color: "#a78bfa", val: 5, stars: 10 },
          { brand: "LEGO Store", color: "#38bdf8", val: 15, stars: 30 },
        ].map((gc) => (
          <div key={gc.brand} className="mb-3 flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: gc.color + "30" }}>
                <ShoppingBag className="h-4 w-4" style={{ color: gc.color }} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-white">{gc.brand} Gift Card</p>
                <p className="text-[11px] text-violet-300">£{gc.val} · 0% fees</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black text-amber-400">{gc.stars} stars</p>
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
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-1"><Sparkles className="h-3 w-3" /> Kindled Stars</p>
        <h1 className="text-[22px] font-black text-white leading-tight">Billy&apos;s Star Dashboard</h1>
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
            <Wallet className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[12px] font-bold text-white">Star Exchange Rate</p>
            <p className="flex items-center gap-1 text-[11px] text-violet-300">1 <StarIcon size={11} className="text-amber-400" /> = £{EXCHANGE_RATE.toFixed(2)} funded by Mum &amp; Dad</p>
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
              <Gift className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{targetPot.title}</p>
              <div className="mt-1.5 h-3 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500", impactPot === targetPot.id && "animate-pulse")}
                  style={{ width: `${Math.min(100, Math.round((targetPot.raised / targetPot.goal) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-violet-300 mt-1">£{targetPot.raised} / £{targetPot.goal} · Stars splash here!</p>
            </div>
            {impactPot === targetPot.id && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/30 animate-bounce">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Adventures */}
      <section className="relative z-10 px-4 mb-6">
        <h2 className="text-[14px] font-black text-white mb-1">Daily Adventures</h2>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/25">
                  <chore.Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
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
          <Trophy className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white">Star Chart</p>
            <p className="text-[11px] text-violet-300">Fill 20 stars → unlock your reward!</p>
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
                    <StarIcon size={isMilestone ? 18 : 14} className={isMilestone ? "text-orange-400" : "text-amber-400"} />
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
            ? "Chart complete! Ask Mum or Dad to redeem your reward!"
            : `Tap the next square to add your star! ${20 - filledCells.size} to go`}
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
// WOULD YOU RATHER
// ═══════════════════════════════════════════════════════════════════════════════

const RANDOM_GIFT_COLORS = ["#f59e0b","#a78bfa","#38bdf8","#4ade80","#fb923c","#f472b6","#60a5fa","#34d399","#fbbf24","#c084fc","#fb7185","#6ee7b7"];
const RANDOM_GIFTS = [
  { label: "Socks", price: 8 },
  { label: "Candle", price: 12 },
  { label: "Body lotion", price: 9 },
  { label: "Random book", price: 14 },
  { label: "Chocolates", price: 7 },
  { label: "Trinket", price: 11 },
  { label: "Plant pot", price: 15 },
  { label: "Picture frame", price: 13 },
  { label: "Mug", price: 10 },
  { label: "Mini puzzle", price: 16 },
  { label: "Desk gadget", price: 18 },
  { label: "Bath salts", price: 12 },
];

const DREAM_GIFTS = [
  {
    name: "MacBook Air M3",
    price: 649,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop&q=80",
    contributors: 6,
    each: 108,
  },
  {
    name: "Nike Air Max 270",
    price: 110,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop&q=80",
    contributors: 4,
    each: 28,
  },
];

function WouldYouRather() {
  const [side, setSide] = useState<"random" | "dream">("random");
  const randomTotal = RANDOM_GIFTS.reduce((s, g) => s + g.price, 0);
  const dreamTotal = DREAM_GIFTS.reduce((s, g) => s + g.price, 0);

  return (
    <section className="px-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">Stop and think</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[22px] font-semibold text-stone-800 leading-tight">
          Would you rather…
        </h2>
      </div>

      {/* Toggle pill */}
      <div className="flex rounded-2xl bg-stone-100 p-1 gap-1 mb-4">
        {(["random", "dream"] as const).map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSide(s)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
              side === s ? "bg-white shadow-sm text-stone-900" : "text-stone-400",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {s === "random" ? <Gift className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {s === "random" ? "15 random gifts" : "The dream gifts"}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {side === "random" ? (
          <motion.div
            key="random"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Random gifts grid */}
            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-6 gap-2 mb-4">
                {RANDOM_GIFTS.map((g, i) => (
                  <motion.div
                    key={g.label}
                    initial={{ opacity: 0, scale: 0.4, rotate: Math.random() * 30 - 15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.045, type: "spring", stiffness: 500, damping: 20 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: (RANDOM_GIFT_COLORS[i % RANDOM_GIFT_COLORS.length]!) + "22", animation: `wobble ${2.2 + i * 0.15}s ${i * 0.2}s ease-in-out infinite` }}>
                      <Gift className="h-4 w-4" style={{ color: RANDOM_GIFT_COLORS[i % RANDOM_GIFT_COLORS.length]! }} strokeWidth={1.5} />
                    </div>
                    <span className="text-[8px] text-stone-400 leading-tight text-center">{g.label}</span>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-stone-400">Total spent</p>
                  <p style={{ fontFamily: "var(--font-display)" }} className="text-[24px] font-bold text-stone-700">~£{randomTotal}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-stone-400 leading-tight max-w-[140px]">
                    Most forgotten by February.<br/>Half already owned.<br/>One returned.
                  </p>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setSide("dream")}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-[14px] font-semibold text-stone-900 shadow-sm shadow-amber-200"
            >
              Or… see what a list could unlock →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="dream"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="space-y-3"
          >
            {DREAM_GIFTS.map((g, i) => (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 380, damping: 30 }}
                className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm"
              >
                <div className="relative h-36 overflow-hidden">
                  <img src={g.image} alt={g.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-semibold text-white leading-tight">{g.name}</p>
                      <p className="text-[13px] font-bold text-amber-400">£{g.price}</p>
                    </div>
                    <div className="rounded-xl bg-white/15 backdrop-blur-sm px-2.5 py-1.5 text-right">
                      <p className="text-[10px] text-white/80">{g.contributors} people</p>
                      <p className="text-[13px] font-black text-white">£{g.each} each</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: g.contributors }).map((_, j) => (
                      <div key={j} className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-orange-400 text-stone-900">
                        <Users className="h-2.5 w-2.5" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500">{g.contributors} people kindling together</p>
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-500"><Check className="h-3 w-3" /> No duplicates</span>
                </div>
              </motion.div>
            ))}
            {/* Summary */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-stone-500">Total value unlocked</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-bold text-amber-600">£{dreamTotal}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-stone-500 leading-tight">Remembered forever.<br/>Exactly what they wanted.<br/>Zero guesswork.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHY KINDLED — STATS COLLATERAL
// ═══════════════════════════════════════════════════════════════════════════════

const WHY_STATS: {
  stat: string; label: string; body: string; Icon: LucideIcon; iconBg: string; iconColor: string;
  color: string; accent: string; border: string; source: string;
}[] = [
  {
    stat: "£3.2bn",
    label: "spent on unwanted UK gifts each year",
    body: "Around 1 in 4 gifts ends up unused, regifted, or returned — money and effort wasted on both sides.",
    Icon: Package,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    color: "from-orange-50 to-amber-50",
    accent: "text-orange-500",
    border: "border-orange-100",
    source: "OnePoll / Halifax Bank survey, 2023",
  },
  {
    stat: "+30%",
    label: "seasonal packaging waste spike",
    body: "Packaging, returns logistics, and unnecessary duplicates surge every December — guided lists help cut this down.",
    Icon: Leaf,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    color: "from-emerald-50 to-teal-50",
    accent: "text-emerald-600",
    border: "border-emerald-100",
    source: "WRAP UK Seasonal Waste Report, 2022",
  },
  {
    stat: "1 in 5",
    label: "gifts are duplicates or returned",
    body: "Without coordination, duplicates are inevitable. Real-time claim locking means no two people can buy the same thing.",
    Icon: RefreshCw,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    color: "from-violet-50 to-purple-50",
    accent: "text-violet-500",
    border: "border-violet-100",
    source: "YouGov UK Gift Buying Survey, 2023",
  },
  {
    stat: "0",
    label: "duplicates when you guide your buyers",
    body: "Real-time claim locking means no two people can buy the same thing. Everyone contributes with confidence.",
    Icon: ShieldCheck,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-500",
    color: "from-sky-50 to-blue-50",
    accent: "text-sky-500",
    border: "border-sky-100",
    source: "Kindled platform mechanic",
  },
];

function WhyKindled() {
  return (
    <section className="px-4">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Why it matters</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-semibold text-stone-800 leading-tight mt-0.5">
          Guiding your buyers helps everyone
        </h2>
        <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
          One shared list. No more guessing, overspending to compensate, or gifts that miss the mark.
          The people who love you finally know exactly how to help — and you get one step closer to what you really want.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WHY_STATS.map((s) => (
          <motion.div
            key={s.stat}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn("rounded-2xl border p-4 bg-gradient-to-br", s.color, s.border)}
          >
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl", s.iconBg)}>
              <s.Icon className={cn("h-4 w-4", s.iconColor)} />
            </div>
            <p className={cn("mt-2 text-[26px] font-black leading-none", s.accent)} style={{ fontFamily: "var(--font-display)" }}>
              {s.stat}
            </p>
            <p className="text-[11px] font-semibold text-stone-700 mt-0.5 leading-tight">{s.label}</p>
            <p className="text-[10px] text-stone-500 mt-1.5 leading-relaxed">{s.body}</p>
            <p className="text-[8.5px] text-stone-400/70 mt-2 leading-snug italic">Source: {s.source}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-200 px-4 py-4">
        <p className="text-[13px] font-semibold text-stone-800 leading-relaxed text-center">
          No more guessing. No overspending to compensate. No awkward returns.
        </p>
        <p className="text-[12px] text-stone-500 text-center mt-1">
          Just one list — and everyone who loves you, finally able to help.
        </p>
      </div>
    </section>
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

const EVENT_OPTIONS: { type: EventType; label: string; color: string }[] = [
  { type: "birthday",  label: "Birthday",  color: "#f59e0b" },
  { type: "christmas", label: "Christmas", color: "#ef4444" },
  { type: "custom",    label: "Other",     color: "#a78bfa" },
  { type: "ongoing",   label: "Ongoing",   color: "#38bdf8" },
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
                <span className="inline-flex items-center gap-1.5">
                  {m === "link" ? <Link2 className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                  {m === "link" ? "Paste a link" : "Enter manually"}
                </span>
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
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
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
                  <div className="h-5 w-5 rounded-full" style={{ background: ev.color }} />
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
                {isSurprise
                  ? <Lock className="h-6 w-6 text-amber-500" strokeWidth={1.75} />
                  : <Eye className="h-6 w-6 text-stone-400" strokeWidth={1.75} />}
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
            <Gift className="h-[18px] w-[18px]" strokeWidth={2} />
            <span style={{ fontFamily: "var(--font-display)" }}>Add to list</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE (one-pager)
// ═══════════════════════════════════════════════════════════════════════════════

function AboutPage() {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitState("sending");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: "Waitlist" }),
      });
      setSubmitState(res.ok ? "done" : "error");
    } catch {
      setSubmitState("error");
    }
  }

  const PROBLEMS = [
    { Icon: AlertCircle, title: "The Guessing Game", stat: "71%", body: "of us feel real anxiety shopping for someone on our list. The well-meant guesses that follow are how 23 million unwanted gifts end up in UK landfill every Christmas." },
    { Icon: Copy, title: "The Duplicate Disaster", stat: "£700M", body: "wasted yearly on UK gifts nobody actually wanted. Nobody coordinates — so Grandma and Uncle Dave both buy the same LEGO set." },
    { Icon: CreditCard, title: "The Money Squeeze", stat: "£514", body: "the average UK Christmas costs per head. 36% of us say the cost of living has already shrunk our gifting budget — yet the big stuff feels out of reach alone." },
  ];

  const STEPS = [
    { n: "1", title: "Build your list", desc: "Items or a cash goal — any size, any occasion." },
    { n: "2", title: "Share one link", desc: "WhatsApp or text — no app download, grandparents included." },
    { n: "3", title: "It stays a secret", desc: "Contributors see what's covered so nothing's bought twice — the total stays under wraps." },
    { n: "4", title: "The big reveal", desc: "On the day — birthday, baby shower, Christmas and more — everyone gathers for one big moment." },
  ];

  const BENEFITS = [
    { title: "Free. Forever.", desc: "No listing fees, no withdrawal fees — not even on the small stuff." },
    { title: "Real cashback", desc: "Earn 1–2% back on every contribution, plus a raffle entry every £10." },
    { title: "No app needed", desc: "Open a link, pay by FaceID in seconds. Works for grandparents too." },
    { title: "Duplicate-proof", desc: "Contributors see it ticked off instantly, so nobody ever doubles up." },
    { title: "The Reveal", desc: "A genuinely emotional ceremony with the people who love you — not just a balance update." },
    { title: "Nothing expires", desc: "An unfinished pot carries to the next birthday or Christmas — never a \"failure.\"" },
  ];

  const PLANET = [
    { Icon: Trash2, title: "23 Million Gifts", body: "Unwanted Christmas presents that end up in UK landfill every single year — most never even unwrapped twice." },
    { Icon: Package, title: "£1.27 Billion", body: "Spent annually on UK gifts nobody wanted — much of it boxed, wrapped, and binned within weeks." },
    { Icon: TrendingUp, title: "+30% Waste", body: "The rise in household waste over the festive season alone — wrapping, packaging, and gifts nobody asked for." },
  ];

  return (
    <div className="min-h-screen bg-[#15100C] text-white">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-[60vw] w-[60vw] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50vw] w-[50vw] rounded-full bg-orange-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-10 px-4 pb-20 pt-8">

        {/* ── Hero ── */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-400">Gifting, Reimagined</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[clamp(1.7rem,6vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-white">
            Gifting, Without the{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">Guesswork.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-amber-100/70">
            Kindled turns &ldquo;what do you actually want?&rdquo; into one shared goal everyone can chip in on — any amount, no app required, completely free. No more duplicates. No more clutter. Just the thing they really wanted, funded by the people who love them.
          </p>
        </div>

        {/* ── Problem ── */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-1 text-[22px] font-semibold text-white">We&apos;ve All Been There</h2>
          <p className="mb-5 text-[13px] text-amber-100/50">The same gifting headaches, year after year — and the numbers prove it&apos;s not just you.</p>
          <div className="flex flex-col gap-3">
            {PROBLEMS.map(({ Icon, title, stat, body }) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="rounded-2xl border border-white/8 p-4"
                style={{ background: "linear-gradient(165deg,#1F140A,#241707)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.75} />
                  <p className="text-[14px] font-semibold text-amber-200">{title}</p>
                </div>
                <p className="text-[13px] leading-relaxed text-amber-100/60">
                  <span className="font-bold text-amber-300">{stat} </span>{body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Solution ── */}
        <div className="rounded-2xl border border-amber-500/25 p-5" style={{ background: "linear-gradient(160deg,rgba(244,140,6,0.14),rgba(232,93,4,0.04))" }}>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-3 text-[22px] font-semibold text-white">Meet the Pot.</h2>
          <p className="mb-5 text-[13px] leading-relaxed text-amber-100/70">
            Kindled replaces the guesswork with one shared goal. Build a list — from new trainers to a house deposit. Share a single link. Everyone who loves you chips in whatever they can, big or small. Nothing gets duplicated, nothing gets wasted — and the big moment stays a surprise until everyone&apos;s together to share it.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-white/8 bg-white/4 p-3 transition-colors hover:bg-amber-500/8">
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[11px] font-black text-stone-900">{s.n}</span>
                <p className="text-[13px] font-semibold text-white">{s.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-amber-100/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Real Life Vignettes ── */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-1 text-[22px] font-semibold text-white">Real People. Real Pots.</h2>
          <p className="mb-5 text-[13px] text-amber-100/50">Two ordinary moments, fixed.</p>
          <div className="flex flex-col gap-4">
            {/* Leo's Birthday */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Cake className="h-5 w-5 text-violet-400" strokeWidth={1.75} />
                <h3 className="text-[14px] font-semibold text-white">Leo&apos;s 6th Birthday</h3>
              </div>
              <div className="mb-2 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100/40">Before</span>
                <p className="text-[12px] leading-snug text-amber-100/60">Mum gets 14 &ldquo;what does he want?&rdquo; texts. Grandma and Uncle Dave both buy the LEGO set. £80 of toys get returned or binned.</p>
              </div>
              <div className="mb-3 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">Kindled</span>
                <p className="text-[12px] leading-snug text-amber-100/60">One link, 14 relatives — every gift ticked off behind the scenes so nothing doubles up. Leo has no idea what&apos;s coming.</p>
              </div>
              <p className="border-t border-white/8 pt-2.5 text-[12px] font-medium italic text-amber-300">Mum saves £80 — and her sanity.</p>
            </div>
            {/* Dad's Log Burner */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" strokeWidth={1.75} />
                <h3 className="text-[14px] font-semibold text-white">Dad&apos;s Log Burner</h3>
              </div>
              <div className="mb-2 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100/40">Before</span>
                <p className="text-[12px] leading-snug text-amber-100/60">Everyone gets Dad &ldquo;something&rdquo; for Christmas — ties, socks. The £1,200 log burner he actually wants stays a pipe dream; too much for one person.</p>
              </div>
              <div className="mb-3 flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">Kindled</span>
                <p className="text-[12px] leading-snug text-amber-100/60">8 family members quietly chip in throughout the year. Christmas morning, with everyone gathered round, Dad finds out exactly how far they got.</p>
              </div>
              <p className="border-t border-white/8 pt-2.5 text-[12px] font-medium italic text-amber-300">Fully funded or not, every pound brings it closer — and an unfinished pot simply rolls on to his birthday, until the log burner&apos;s real.</p>
            </div>
          </div>
        </div>

        {/* ── Reveal Ceremony ── */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 p-6 text-center" style={{ background: "linear-gradient(160deg,rgba(244,140,6,0.20),rgba(232,93,4,0.05))" }}>
          {/* Static confetti dots */}
          {[["10%","8%","#FFC971",10],["88%","16%","#F4684E",8],["6%","72%","#FFC24B",7],["92%","80%","#F48C06",11],["48%","8%","#E85D04",6]].map(([l,t,c,s],i) => (
            <div key={i} className="pointer-events-none absolute rounded-full opacity-60" style={{ left: l as string, top: t as string, background: c as string, width: Number(s), height: Number(s) }} />
          ))}
          <h2 style={{ fontFamily: "var(--font-display)" }} className="relative z-10 mb-2 text-[22px] font-semibold text-white">The Big Reveal Ceremony</h2>
          <p className="relative z-10 mx-auto mb-5 max-w-lg text-[13px] leading-relaxed text-amber-100/70">
            This is the bit other apps skip. When it&apos;s time, everyone gathers — in the room or on a video call — for one big moment. Slide to reveal. Confetti. A wall of photos from everyone who chipped in, plus the odd video message that&apos;ll get someone a little misty-eyed. It&apos;s not a notification — it&apos;s an occasion.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-2">
            {["Slide to reveal","Confetti & photo wall","Video messages","Everyone together"].map((chip) => (
              <span key={chip} className="rounded-full border border-amber-500/40 bg-white/7 px-3 py-1.5 text-[11px] font-bold text-amber-300">{chip}</span>
            ))}
          </div>
        </div>

        {/* ── Benefits ── */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-4 text-[22px] font-semibold text-white">The Bit That Actually Matters</h2>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ title, desc }) => (
              <div key={title} className="flex gap-2.5 rounded-2xl border border-white/8 bg-white/3 p-3 transition-colors hover:bg-amber-500/6">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                  <Check className="h-3.5 w-3.5 text-amber-300" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-amber-100/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kids ── */}
        <div className="rounded-2xl border border-amber-200/17 p-5" style={{ background: "linear-gradient(155deg,rgba(255,201,113,0.08),rgba(244,140,6,0.02))" }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">For the Little Ones</p>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-3 text-[18px] font-semibold text-white">The List They&apos;ve Been Building All Year</h2>
          <p className="mb-2 text-[13px] leading-relaxed text-amber-100/60">
            We all remember it — the big catalogue landing on the doormat, dog-eared by page two. Circling things in biro. That quietly absorbed, hopeful ritual of building a wish list.
          </p>
          <p className="mb-4 text-[13px] leading-relaxed text-amber-100/60">
            Kindled gives kids their own digital catalogue to browse, tap, and dream over — starring exactly what they&apos;d love, with no idea which ones are already covered. Good behaviour is built in: stars earned for good days move them closer to the gifts they&apos;re working towards.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Browse & star items","Surprise stays intact","Any age, any occasion","Good days earn stars"].map((chip) => (
              <span key={chip} className="rounded-full border border-amber-200/25 bg-amber-200/8 px-3 py-1 text-[11px] font-bold text-amber-300">{chip}</span>
            ))}
          </div>
        </div>

        {/* ── Planet ── */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-1 text-[22px] font-semibold text-white">Good For Them. Good For the Planet.</h2>
          <p className="mb-5 text-[13px] text-amber-100/50">Unwanted gifts don&apos;t just waste money — they waste resources. Funding what&apos;s actually wanted means less ends up in the bin.</p>
          <div className="flex flex-col gap-3">
            {PLANET.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-3.5 rounded-2xl border border-white/8 p-4" style={{ background: "linear-gradient(165deg,#1F140A,#241707)" }}>
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.75} />
                <div>
                  <p className="text-[13px] font-semibold text-amber-200">{title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-amber-100/60">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust ── */}
        <div className="flex gap-4 rounded-2xl border border-white/8 bg-[#1F140A] p-5">
          <ShieldCheck className="mt-0.5 h-8 w-8 shrink-0 text-amber-400" strokeWidth={1.5} />
          <div>
            <h3 style={{ fontFamily: "var(--font-display)" }} className="mb-1.5 text-[16px] font-semibold text-white">Every Penny Goes to the Gift.</h3>
            <p className="text-[13px] leading-relaxed text-amber-100/65">
              No listing fees. No withdrawal fees. No quiet percentage disappearing along the way. Whether you&apos;re chipping in £5 or running the whole pot, every penny goes toward the gift — not one slice is ever taken, by us or anyone else. Free for the people giving. Free for the people receiving. Always.
            </p>
          </div>
        </div>

        {/* ── Waitlist CTA ── */}
        <div className="rounded-2xl border border-amber-400 p-6 text-center" style={{ background: "linear-gradient(165deg,rgba(244,140,6,0.22),rgba(232,93,4,0.06))", boxShadow: "0 0 24px rgba(244,140,6,0.28), 0 0 50px rgba(232,93,4,0.14)" }}>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-2 text-[22px] font-semibold text-white">Be Among the First to Light a Pot</h2>
          <p className="mx-auto mb-5 max-w-sm text-[13px] leading-relaxed text-amber-100/70">
            We&apos;re opening Kindled to early users soon. Join the waitlist and we&apos;ll let you know the moment you can build your first list.
          </p>
          {submitState === "done" ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 py-3.5">
              <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
              <span className="text-[14px] font-semibold text-emerald-300">You&apos;re on the list — we&apos;ll be in touch!</span>
            </div>
          ) : (
            <form onSubmit={(e) => { void handleWaitlist(e); }} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 rounded-xl border border-white/18 bg-white/6 px-3.5 py-3 text-[13px] text-white placeholder:text-amber-100/35 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={submitState === "sending"}
                className="rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 px-4 py-3 text-[13px] font-bold text-stone-900 shadow-lg shadow-amber-900/40 disabled:opacity-60 whitespace-nowrap"
                style={{ animation: "pulseGlow 2.4s ease-in-out infinite" }}
              >
                {submitState === "sending" ? "Sending…" : "Join the Waitlist →"}
              </motion.button>
            </form>
          )}
          {submitState === "error" && <p className="mt-2 text-[11px] text-red-400">Something went wrong — try again.</p>}
          <p className="mt-3 text-[11px] text-amber-100/35">Free forever. No spam, ever.</p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-[12px] text-amber-100/40"><span className="font-bold text-amber-300">Kindled</span> — gifting, the way it should feel.</span>
          <span className="text-right text-[10px] leading-snug text-amber-100/30">Sources: GiftAFeeling 2025 · GlobalData UK Gifting 2024 · YouGov/MoneySuperMarket 2025</span>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SWITCHER
// ═══════════════════════════════════════════════════════════════════════════════

type ViewMode = "parent" | "receiver" | "about";

function RoleSwitcher({ role, onChange }: { role: ViewMode; onChange: (r: ViewMode) => void }) {
  const tabs: { id: ViewMode; label: string; Icon: typeof Users }[] = [
    { id: "parent", label: "Contribute", Icon: Users },
    { id: "receiver", label: "Billy's View", Icon: Sparkles },
    { id: "about", label: "About", Icon: Info },
  ];
  return (
    <div className="sticky top-0 z-30 flex justify-center px-4 pt-3 pb-2 bg-[#fdf9f5]/90 backdrop-blur-md border-b border-stone-100">
      <div className="flex w-full max-w-sm rounded-2xl bg-stone-100 p-1 gap-1 shadow-inner">
        {tabs.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition-all",
              role === id ? "bg-white shadow-sm text-stone-900" : "text-stone-400",
            )}
          >
            {role === id && (
              <motion.div layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" style={{ zIndex: -1 }} />
            )}
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Count-up stat for the proof block ───────────────────────────────────────
function CountUpStat({ target, suffix = "", duration = 1400 }: { target: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(ease * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Single locked pot card used in Receiver's unified stream ─────────────────
function ReceiverPotCard({ pot, index }: { pot: DemoPot; index: number }) {
  const occ = occasionFor(pot);
  const isXmas = occ === "christmas";
  const targetIso = occasionTargetIso(pot);
  const daysUntil = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 86_400_000));

  const th = isXmas
    ? { bg: "bg-[#140a08]", border: "border-red-800/40", accent: "from-red-700 via-amber-500 to-red-600",
        giftColor: "text-amber-400", dayColor: "text-amber-300", labelColor: "text-amber-400/80",
        modeLabel: "Under Wraps" }
    : { bg: "bg-[#12091f]", border: "border-violet-600/30", accent: "from-violet-500 via-fuchsia-400 to-pink-400",
        giftColor: "text-violet-300", dayColor: "text-violet-300", labelColor: "text-violet-400/80",
        modeLabel: "Wrapped Up" };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 360, damping: 32 }}
      className={cn("relative overflow-hidden rounded-2xl border shadow-lg shadow-black/30", th.bg, th.border)}
    >
      {/* Accent stripe */}
      <div className={cn("h-[3px] w-full bg-gradient-to-r", th.accent)} />

      {/* Seasonal particle backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {isXmas
          ? SNOW.map((s) => (
              <span key={s.id} className="animate-snow absolute rounded-full bg-white/70"
                style={{ left: s.left, top: 0, width: s.size, height: s.size,
                  "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
            ))
          : (
            <>
              {CONFETTI_P.map((c) => (
                <span key={c.id} className={cn("animate-confetti absolute rounded-sm", c.color)}
                  style={{ left: c.left, top: 0, width: c.w, height: c.h,
                    "--dur": c.dur, "--rot": c.rot, animationDelay: c.delay } as React.CSSProperties} />
              ))}
              {BUBBLES_P.map((b) => (
                <span key={b.id} className="animate-bubble-rise absolute bottom-0 rounded-full"
                  style={{ left: b.left, width: b.size, height: b.size, backgroundColor: b.color,
                    "--dur": b.dur, animationDelay: b.delay,
                    boxShadow: `0 0 8px ${b.color}60` } as React.CSSProperties} />
              ))}
            </>
          )}
      </div>

      <div className="relative z-10">
        {/* Product image — full-width banner */}
        {pot.image && (
          <div className="relative h-32 w-full overflow-hidden">
            <img src={pot.image} alt={pot.title} className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
            {/* Lock badge */}
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
              <Lock className="h-3 w-3 text-white/70" strokeWidth={2} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">{th.modeLabel}</span>
            </div>
            {/* Countdown badge */}
            <div className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 backdrop-blur-sm", isXmas ? "bg-red-900/70" : "bg-violet-900/70")}>
              <span className={cn("text-[11px] font-bold", th.dayColor)}>
                {isXmas ? "Christmas" : "Birthday"} in {daysUntil} {daysUntil === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Title row */}
          <div className="flex items-start gap-3">
            {!pot.image && (
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10")}>
                <Gift className={cn("h-5 w-5", th.giftColor)} strokeWidth={1.5} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-semibold text-white leading-snug">{pot.title}</h3>
              <p className={cn("mt-0.5 text-[11px]", th.labelColor)}>
                {!pot.image && `${isXmas ? "Christmas" : "Birthday"} in ${daysUntil} days · `}Balance hidden · {pot.contributors} givers
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Target</p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-bold text-white">£{pot.goal.toLocaleString()}</p>
            </div>
          </div>

          {/* Heat progress */}
          <div className="mt-3">
            <FundingBar raised={pot.raised} goal={pot.goal} hideAmounts />
          </div>

          {/* Stack note */}
          {pot.stackNote && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5">
              <RefreshCw className="mt-0.5 h-3 w-3 shrink-0 text-white/40" />
              <p className="text-[10px] leading-snug text-white/40">{pot.stackNote}</p>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ─── On-dashboard proof stats (receiver view) ─────────────────────────────────
function ReceiverProofStats() {
  const stats = [
    {
      Icon: Leaf,
      value: 30, suffix: "%",
      label: "Waste Reduction",
      desc: "Household retail waste spikes 30% over holidays. Kindled matches purchases to exact demand — dropping duplicate retail waste to 0%.",
      color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200/60",
    },
    {
      Icon: ShieldCheck,
      value: 100, suffix: "%",
      label: "Duplicate Free",
      desc: "1 in 5 physical gifts are duplicates. Our real-time checklists eliminate duplicate buying entirely.",
      color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200/60",
    },
    {
      Icon: Landmark,
      value: 3, suffix: ".2B",
      label: "Redirected",
      desc: "£3.2B wasted on unwanted gifts redirected into durable milestones previously out of any single person's budget.",
      color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-200/60",
    },
  ];

  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Why this list matters</p>
      <p style={{ fontFamily: "var(--font-display)" }} className="mb-4 text-[17px] font-semibold text-stone-800 leading-tight">
        A smarter, kinder way to give
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ Icon, value, suffix, label, desc, color, bg, border }) => (
          <div key={label} className={cn("flex gap-4 rounded-2xl border p-4", bg, border)}>
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm")}>
              <Icon className={cn("h-5 w-5", color)} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <p style={{ fontFamily: "var(--font-display)" }} className={cn("text-[22px] font-bold", color)}>
                  {value === 3 ? "£" : ""}<CountUpStat target={value} suffix={suffix} />
                </p>
                <p className="text-[12px] font-semibold text-stone-600">{label}</p>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[9px] text-stone-400 leading-snug">
        Sources: British Retail Consortium · Waste & Resources Action Programme (WRAP) UK · Psychological Science Gifting Surveys
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIVER VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ReceiverView({ pots, onOpenStars, onShare }: {
  pots: DemoPot[];
  onOpenStars: () => void;
  onShare: () => void;
}) {
  // Single unified stream — all pots regardless of mode
  const allActive = pots.filter((p) => !p.isClaimed);
  const claimed = pots.filter((p) => p.isClaimed);
  const occasion = nextMajorOccasion();
  const occasionName = occasion === "christmas" ? "Christmas" : "10th Birthday";
  const totalTarget = allActive.reduce((s, p) => s + p.goal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f0] to-[#fdf9f5]">
      {/* Hero */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg shadow-amber-200">
              <Sparkles className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500">Your Kindled list</p>
              <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[24px] font-semibold text-stone-900 leading-tight">Hey Billy!</h1>
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
        <p className="mt-1.5 text-right text-[10px] text-stone-400 pr-0.5">share your list with the people who love you</p>

        {/* Stats — no cash raised visible */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { value: `${allActive.length}`, label: "gifts", color: "text-amber-500" },
            { value: `£${totalTarget.toLocaleString()}`, label: "total target", color: "text-orange-500" },
            { value: occasionName, label: "next occasion", color: "text-violet-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <p className={cn("text-[14px] font-bold leading-tight", s.color)} style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
              <p className="text-[9px] text-stone-400 leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 pb-20 px-4">
        {/* ── Unified wishlist stream — every pot locked ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-3">Your wish list · all under wraps</p>
          <div className="flex flex-col gap-3">
            {allActive.map((pot, i) => (
              <ReceiverPotCard key={pot.id} pot={pot} index={i} />
            ))}
          </div>
        </div>

        {/* ── Claimed / sorted ── */}
        {claimed.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Sorted</p>
            <div className="flex flex-col gap-2">
              {claimed.map((pot) => (
                <div key={pot.id} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-stone-700 truncate">{pot.title}</p>
                    <p className="text-[11px] text-emerald-600">{pot.claimedBy} — on its way!</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── On-dashboard proof stats ── */}
        <ReceiverProofStats />

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
              <Star key={i} className="absolute h-2.5 w-2.5 fill-white/70 text-white/70" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.3}s ${i*0.4}s ease-in-out infinite alternate`,opacity:0.7}} />
            ))}
          </div>
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Sparkles className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200 mb-0.5">Kindled Stars</p>
              <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[19px] font-semibold text-white leading-tight">Your star chart</h3>
              <p className="flex items-center gap-1 text-[12px] text-violet-200 mt-0.5">24 <Star className="h-3 w-3 fill-current" /> earned · 4 adventures today</p>
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
  const [viewMode, setViewMode] = useState<ViewMode>("parent");
  const [isContributor, setIsContributor] = useState(false);
  useEffect(() => {
    setIsContributor(new URLSearchParams(window.location.search).get("view") === "contributor");
  }, []);
  const [showStars, setShowStars] = useState(false);
  const [showNewGift, setShowNewGift] = useState(false);
  const [pots, setPots] = useState<DemoPot[]>([...INITIAL_POTS, ...CHECKLIST_POTS]);
  const [revealPot, setRevealPot] = useState<DemoPot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingContribution, setPendingContribution] = useState<{ pot: DemoPot; amount: number } | null>(null);
  const [previewReceiver, setPreviewReceiver] = useState(false);

  const addLog = useCallback((entry: string) => {
    setLogEntries((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText("https://kindledgift.co.uk/list/billys-dreams?view=contributor").catch(() => null);
    showToast("Link copied to share with family!");
    addLog("Wishlist link shared — referral tracking engaged");
  }, [showToast, addLog]);

  const handleAddItem = useCallback((item: CatalogItem) => {
    if (addedIds.has(item.id)) return;
    setAddedIds((s) => new Set([...s, item.id]));
    const newPot: DemoPot = {
      id: `new_${item.id}`,
      title: item.name,
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
    showToast(`"${item.name}" added to Billy's Dream Board!`);
    const intentMsg = item.price >= 200
      ? `IntentDataNode CREATED: "${item.name}" £${item.price} — High-ticket Day 1 signal`
      : `Catalogue add: "${item.name}" (£${item.price.toFixed(2)}) — tracking engaged`;
    addLog(intentMsg);
  }, [addedIds, showToast, addLog]);

  const handleKindle = useCallback((id: string, amount: number) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: Math.min(p.goal, p.raised + amount), contributors: p.contributors + 1 } : p,
    ));
    showToast(`£${amount} kindled!`);
    addLog(`Contribution: £${amount} added to pot`);
  }, [showToast, addLog]);

  const handleBuy = useCallback((id: string) => {
    setPots((prev) => prev.map((p) =>
      p.id === id ? { ...p, raised: p.goal, isClaimed: true, claimedBy: "You", claimedNote: "Bought outright — no duplicate risk!" } : p,
    ));
    showToast("Bought outright — duplicate prevented!");
    addLog("Outright purchase: item fully claimed");
  }, [showToast, addLog]);

  const handleAddNewGift = useCallback((pot: DemoPot) => {
    setPots((prev) => [pot, ...prev]);
    showToast(`"${pot.title}" added to the list!`);
    addLog(`New gift created: "${pot.title}" £${pot.goal} — ${pot.mode}`);
  }, [showToast, addLog]);

  const activePots = pots.filter((p) => !p.isClaimed);
  const claimedPots = pots.filter((p) => p.isClaimed);
  const surprisePots = pots.filter((p) => p.mode !== "LIVE_FEED");

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      {revealPot && <RevealModal pot={revealPot} onClose={() => setRevealPot(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showNewGift && <NewGiftSheet onAdd={handleAddNewGift} onClose={() => setShowNewGift(false)} />}
      {pendingContribution && (
        <ContributionPromptModal
          pot={pendingContribution.pot}
          amount={pendingContribution.amount}
          onConfirm={handleKindle}
          onClose={() => setPendingContribution(null)}
        />
      )}

      {/* ── Kids Space (full-screen overlay) ── */}
      {showStars && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <KindledStars pots={pots} onClose={() => setShowStars(false)} />
        </div>
      )}

      {/* ── Role switcher (always visible) ── */}
      <RoleSwitcher role={viewMode} onChange={setViewMode} />

      {/* ── Views ── */}
      <AnimatePresence mode="wait">
      {viewMode === "about" ? (
        <motion.div key="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <AboutPage />
        </motion.div>
      ) : viewMode === "receiver" ? (
        <motion.div key="receiver" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
          <ReceiverView pots={pots} onOpenStars={() => setShowStars(true)} onShare={handleShare} />
        </motion.div>
      ) : (
      <motion.div key="parent" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 340, damping: 32 }}>
      {/* ── Parent Dashboard ── */}
      {<>
      <ProfileHeader
        potCount={pots.length}
        totalGoal={pots.reduce((s, p) => s + p.goal, 0)}
        onShare={handleShare}
        isContributor={isContributor}
      />

      <main className="space-y-7 pb-36 pt-4">
        {/* ── All pots grid (always LivePotCard — no hidden amounts) ── */}
        <section className="px-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              {isContributor ? "Active Pots" : "Gift List"}
            </p>
            <p style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-medium text-stone-800 leading-tight">
              {activePots.length} {isContributor ? "pots to kindle" : "gifts to kindle or buy"}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {activePots.map((pot) => (
              <LivePotCard
                key={pot.id}
                pot={pot}
                onKindle={handleKindle}
                onBuy={handleBuy}
                onAmountSelected={(p, amt) => setPendingContribution({ pot: p, amount: amt })}
                {...(!isContributor && { onRemove: (id: string) => setPots((p) => p.filter((x) => x.id !== id)) })}
              />
            ))}
            {/* Add new gift — owner only */}
            {!isContributor && (
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => setShowNewGift(true)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-xl font-bold text-stone-900 shadow">+</div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)" }} className="text-[15px] font-medium text-stone-700">New gift</p>
                  <p className="text-[12px] text-stone-400">Paste a link or enter manually</p>
                </div>
              </motion.button>
            )}
          </div>
          {/* Reveal preview — contributor only */}
          {isContributor && surprisePots.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              onClick={() => setRevealPot(surprisePots[0] ?? pots[0]!)}
              className="relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl p-4 text-left"
              style={{
                background: "linear-gradient(135deg, #1a0f0f 0%, #2d1515 50%, #1a0f0f 100%)",
                boxShadow: "0 4px 24px rgba(220,38,38,0.35), 0 0 0 1px rgba(220,38,38,0.25)",
              }}
            >
              {/* Subtle snow particles */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                {SNOW.slice(0, 6).map((s) => (
                  <span key={s.id} className="animate-snow absolute rounded-full bg-white/40"
                    style={{ left: s.left, top: 0, width: s.size, height: s.size,
                      "--dur": s.dur, "--sx": s.sx, "--drift": s.drift, animationDelay: s.delay } as React.CSSProperties} />
                ))}
              </div>
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
                <Lock className="h-6 w-6 text-red-300" strokeWidth={1.75} />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/80">Locked for Billy</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[14px] font-semibold text-white leading-snug">
                  Countdown: {Math.max(0, Math.ceil((new Date(surprisePots[0]?.eventIso ?? "2026-12-25T00:00:00Z").getTime() - Date.now()) / 86_400_000))} Days
                </p>
                <p className="text-[11px] text-red-200/70 mt-0.5">Givers: Tap to preview the magical unwrap ceremony</p>
              </div>
              <div className="relative shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-2">
                <Sparkles className="h-4 w-4 text-stone-900" strokeWidth={2} />
              </div>
            </motion.button>
          )}
        </section>

        {/* ── Contributor: See What the Receiver Sees toggle + Advantage panel ── */}
        {isContributor && (
          <section className="px-4 space-y-4">
            {/* Preview toggle */}
            <div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50 to-fuchsia-50">
              <div className="h-[3px] w-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400" />
              <div className="p-4">
                <button
                  onClick={() => setPreviewReceiver((v) => !v)}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-violet-500" strokeWidth={2} />
                    <p className="text-[13px] font-semibold text-violet-700">See What Billy Sees</p>
                  </div>
                  <div className={cn(
                    "flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                    previewReceiver ? "bg-violet-500" : "bg-stone-200",
                  )}>
                    <motion.div
                      animate={{ x: previewReceiver ? 22 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className="h-5 w-5 rounded-full bg-white shadow"
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {previewReceiver && (
                    <motion.div
                      key="receiver-preview"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 360, damping: 34 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3">
                        <LockedPotCard
                          pot={surprisePots[0] ?? activePots[0]!}
                          onReveal={() => undefined}
                        />
                        <p className="mt-2 text-[11px] leading-snug text-stone-500">
                          Billy sees a locked card with a heat bar and countdown — no amounts, no names, no spoilers.
                          <span className="font-semibold text-violet-600"> The magic stays intact until the big day.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Contributor Advantage panel */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 shadow-xl">
              <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500" />
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 mb-1">Contributor Advantage</p>
                <p style={{ fontFamily: "var(--font-display)" }} className="text-[16px] font-semibold text-white mb-3 leading-snug">
                  Why giving this way feels better
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { Icon: ShieldCheck, stat: "82%", label: "Zero Gift Anxiety", desc: "of contributors report zero gift-buying stress when using Kindled vs traditional shopping." },
                    { Icon: Wallet, stat: "0%", label: "Payout Fees", desc: "Every penny you kindle goes directly to the pot — no platform fees, no hidden charges." },
                    { Icon: Star, stat: "3×", label: "Emotional ROI", desc: "Group gifting creates 3× stronger memory bonds than solo gifts of the same monetary value." },
                  ].map(({ Icon, stat, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
                        <Icon className="h-4.5 w-4.5 text-amber-400" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span style={{ fontFamily: "var(--font-display)" }} className="text-[17px] font-bold text-amber-400">{stat}</span>
                          <span className="text-[12px] font-semibold text-white/80">{label}</span>
                        </div>
                        <p className="text-[10px] leading-snug text-white/50">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Claimed pots (owner view only) */}
        {!isContributor && claimedPots.length > 0 && (
          <section className="px-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">Ordered & Claimed</p>
            <div className="flex flex-col gap-2">
              {claimedPots.map((pot) => (
                <div key={pot.id} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-stone-700">{pot.title}</p>
                    {pot.claimedBy && <p className="text-[11px] text-emerald-600">{pot.claimedBy} — on its way!</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Would You Rather ── */}
        {!isContributor && <WouldYouRather />}

        {/* ── Kindled Stars entry — owner/kid admin only ── */}
        {!isContributor && (
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
                <Star key={i} className="absolute h-2.5 w-2.5 fill-white/70 text-white/70" style={{left:p.l,top:p.t,animation:`twinkle ${1.2+i*0.3}s ${i*0.4}s ease-in-out infinite alternate`,opacity:0.7}} />
              ))}
            </div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Sparkles className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200 mb-0.5">Kids Rewards</p>
                <h3 style={{ fontFamily: "var(--font-display)" }} className="text-[19px] font-semibold text-white leading-tight">Kindled Stars</h3>
                <p className="text-[12px] text-violet-200 mt-0.5">Billy&apos;s star chart · 4 adventures today</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-stone-900">Open →</span>
                <span className="flex items-center gap-1 text-[10px] text-violet-300"><Star className="h-2.5 w-2.5 fill-current" />24 earned</span>
              </div>
            </div>
          </motion.button>
        </section>
        )}

        {/* ── Catalogue — pot-creation tool, owner only ── */}
        {!isContributor && <CatalogueGrid onAdd={handleAddItem} />}

        {/* ── Explainer ── */}
        <ExplainerPlayer />

        {/* ── Why Kindled stats ── */}
        <WhyKindled />

        {/* ── Gifting Impact Panel (budget chart + metrics + simulator) ── */}
        <GiftingImpactPanel />

        {/* ── First Kindlers Creator Sign-up ── */}
        <FirstKindlersCTA />
      </main>

      {!isContributor && <InvestorHUD pots={pots} logEntries={logEntries} />}
      </>}
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
