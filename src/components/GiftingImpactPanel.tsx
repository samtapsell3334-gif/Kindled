"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Brain, Leaf, RotateCcw, Banknote, TrendingUp } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// HOOKS
// ──────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1 — EVENT STACKING CALCULATOR
// ──────────────────────────────────────────────────────────────────────────────

const MILESTONES = [
  { value: 150,  label: "AirPods Pro" },
  { value: 350,  label: "Keyboard" },
  { value: 600,  label: "LEGO Falcon" },
  { value: 900,  label: "Velvet Sofa" },
  { value: 1500, label: "MacBook Air" },
];

const EVENTS = [
  { label: "Birthday 1",  short: "B1", letter: "B", color: "#f59e0b" },
  { label: "Christmas 1", short: "C1", letter: "C", color: "#ef4444" },
  { label: "Birthday 2",  short: "B2", letter: "B", color: "#f59e0b" },
  { label: "Christmas 2", short: "C2", letter: "C", color: "#ef4444" },
  { label: "Birthday 3",  short: "B3", letter: "B", color: "#f59e0b" },
  { label: "Christmas 3", short: "C3", letter: "C", color: "#ef4444" },
];

function StackingChart({
  contributors,
  avgContrib,
}: {
  contributors: number;
  avgContrib: number;
}) {
  const W = 340, H = 190;
  const PAD = { t: 18, r: 20, b: 40, l: 52 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const perEvent = contributors * avgContrib;
  const kindledVals = EVENTS.map((_, i) => perEvent * (i + 1));
  const maxVal = Math.max(kindledVals[kindledVals.length - 1]!, 400);

  // Scale helpers
  const xS = (i: number) => PAD.l + (i / (EVENTS.length - 1)) * cW;
  const yS = (v: number) => PAD.t + cH - (Math.min(v, maxVal) / maxVal) * cH;

  // Build kindled polyline points
  const kindledPts = EVENTS.map((_, i) => ({ x: xS(i), y: yS(kindledVals[i]!) }));

  function ptsToCurve(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1]!;
      const p1 = pts[i]!;
      const cpx = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${cpx} ${p0.y.toFixed(1)} ${cpx} ${p1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  }

  // Flat "traditional" — what you get from a single avg gift each time (no pool)
  const tradPts = EVENTS.map((_, i) => ({ x: xS(i), y: yS(avgContrib) }));

  const kindledPath = ptsToCurve(kindledPts);
  const tradPath = ptsToCurve(tradPts);

  // Area fill under kindled
  const kindledArea = `${kindledPath} L ${xS(EVENTS.length - 1).toFixed(1)} ${yS(0).toFixed(1)} L ${xS(0).toFixed(1)} ${yS(0).toFixed(1)} Z`;

  // Which milestones are visible on this scale?
  const visibleMilestones = MILESTONES.filter((m) => m.value <= maxVal * 1.05);

  // Find which event first hits each milestone
  const milestoneHits = MILESTONES.map((m) => ({
    ...m,
    eventIdx: kindledVals.findIndex((v) => v >= m.value),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="esc-kindled-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
        </linearGradient>
        <filter id="esc-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="esc-dot-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Milestone horizontal reference lines */}
      {visibleMilestones.map((m) => {
        const y = yS(m.value);
        return (
          <g key={m.value}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
            <text x={PAD.l - 4} y={y + 3.5} textAnchor="end"
              fill="rgba(255,255,255,0.25)" fontSize="7.5">
              £{m.value >= 1000 ? `${m.value / 1000}k` : m.value}
            </text>
          </g>
        );
      })}

      {/* X axis base */}
      <line x1={PAD.l} x2={W - PAD.r} y1={yS(0)} y2={yS(0)}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* X axis event labels */}
      {EVENTS.map((ev, i) => (
        <g key={ev.short}>
          <circle cx={xS(i)} cy={H - 24} r="7" fill={ev.color} fillOpacity="0.22" />
          <text x={xS(i)} y={H - 21} textAnchor="middle"
            fill={ev.color} fontSize="8.5" fontWeight="bold">
            {ev.letter}
          </text>
          <text x={xS(i)} y={H - 9} textAnchor="middle"
            fill="rgba(255,255,255,0.28)" fontSize="7">
            {ev.short}
          </text>
        </g>
      ))}

      {/* Traditional flat line */}
      <path d={tradPath} fill="none" stroke="rgba(239,68,68,0.5)"
        strokeWidth="1.5" strokeDasharray="4,3" />

      {/* Area fill under kindled */}
      <path d={kindledArea} fill="url(#esc-kindled-grad)" />

      {/* Kindled curve */}
      <path d={kindledPath} fill="none" stroke="#f59e0b" strokeWidth="2.5"
        filter="url(#esc-glow)" />

      {/* Milestone hit dots + labels */}
      {milestoneHits.filter((m) => m.eventIdx >= 0).map((m) => {
        const x = xS(m.eventIdx);
        const y = yS(m.value);
        const flipLabel = x > W - PAD.r - 50;
        return (
          <g key={m.value}>
            <circle cx={x} cy={y} r="5" fill="#f59e0b" stroke="#1a0e00" strokeWidth="1.5"
              filter="url(#esc-dot-glow)" />
            <text
              x={flipLabel ? x - 7 : x + 7}
              y={y - 5}
              textAnchor={flipLabel ? "end" : "start"}
              fill="#fbbf24" fontSize="8.5" fontWeight="bold"
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Kindled dots on each event */}
      {kindledPts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f59e0b" stroke="#1a0e00" strokeWidth="1.2" />
      ))}

      {/* Value labels at each event (kindled) */}
      {kindledPts.map((pt, i) => {
        const v = kindledVals[i]!;
        const flip = pt.x > W - PAD.r - 30;
        return (
          <text key={i}
            x={flip ? pt.x - 5 : pt.x + 5}
            y={pt.y - 6}
            textAnchor={flip ? "end" : "start"}
            fill="rgba(255,255,255,0.45)" fontSize="7.5"
          >
            £{v.toLocaleString()}
          </text>
        );
      })}

      {/* Legend */}
      <circle cx={PAD.l} cy={H - 2} r="3" fill="#f59e0b" />
      <text x={PAD.l + 7} y={H + 1} fill="rgba(255,255,255,0.4)" fontSize="7.5">Kindled pool (cumulative)</text>
      <circle cx={W / 2 + 14} cy={H - 2} r="3" fill="rgba(239,68,68,0.6)" />
      <text x={W / 2 + 21} y={H + 1} fill="rgba(255,255,255,0.4)" fontSize="7.5">Single avg gift</text>
    </svg>
  );
}

function EventStackingCalculator() {
  const [contributors, setContributors] = useState(8);
  const [avgContrib, setAvgContrib] = useState(25);

  const perEvent = contributors * avgContrib;

  const nextMilestone = MILESTONES.find((m) => m.value > perEvent) ?? MILESTONES[MILESTONES.length - 1]!;
  const eventsNeeded = Math.ceil(nextMilestone.value / perEvent);

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-sm">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/75 mb-1">Interactive</p>
        <h3 className="text-[18px] font-semibold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          What could your pot really unlock?
        </h3>
        <p className="text-[11px] text-white/35 mt-1">
          Set your household&apos;s usual contributor count and average spend to see what stacks across events
        </p>
      </div>

      {/* Sliders */}
      <div className="mb-4 space-y-4">
        {/* Contributor count */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-white/50">People who usually buy for you</label>
            <span className="text-[14px] font-black text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
              {contributors}
            </span>
          </div>
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
            <div
              className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-75"
              style={{ width: `${((contributors - 3) / 17) * 100}%` }}
            />
            <input
              type="range" min={3} max={20} step={1} value={contributors}
              onChange={(e) => setContributors(Number(e.target.value))}
              className="gip-slider absolute inset-0 w-full cursor-pointer opacity-0"
              aria-label="Number of contributors"
            />
            <div
              className="absolute h-5 w-5 rounded-full bg-amber-400 shadow-lg shadow-amber-900/50 pointer-events-none transition-all duration-75"
              style={{ left: `calc(${((contributors - 3) / 17) * 100}% - 10px)` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/25">3 people</span>
            <span className="text-[9px] text-white/25">20 people</span>
          </div>
        </div>

        {/* Avg contribution */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-white/50">Average contribution per person</label>
            <span className="text-[14px] font-black text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
              £{avgContrib}
            </span>
          </div>
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
            <div
              className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-75"
              style={{ width: `${((avgContrib - 10) / 50) * 100}%` }}
            />
            <input
              type="range" min={10} max={60} step={5} value={avgContrib}
              onChange={(e) => setAvgContrib(Number(e.target.value))}
              className="gip-slider absolute inset-0 w-full cursor-pointer opacity-0"
              aria-label="Average contribution"
            />
            <div
              className="absolute h-5 w-5 rounded-full bg-violet-400 shadow-lg shadow-violet-900/50 pointer-events-none transition-all duration-75"
              style={{ left: `calc(${((avgContrib - 10) / 50) * 100}% - 10px)` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-white/25">£10</span>
            <span className="text-[9px] text-white/25">£60</span>
          </div>
        </div>
      </div>

      {/* Per-event summary pill */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 px-4 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-amber-300">
            £{perEvent.toLocaleString()} kindled per event
          </p>
          <p className="text-[10px] text-amber-400/60">
            {nextMilestone.label} unlocked after just {eventsNeeded} event{eventsNeeded !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="overflow-hidden rounded-2xl bg-white/[0.03] px-2 pt-2 pb-0">
        <StackingChart contributors={contributors} avgContrib={avgContrib} />
      </div>

      <p className="mt-2.5 text-center text-[9.5px] text-white/25 leading-relaxed">
        Red dashed line = single average gift (no pooling). Amber = Kindled cumulative pot across events.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2 — IMPACT METRIC TILES
// ──────────────────────────────────────────────────────────────────────────────

interface MetricDef {
  stat: number;
  displayOverride?: string;
  label: string;
  copy: string;
  source: string;
  Icon: LucideIcon;
  accent: string;
  glow: string;
  bg: string;
  border: string;
}

const METRICS: MetricDef[] = [
  {
    stat: 78, label: "Suffer Gift Anxiety",
    Icon: Brain,
    copy: "Around 78% of UK adults feel stressed when buying gifts — worried about getting it wrong, duplicating, or overspending. An approved list removes all of that.",
    source: "YouGov UK, 2023",
    accent: "#fb923c", glow: "rgba(251,146,60,0.4)",
    bg: "from-orange-950/80 to-amber-950/50",
    border: "border-amber-500/20",
  },
  {
    stat: 30, label: "Seasonal Packaging Waste",
    Icon: Leaf,
    copy: "UK waste volumes spike by around 30% in December, driven by packaging and returns. Coordinated gifting reduces unnecessary purchasing — and the packaging that comes with it.",
    source: "WRAP UK, 2022",
    accent: "#34d399", glow: "rgba(52,211,153,0.4)",
    bg: "from-emerald-950/80 to-teal-950/50",
    border: "border-emerald-500/20",
  },
  {
    stat: 20, label: "Gifts Duplicated or Returned",
    Icon: RotateCcw,
    copy: "Around 1 in 5 gifts are duplicates, wrong size, or returned. Real-time claim locking on Kindled means every contribution is unique — no two people can buy the same item.",
    source: "YouGov UK Gift Survey, 2023",
    accent: "#a78bfa", glow: "rgba(167,139,250,0.4)",
    bg: "from-violet-950/80 to-purple-950/50",
    border: "border-violet-500/20",
  },
  {
    stat: 32, displayOverride: "£3.2B", label: "Spent on Unwanted UK Gifts",
    Icon: Banknote,
    copy: "An estimated £3.2 Billion is spent on unwanted gifts in the UK each year. Kindled aims to redirect a share of this toward meaningful, receiver-approved milestones.",
    source: "OnePoll / Halifax Bank, 2023",
    accent: "#fbbf24", glow: "rgba(251,191,36,0.4)",
    bg: "from-yellow-950/80 to-amber-950/50",
    border: "border-yellow-500/20",
  },
  {
    stat: 65, label: "Overspend at Christmas",
    Icon: TrendingUp,
    copy: "Around 65% of UK shoppers spend more than planned over the holidays, often out of panic. Kindled normalises comfortable £15–£20 contributions that add up to something meaningful.",
    source: "Money & Pensions Service, 2022",
    accent: "#60a5fa", glow: "rgba(96,165,250,0.4)",
    bg: "from-blue-950/80 to-sky-950/50",
    border: "border-blue-500/20",
  },
];

function MetricTile({ metric, delay = 0 }: { metric: MetricDef; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(metric.stat, inView);
  const display = metric.displayOverride ?? `${count}%`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-transform duration-200 cursor-default",
        `bg-gradient-to-br ${metric.bg}`,
        metric.border,
        hovered && "scale-[1.025]",
      )}
      style={{ boxShadow: hovered ? `0 0 26px ${metric.glow}, 0 8px 28px rgba(0,0,0,0.5)` : "0 2px 14px rgba(0,0,0,0.35)" }}
    >
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-400"
        style={{ background: metric.accent, opacity: hovered ? 0.3 : 0.12 }}
      />
      <div className="relative z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${metric.accent}22` }}>
          <metric.Icon className="h-5 w-5" style={{ color: metric.accent }} />
        </div>
        <p
          className="mt-3 text-[36px] font-black leading-none"
          style={{ color: metric.accent, fontFamily: "var(--font-display)" }}
        >
          {display}
        </p>
        <p className="mt-1 text-[12px] font-bold text-white/85">{metric.label}</p>
        <p className="mt-2 text-[10px] text-white/42 leading-relaxed">{metric.copy}</p>
        <p className="mt-2 text-[8.5px] text-white/22 italic">Source: {metric.source}</p>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3 — MILESTONE STACKING SIMULATOR (£900 sofa)
// ──────────────────────────────────────────────────────────────────────────────

type SimState = "idle" | "merging" | "merged";

interface Particle { id: number; angle: number; dist: number; emoji: string }
// Burst uses colored CSS dots rather than emoji
const BURST_COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#f97316", "#fde68a", "#fed7aa"];

function MilestoneSimulator() {
  const [state, setState] = useState<SimState>("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SOFA_GOAL = 900;
  const birthdayRaised = Math.round(SOFA_GOAL * 0.25);  // £225
  const christmasRaised = Math.round(SOFA_GOAL * 0.20); // £180
  const combined = birthdayRaised + christmasRaised;     // £405
  const combinedPct = Math.round((combined / SOFA_GOAL) * 100); // 45%

  const merge = useCallback(() => {
    if (state !== "idle") return;
    setState("merging");
    setParticles(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        angle: (i / 16) * 360,
        dist: 42 + (i % 5) * 14,
        emoji: BURST_COLORS[i % BURST_COLORS.length]!,
      }))
    );
    timerRef.current = setTimeout(() => {
      setState("merged");
      setParticles([]);
    }, 650);
  }, [state]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState("idle");
    setParticles([]);
  }, []);

  const stillNeeded = SOFA_GOAL - combined;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-sm">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/75 mb-1">Simulator</p>
        <h3 className="text-[18px] font-semibold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Milestone Stacking
        </h3>
        <p className="text-[11px] text-white/35 mt-1">Combine pots across events to unlock bigger dreams, faster</p>
      </div>

      <AnimatePresence mode="wait">
        {state !== "merged" ? (
          <motion.div key="pots" exit={{ opacity: 0, scale: 0.9, y: -8 }} transition={{ duration: 0.22 }}>
            {/* Birthday Pot */}
            <motion.div
              animate={{
                borderColor: state === "merging" ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)",
                backgroundColor: state === "merging" ? "rgba(120,53,15,0.4)" : "rgba(255,255,255,0.03)",
              }}
              transition={{ duration: 0.4 }}
              className="mb-3 rounded-2xl border p-3.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[12px] font-bold text-white">Clara&apos;s Birthday Pot</p>
                  <p className="text-[10px] text-white/40">October · Velvet Sofa · £{SOFA_GOAL}</p>
                </div>
                <span className="text-[14px] font-black text-amber-400" style={{ fontFamily: "var(--font-display)" }}>25%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  animate={{ width: state === "merging" ? `${combinedPct}%` : "25%" }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/35">£{birthdayRaised} raised</p>
            </motion.div>

            {/* Christmas Pot */}
            <motion.div
              animate={{
                borderColor: state === "merging" ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)",
                backgroundColor: state === "merging" ? "rgba(120,53,15,0.4)" : "rgba(255,255,255,0.03)",
              }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mb-4 rounded-2xl border p-3.5"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[12px] font-bold text-white">Clara&apos;s Christmas Pot</p>
                  <p className="text-[10px] text-white/40">December · Velvet Sofa · £{SOFA_GOAL}</p>
                </div>
                <span className="text-[14px] font-black text-violet-400" style={{ fontFamily: "var(--font-display)" }}>20%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                  animate={{ width: state === "merging" ? `${combinedPct}%` : "20%" }}
                  transition={{ duration: 0.45, ease: "easeInOut", delay: 0.1 }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/35">£{christmasRaised} raised</p>
            </motion.div>

            <div className="relative">
              <motion.button
                whileHover={state === "idle" ? { scale: 1.02, y: -1 } : {}}
                whileTap={state === "idle" ? { scale: 0.96 } : {}}
                onClick={merge}
                disabled={state === "merging"}
                className={cn(
                  "relative w-full overflow-visible rounded-2xl py-3.5 text-[14px] font-bold transition-all duration-300",
                  state === "merging"
                    ? "bg-amber-400/25 text-amber-300/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900 shadow-xl shadow-amber-900/35",
                )}
              >
                {state === "merging" ? "Combining…" : "Combine Birthday & Christmas Pots"}
                <AnimatePresence>
                  {particles.map((p) => {
                    const rad = (p.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * p.dist;
                    const ty = Math.sin(rad) * p.dist - 20;
                    return (
                      <motion.div
                        key={p.id}
                        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                        style={{ width: 6 + (p.id % 3) * 3, height: 6 + (p.id % 3) * 3, background: p.emoji }}
                        initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
                        animate={{ x: `calc(-50% + ${tx}px)`, y: `calc(-50% + ${ty}px)`, scale: 0, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.button>
              <p className="mt-2 text-center text-[10px] text-white/30">
                Stack toward a £{SOFA_GOAL} velvet sofa — just £{stillNeeded} more to go
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="merged"
            initial={{ opacity: 0, scale: 0.86, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
          >
            {/* Super-Pot */}
            <div
              className="mb-4 rounded-2xl border border-amber-400/55 bg-amber-950/45 p-4"
              style={{ boxShadow: "0 0 32px rgba(251,191,36,0.22)" }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.15 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400"
                    >
                      <TrendingUp className="h-3 w-3 text-stone-900" />
                    </motion.div>
                    <p className="text-[13px] font-black text-white">Clara&apos;s Super-Pot</p>
                  </div>
                  <p className="text-[10px] text-amber-300/65">Birthday + Christmas combined</p>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.25 }}
                  className="text-[22px] font-black text-amber-400"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {combinedPct}%
                </motion.span>
              </div>
              <div className="h-4 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${combinedPct}%` }}
                  transition={{ duration: 0.75, ease: "easeOut", delay: 0.15 }}
                  style={{ boxShadow: "0 0 12px rgba(251,191,36,0.55)" }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-[10px] text-amber-300/55">£{combined} raised</p>
                <p className="text-[10px] text-white/35">£{stillNeeded} to go</p>
              </div>
            </div>

            {/* Sofa image */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, type: "spring", stiffness: 320, damping: 28 }}
              className="mb-4 overflow-hidden rounded-2xl border border-white/10"
            >
              <div className="relative h-28">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop&q=80"
                  alt="Velvet Sofa"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                <div className="absolute inset-0 flex items-center px-4">
                  <div>
                    <p className="text-[13px] font-bold text-white">🛋️ Velvet Sofa</p>
                    <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      £{SOFA_GOAL} · £{stillNeeded} still needed
                    </p>
                    <div className="mt-1.5 h-2 w-36 rounded-full bg-white/15 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-amber-400"
                        initial={{ width: "0%" }}
                        animate={{ width: `${combinedPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mb-4 text-center text-[12px] text-white/45 leading-relaxed px-2"
            >
              One more event — a few more people giving £{Math.ceil(stillNeeded / 8)} each and the sofa is Clara&apos;s.
            </motion.p>

            <button
              onClick={reset}
              className="w-full rounded-2xl border border-white/10 py-2.5 text-[12px] font-semibold text-white/40 transition-colors hover:text-white/70 active:scale-95"
            >
              ↩ Reset demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ──────────────────────────────────────────────────────────────────────────────

export function GiftingImpactPanel() {
  return (
    <section className="relative overflow-hidden mx-0">
      <div
        className="relative bg-[#0d0b12] px-4 pt-9 pb-10"
        style={{ boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-52 w-52 rounded-full bg-amber-500/6 blur-3xl" />
          <div className="absolute top-1/2 -right-20 h-44 w-44 rounded-full bg-violet-500/6 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="mb-7 text-center"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/65 mb-2">The numbers</p>
            <h2 className="text-[26px] font-semibold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Gifting, reinvented
            </h2>
            <p className="mt-2 text-[13px] text-white/38 leading-relaxed max-w-[280px] mx-auto">
              See what your circle could really unlock — and the industry problem we&apos;re solving.
            </p>
          </motion.div>

          {/* Section 1: Event Stacking Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="mb-6"
          >
            <EventStackingCalculator />
          </motion.div>

          {/* Section 2: Metric tiles */}
          <div className="mb-6">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3"
            >
              Industry context
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((m, i) => (
                <div key={m.label} className={cn(i === 4 && "col-span-2")}>
                  <MetricTile metric={m} delay={i * 0.07} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[9px] text-white/20 leading-relaxed px-2">
              * All statistics are approximate figures from third-party consumer research. Sources listed on each card. Kindled&apos;s platform impact will be independently tracked post-launch.
            </p>
          </div>

          {/* Section 3: Milestone simulator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <MilestoneSimulator />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
