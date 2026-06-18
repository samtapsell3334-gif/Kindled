"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

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
// SECTION 1 — BUDGET SLIDER CHART
// ──────────────────────────────────────────────────────────────────────────────

function BudgetSvg({ budget }: { budget: number }) {
  const W = 340, H = 180;
  const PAD = { t: 20, r: 18, b: 34, l: 48 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const MIN = 100, MAX = 2000;

  const xS = (v: number) => PAD.l + ((v - MIN) / (MAX - MIN)) * cW;
  const yS = (v: number) => PAD.t + cH - (Math.min(v, MAX) / MAX) * cH;

  function makePath(fn: (b: number) => number, n = 28): string {
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const b = MIN + (i / n) * (MAX - MIN);
      return { x: xS(b), y: yS(fn(b)) };
    });
    const first = pts[0]!;
    let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1]!;
      const p1 = pts[i]!;
      const cpx = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${cpx} ${p0.y.toFixed(1)} ${cpx} ${p1.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  }

  function makeArea(fn: (b: number) => number): string {
    return `${makePath(fn)} L ${xS(MAX).toFixed(1)} ${yS(0).toFixed(1)} L ${xS(MIN).toFixed(1)} ${yS(0).toFixed(1)} Z`;
  }

  const kindPath = makePath((b) => b);
  const tradPath = makePath((b) => b * 0.25);

  const cx = xS(budget);
  const cyKind = yS(budget);
  const cyTrad = yS(budget * 0.25);
  const flipLabel = cx > W - PAD.r - 55;
  const showGlow = budget > 300;

  const yTicks = [500, 1000, 1500, 2000];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="gip-kind-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gip-trad-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
        </linearGradient>
        <filter id="gip-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="gip-dot-glow">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.l} x2={W - PAD.r} y1={yS(tick)} y2={yS(tick)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.l - 5} y={yS(tick) + 3.5} textAnchor="end"
            fill="rgba(255,255,255,0.22)" fontSize="8">
            £{tick >= 1000 ? `${tick / 1000}k` : tick}
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={yS(0)} y2={yS(0)}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {[500, 1000, 1500, 2000].map((tick) => (
        <text key={tick} x={xS(tick)} y={H - 4} textAnchor="middle"
          fill="rgba(255,255,255,0.22)" fontSize="7.5">
          £{tick >= 1000 ? `${tick / 1000}k` : tick}
        </text>
      ))}

      {/* Area fills */}
      <path d={makeArea((b) => b)} fill="url(#gip-kind-area)" />
      <path d={makeArea((b) => b * 0.25)} fill="url(#gip-trad-area)" />

      {/* Loss zone between curves at current budget */}
      <rect
        x={PAD.l} y={cyKind}
        width={cx - PAD.l} height={Math.max(0, cyTrad - cyKind)}
        fill="rgba(239,68,68,0.07)"
      />

      {/* Lines */}
      <path d={tradPath} fill="none" stroke="#ef4444" strokeWidth="1.8"
        strokeOpacity="0.55" strokeDasharray="5,3" />
      <path d={kindPath} fill="none" stroke="#f59e0b" strokeWidth="2.5"
        filter={showGlow ? "url(#gip-glow)" : undefined} />

      {/* Current position marker */}
      <line x1={cx} x2={cx} y1={PAD.t} y2={yS(0)}
        stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />

      {/* Dots */}
      <circle cx={cx} cy={cyTrad} r="3.5" fill="#ef4444" stroke="#111" strokeWidth="1.5" />
      <circle cx={cx} cy={cyKind} r="5.5" fill="#f59e0b" stroke="#111" strokeWidth="2"
        filter={showGlow ? "url(#gip-dot-glow)" : undefined} />

      {/* Value labels */}
      {flipLabel ? (
        <>
          <text x={cx - 8} y={cyKind - 5} textAnchor="end" fill="#fbbf24" fontSize="10" fontWeight="bold">£{budget.toLocaleString()}</text>
          <text x={cx - 8} y={cyTrad + 13} textAnchor="end" fill="#f87171" fontSize="9">£{Math.round(budget * 0.25).toLocaleString()}</text>
        </>
      ) : (
        <>
          <text x={cx + 8} y={cyKind - 5} fill="#fbbf24" fontSize="10" fontWeight="bold">£{budget.toLocaleString()}</text>
          <text x={cx + 8} y={cyTrad + 13} fill="#f87171" fontSize="9">£{Math.round(budget * 0.25).toLocaleString()}</text>
        </>
      )}

      {/* Legend */}
      <circle cx={PAD.l} cy={H - 7} r="3" fill="#f59e0b" />
      <text x={PAD.l + 7} y={H - 4} fill="rgba(255,255,255,0.45)" fontSize="8">Kindled (100% value)</text>
      <circle cx={W / 2 + 16} cy={H - 7} r="3" fill="#ef4444" />
      <text x={W / 2 + 23} y={H - 4} fill="rgba(255,255,255,0.45)" fontSize="8">Traditional (25% value)</text>
    </svg>
  );
}

