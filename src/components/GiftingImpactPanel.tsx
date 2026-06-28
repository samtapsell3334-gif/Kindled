"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Brain, Leaf, RotateCcw, Banknote, TrendingUp,
  Sparkles, Users, Check, Sofa,
} from "lucide-react";

// ─── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1600) {
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

// ─── Data ──────────────────────────────────────────────────────────────────────
// ─── Metric tiles ───────────────────────────────────────────────────────────────
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
    stat: 78, label: "Feel gift anxiety",
    Icon: Brain,
    copy: "78% of UK adults feel stressed buying gifts — worried about getting it wrong, duplicating, or overspending. An approved list removes all of that.",
    source: "YouGov UK, 2023",
    accent: "#fb923c", glow: "rgba(251,146,60,0.4)",
    bg: "from-orange-950/80 to-amber-950/50", border: "border-amber-500/20",
  },
  {
    stat: 30, label: "Seasonal waste spike",
    Icon: Leaf,
    copy: "UK household waste rises 30% in December from packaging and unwanted returns. Coordinated gifting cuts this significantly.",
    source: "WRAP UK, 2022",
    accent: "#34d399", glow: "rgba(52,211,153,0.4)",
    bg: "from-emerald-950/80 to-teal-950/50", border: "border-emerald-500/20",
  },
  {
    stat: 20, label: "Gifts duplicated or returned",
    Icon: RotateCcw,
    copy: "1 in 5 gifts are duplicates or wrong size. Real-time claim locking on Kindled means every contribution is unique.",
    source: "YouGov UK, 2023",
    accent: "#a78bfa", glow: "rgba(167,139,250,0.4)",
    bg: "from-violet-950/80 to-purple-950/50", border: "border-violet-500/20",
  },
  {
    stat: 32, displayOverride: "£3.2B", label: "Spent on unwanted UK gifts",
    Icon: Banknote,
    copy: "£3.2 billion wasted on unwanted gifts in the UK each year. Kindled helps redirect this toward meaningful, receiver-approved milestones.",
    source: "OnePoll / Halifax Bank, 2023",
    accent: "#fbbf24", glow: "rgba(251,191,36,0.4)",
    bg: "from-yellow-950/80 to-amber-950/50", border: "border-yellow-500/20",
  },
  {
    stat: 65, label: "Overspend at Christmas",
    Icon: TrendingUp,
    copy: "65% of UK shoppers spend more than planned over the holidays. Kindled normalises comfortable £15–£20 contributions that add up meaningfully.",
    source: "Money & Pensions Service, 2022",
    accent: "#60a5fa", glow: "rgba(96,165,250,0.4)",
    bg: "from-blue-950/80 to-sky-950/50", border: "border-blue-500/20",
  },
];