function BudgetSliderChart() {
  const [budget, setBudget] = useState(500);
  const showGlow = budget > 300;

  const lostClutter = Math.round(budget * 0.60);
  const lostReturns = Math.round(budget * 0.15);
  const actualValue = Math.round(budget * 0.25);

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-sm">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/75 mb-1">Interactive</p>
        <h3 className="text-[18px] font-semibold text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Where does your gifting budget really go?
        </h3>
        <p className="text-[11px] text-white/35 mt-1">Drag the slider to see how Kindled changes the equation</p>
      </div>

      {/* SVG Chart */}
      <div className="mb-3 overflow-hidden rounded-2xl bg-white/[0.03] p-2">
        <BudgetSvg budget={budget} />
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-white/50">Annual gifting budget</label>
          <span className="text-[14px] font-black text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
            £{budget.toLocaleString()}
          </span>
        </div>
        <div className="relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
          <div
            className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-75"
            style={{ width: `${((budget - 100) / 1900) * 100}%` }}
          />
          <input
            type="range" min={100} max={2000} step={25} value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="gip-slider absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label="Annual gifting budget"
          />
          <div
            className="absolute h-5 w-5 rounded-full bg-amber-400 shadow-lg shadow-amber-900/50 pointer-events-none transition-all duration-75"
            style={{ left: `calc(${((budget - 100) / 1900) * 100}% - 10px)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/25">£100</span>
          <span className="text-[9px] text-white/25">£2,000</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {/* Traditional */}
        <div className="rounded-2xl bg-red-950/50 border border-red-500/20 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/70 mb-2">Traditional route</p>
          <div className="space-y-1.5">
            {[
              { label: "Polite clutter", val: lostClutter, pct: 60, color: "bg-red-500/50" },
              { label: "Returns & friction", val: lostReturns, pct: 15, color: "bg-red-400/35" },
              { label: "Actual utility", val: actualValue, pct: 25, color: "bg-emerald-500/60" },
            ].map(({ label, val, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[8.5px] text-white/45">{label}</span>
                  <span className="text-[8.5px] font-bold text-white/60">£{val.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/6">
                  <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kindled */}
        <motion.div
          animate={{
            borderColor: showGlow ? "rgba(251,191,36,0.45)" : "rgba(255,255,255,0.1)",
            backgroundColor: showGlow ? "rgba(120,53,15,0.45)" : "rgba(255,255,255,0.03)",
          }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border p-3"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80 mb-2">Kindled route</p>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[8.5px] text-white/45">Full milestone value</span>
                <span className="text-[8.5px] font-bold text-amber-400">£{budget.toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/6">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </div>
            <p className="text-[8.5px] text-amber-300/60 leading-relaxed mt-1">Every £ goes to what they actually want.</p>
          </div>
          <AnimatePresence>
            {showGlow && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="mt-2 rounded-xl bg-amber-400/12 border border-amber-400/30 px-2 py-1.5"
              >
                <p className="text-[9px] font-bold text-amber-300">✨ Venture Stacking Active</p>
                <p className="text-[8px] text-amber-400/65 mt-0.5">Small contributions unlock £{budget}+ milestones</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
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
  icon: string;
  accent: string;
  glow: string;
  bg: string;
  border: string;
}

const METRICS: MetricDef[] = [
  {
    stat: 82, label: "Anxiety Shield",
    icon: "😌",
    copy: "82% of gift-givers suffer from selection anxiety. An approved list with direct payment access reduces this to zero.",
    accent: "#fb923c", glow: "rgba(251,146,60,0.4)",
    bg: "from-orange-950/80 to-amber-950/50",
    border: "border-amber-500/20",
  },
  {
    stat: 30, label: "Waste Eliminated",
    icon: "🌍",
    copy: "Household waste spikes 30% over the holidays. Kindled matches purchases to exact demand — retail duplicates drop to zero.",
    accent: "#34d399", glow: "rgba(52,211,153,0.4)",
    bg: "from-emerald-950/80 to-teal-950/50",
    border: "border-emerald-500/20",
  },
  {
    stat: 100, label: "Duplicate Erasure",
    icon: "🔒",
    copy: "1 in 5 gifts are duplicates or instantly returned. Our real-time ledger eliminates duplicate buying entirely.",
    accent: "#a78bfa", glow: "rgba(167,139,250,0.4)",
    bg: "from-violet-950/80 to-purple-950/50",
    border: "border-violet-500/20",
  },
  {
    stat: 32, displayOverride: "£3.2B", label: "Capital Reclaimed",
    icon: "💷",
    copy: "Over £3.2 Billion wasted annually on unwanted UK gifts. Kindled redirects this into milestones that actually matter.",
    accent: "#fbbf24", glow: "rgba(251,191,36,0.4)",
    bg: "from-yellow-950/80 to-amber-950/50",
    border: "border-yellow-500/20",
  },
  {
    stat: 65, label: "Budget Control",
    icon: "📊",
    copy: "65% of shoppers overspend and go into debt from panic buying. Kindled normalises comfortable £15–£20 pooled contributions with huge collective impact.",
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
      {/* Glow orb */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-400"
        style={{ background: metric.accent, opacity: hovered ? 0.3 : 0.12 }}
      />
      <div className="relative z-10">
        <span className="text-[22px]">{metric.icon}</span>
        <p
          className="mt-2 text-[36px] font-black leading-none"
          style={{ color: metric.accent, fontFamily: "var(--font-display)" }}
        >
          {display}
        </p>
        <p className="mt-1 text-[12px] font-bold text-white/85">{metric.label}</p>
        <p className="mt-2 text-[10px] text-white/42 leading-relaxed">{metric.copy}</p>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3 — MILESTONE STACKING SIMULATOR
// ──────────────────────────────────────────────────────────────────────────────

type SimState = "idle" | "merging" | "merged";

interface Particle { id: number; angle: number; dist: number; emoji: string }
const EMOJIS = ["⭐", "✨", "🌟", "💫", "🔥", "🎉"];

function MilestoneSimulator() {
  const [state, setState] = useState<SimState>("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const merge = useCallback(() => {
    if (state !== "idle") return;
    setState("merging");
    setParticles(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        angle: (i / 16) * 360,
        dist: 40 + Math.random() * 50,
        emoji: EMOJIS[i % EMOJIS.length]!,
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
            {/* Pot A */}
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
                  <p className="text-[12px] font-bold text-white">🎂 Clara&apos;s Birthday Pot</p>
                  <p className="text-[10px] text-white/40">October · Mechanical Keyboard</p>
                </div>
                <span className="text-[14px] font-black text-amber-400" style={{ fontFamily: "var(--font-display)" }}>30%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  animate={{ width: state === "merging" ? "50%" : "30%" }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/35">£105 raised · £245 to go</p>
            </motion.div>

            {/* Pot B */}
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
                  <p className="text-[12px] font-bold text-white">🎄 Clara&apos;s Christmas Pot</p>
                  <p className="text-[10px] text-white/40">December · Mechanical Keyboard</p>
                </div>
                <span className="text-[14px] font-black text-violet-400" style={{ fontFamily: "var(--font-display)" }}>20%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                  animate={{ width: state === "merging" ? "50%" : "20%" }}
                  transition={{ duration: 0.45, ease: "easeInOut", delay: 0.1 }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/35">£70 raised · £280 to go</p>
            </motion.div>

            {/* Combine button */}
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
                {state === "merging" ? "✨ Combining…" : "🔄 Combine Birthday & Christmas Pots"}

                {/* Burst particles */}
                <AnimatePresence>
                  {particles.map((p) => {
                    const rad = (p.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * p.dist;
                    const ty = Math.sin(rad) * p.dist - 20;
                    return (
                      <motion.span
                        key={p.id}
                        className="pointer-events-none absolute left-1/2 top-1/2 select-none text-[14px]"
                        initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
                        animate={{ x: `calc(-50% + ${tx}px)`, y: `calc(-50% + ${ty}px)`, scale: 0, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      >
                        {p.emoji}
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </motion.button>

              <p className="mt-2 text-center text-[10px] text-white/30">Unlock £350 keyboard with combined contributions</p>
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
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.15 }}
                      className="text-[16px]"
                    >
                      🌟
                    </motion.span>
                    <p className="text-[13px] font-black text-white">Clara&apos;s Super-Pot!</p>
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
                  50%
                </motion.span>
              </div>

              <div className="h-4 w-full rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "50%" }}
                  transition={{ duration: 0.75, ease: "easeOut", delay: 0.15 }}
                  style={{ boxShadow: "0 0 12px rgba(251,191,36,0.55)" }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-amber-300/55">£175 combined · £175 remaining</p>
            </div>

            {/* Product flash */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, type: "spring", stiffness: 320, damping: 28 }}
              className="mb-4 overflow-hidden rounded-2xl border border-white/10"
            >
              <div className="relative h-24">
                <img
                  src="https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=200&fit=crop&q=80"
                  alt="Mechanical Keyboard"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-transparent" />
                <div className="absolute inset-0 flex items-center px-4">
                  <div>
                    <p className="text-[13px] font-bold text-white">Mechanical Keyboard</p>
                    <p className="text-[11px] text-amber-400 font-semibold mt-0.5">£350 · Halfway unlocked 🎯</p>
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
              Just 6 more people giving £30 each unlocks Clara&apos;s dream. 🚀
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
              Traditional gifting wastes billions every year. Here&apos;s what changes when you kindle your list.
            </p>
          </motion.div>

          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="mb-6"
          >
            <BudgetSliderChart />
          </motion.div>

          {/* Section 2 */}
          <div className="mb-6">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3"
            >
              Impact metrics
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((m, i) => (
                <div key={m.label} className={cn(i === 4 && "col-span-2")}>
                  <MetricTile metric={m} delay={i * 0.07} />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
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