function MetricTile({ metric, delay = 0 }: { metric: MetricDef; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [expanded, setExpanded] = useState(false);
  const count = useCountUp(metric.stat, inView);
  const display = metric.displayOverride ?? `${count}%`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay }}
      onClick={() => setExpanded(e => !e)}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        `bg-gradient-to-br ${metric.bg}`,
        metric.border,
      )}
      style={{ boxShadow: expanded ? `0 0 28px ${metric.glow}, 0 8px 28px rgba(0,0,0,0.55)` : "0 2px 12px rgba(0,0,0,0.3)" }}
    >
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300"
        style={{ background: metric.accent, opacity: expanded ? 0.32 : 0.1 }} />
      <div className="relative z-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${metric.accent}22` }}>
          <metric.Icon className="h-5 w-5" style={{ color: metric.accent }} />
        </div>
        <p className="mt-3 text-[38px] font-black leading-none"
          style={{ color: metric.accent, fontFamily: "var(--font-display)" }}>{display}</p>
        <p className="mt-0.5 text-[12px] font-bold text-white/85">{metric.label}</p>
        <AnimatePresence>
          {expanded && (
            <motion.div key="body"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
              <p className="mt-2 text-[11px] leading-relaxed text-white/50">{metric.copy}</p>
              <p className="mt-2 text-[9px] italic text-white/22">Source: {metric.source}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {!expanded && (
          <p className="mt-1 text-[10px] text-white/30">Tap to read more</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Milestone Simulator ────────────────────────────────────────────────────────
const BURST_COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#f97316", "#fde68a", "#fed7aa"];
interface Particle { id: number; angle: number; dist: number; color: string }
type SimState = "idle" | "merging" | "merged";

function MilestoneSimulator() {
  const [state, setState] = useState<SimState>("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SOFA_GOAL = 900;
  const birthdayRaised = 225;
  const christmasRaised = 180;
  const combined = birthdayRaised + christmasRaised;
  const pct = Math.round((combined / SOFA_GOAL) * 100);
  const stillNeeded = SOFA_GOAL - combined;

  const merge = useCallback(() => {
    if (state !== "idle") return;
    setState("merging");
    setParticles(Array.from({ length: 18 }, (_, i) => ({
      id: i, angle: (i / 18) * 360,
      dist: 40 + (i % 5) * 14,
      color: BURST_COLORS[i % BURST_COLORS.length]!,
    })));
    timerRef.current = setTimeout(() => { setState("merged"); setParticles([]); }, 650);
  }, [state]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState("idle");
    setParticles([]);
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
      <div className="mb-4">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">Simulator</p>
        <h3 style={{ fontFamily: "var(--font-display)" }}
          className="text-[20px] font-semibold leading-tight text-white">
          Stack pots across events
        </h3>
        <p className="mt-1 text-[12px] text-white/40">
          See how a birthday pot and Christmas pot combine toward a single big goal
        </p>
      </div>

      <AnimatePresence mode="wait">
        {state !== "merged" ? (
          <motion.div key="pots" exit={{ opacity: 0, scale: 0.92, y: -8 }} transition={{ duration: 0.22 }}>

            {/* Three info pills */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { Icon: Users, label: "8 contributors", color: "text-amber-400" },
                { Icon: Check, label: "£45 each event", color: "text-amber-400" },
                { Icon: Sparkles, label: "Stacks silently", color: "text-amber-400" },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 py-2.5">
                  <Icon className={cn("h-3.5 w-3.5", color)} strokeWidth={2} />
                  <span className="text-center text-[9px] font-semibold text-white/45 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Birthday Pot */}
            <motion.div
              animate={{ borderColor: state === "merging" ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.4 }}
              className="mb-3 rounded-2xl border p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-bold text-white">Clara&apos;s Birthday Pot</p>
                  <p className="text-[10px] text-white/35">October · Velvet Sofa · £{SOFA_GOAL} goal</p>
                </div>
                <span style={{ fontFamily: "var(--font-display)" }}
                  className="text-[18px] font-black text-amber-400">25%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  animate={{ width: state === "merging" ? `${pct}%` : "25%" }}
                  transition={{ duration: 0.45 }} />
              </div>
              <p className="mt-1.5 text-[10px] text-white/30">£{birthdayRaised} raised by 6 people</p>
            </motion.div>

            {/* Christmas Pot */}
            <motion.div
              animate={{ borderColor: state === "merging" ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.4, delay: 0.07 }}
              className="mb-5 rounded-2xl border p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-bold text-white">Clara&apos;s Christmas Pot</p>
                  <p className="text-[10px] text-white/35">December · Velvet Sofa · £{SOFA_GOAL} goal</p>
                </div>
                <span style={{ fontFamily: "var(--font-display)" }}
                  className="text-[18px] font-black text-violet-400">20%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                  animate={{ width: state === "merging" ? `${pct}%` : "20%" }}
                  transition={{ duration: 0.45, delay: 0.1 }} />
              </div>
              <p className="mt-1.5 text-[10px] text-white/30">£{christmasRaised} raised by 8 people</p>
            </motion.div>

            {/* Merge button */}
            <div className="relative">
              <motion.button
                whileHover={state === "idle" ? { scale: 1.02, y: -1 } : {}}
                whileTap={state === "idle" ? { scale: 0.96 } : {}}
                onClick={merge}
                disabled={state === "merging"}
                className={cn(
                  "relative w-full overflow-visible rounded-2xl py-4 text-[15px] font-bold transition-all duration-300",
                  state === "merging"
                    ? "bg-amber-400/25 text-amber-300/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900",
                )}
                style={state === "idle" ? { boxShadow: "0 8px 28px rgba(251,146,60,0.35)" } : {}}>
                {state === "merging" ? "Combining…" : "Combine Birthday + Christmas Pots"}
                <AnimatePresence>
                  {particles.map(p => {
                    const rad = (p.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * p.dist;
                    const ty = Math.sin(rad) * p.dist - 18;
                    return (
                      <motion.div key={p.id}
                        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
                        style={{ width: 6 + (p.id % 3) * 3, height: 6 + (p.id % 3) * 3, background: p.color }}
                        initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
                        animate={{ x: `calc(-50% + ${tx}px)`, y: `calc(-50% + ${ty}px)`, scale: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }} />
                    );
                  })}
                </AnimatePresence>
              </motion.button>
              <p className="mt-2 text-center text-[10px] text-white/30">
                £{birthdayRaised} + £{christmasRaised} = £{combined} · £{stillNeeded} more to reach the sofa
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="merged"
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}>

            {/* Super pot */}
            <div className="mb-4 rounded-2xl border border-amber-400/50 bg-amber-950/40 p-4"
              style={{ boxShadow: "0 0 32px rgba(251,191,36,0.2)" }}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-0.5 flex items-center gap-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.15 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400">
                      <TrendingUp className="h-3 w-3 text-stone-900" />
                    </motion.div>
                    <p className="text-[14px] font-black text-white">Clara&apos;s Super-Pot</p>
                  </div>
                  <p className="text-[10px] text-amber-300/60">Birthday + Christmas combined</p>
                </div>
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.25 }}
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[24px] font-black text-amber-400">{pct}%</motion.span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400"
                  initial={{ width: "0%" }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.75, ease: "easeOut", delay: 0.15 }}
                  style={{ boxShadow: "0 0 12px rgba(251,191,36,0.55)" }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] font-bold text-amber-300">£{combined} raised</p>
                <p className="text-[10px] text-white/35">£{stillNeeded} still needed</p>
              </div>
            </div>

            {/* Sofa visual */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 320, damping: 28 }}
              className="mb-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="relative h-32">
                <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=220&fit=crop&q=80"
                  alt="Velvet Sofa" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/20" />
                <div className="absolute inset-0 flex items-center px-4">
                  <div>
                    <div className="mb-0.5 flex items-center gap-2">
                      <Sofa className="h-4 w-4 text-amber-300" strokeWidth={2} />
                      <p className="text-[14px] font-bold text-white">Velvet Sofa</p>
                    </div>
                    <p className="text-[12px] font-semibold text-amber-400">£{SOFA_GOAL} goal · £{stillNeeded} to go</p>
                    <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-white/15">
                      <motion.div className="h-full rounded-full bg-amber-400"
                        initial={{ width: "0%" }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }} />
                    </div>
                    <p className="mt-1 text-[10px] text-white/45">One more event to go</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="mb-4 text-center text-[12px] leading-relaxed text-white/40 px-2">
              One more Christmas — just £{Math.ceil(stillNeeded / 8)} each from those 8 people and the sofa is Clara&apos;s.
            </motion.p>

            <button onClick={reset}
              className="w-full rounded-2xl border border-white/10 py-3 text-[12px] font-semibold text-white/40 transition-colors hover:text-white/70">
              Reset demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────
export function GiftingImpactPanel() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative bg-[#0d0b12] px-4 pt-9 pb-10"
        style={{ boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)" }}>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-52 w-52 rounded-full bg-amber-500/6 blur-3xl" />
          <div className="absolute top-1/2 -right-20 h-44 w-44 rounded-full bg-violet-500/6 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="mb-7 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-400/65">The numbers</p>
            <h2 style={{ fontFamily: "var(--font-display)" }}
              className="text-[26px] font-semibold leading-tight text-white">
              Gifting, reinvented
            </h2>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-white/38">
              See what your circle could really unlock — and the industry problem we&apos;re solving.
            </p>
          </motion.div>

          {/* Metric tiles */}
          <div className="mb-6">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
              Industry context — tap to expand
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((m, i) => (
                <div key={m.label} className={cn(i === 4 && "col-span-2")}>
                  <MetricTile metric={m} delay={i * 0.07} />
                </div>
              ))}
            </div>
            <p className="mx-2 mt-3 text-center text-[8.5px] leading-relaxed text-white/18">
              Sources: YouGov UK · WRAP UK Waste Studies · Money &amp; Pensions Service · OnePoll / Halifax Bank. Approximate figures from third-party consumer research.
            </p>
          </div>

          {/* Section 4: Simulator */}
          <motion.div initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}>
            <MilestoneSimulator />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
