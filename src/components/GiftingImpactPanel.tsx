"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Brain, Leaf, RotateCcw, Banknote, TrendingUp,
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
    stat: 58, label: "Have received an unwanted gift",
    Icon: Brain,
    copy: "3 in 5 Brits (58%) have received an unwanted gift. That's around 31 million adults. An approved list removes the guesswork.",
    source: "Finder UK unwanted-gifts research, 2025",
    accent: "#fb923c", glow: "rgba(251,146,60,0.4)",
    bg: "from-orange-950/80 to-amber-950/50", border: "border-amber-500/20",
  },
  {
    stat: 41, displayOverride: "£41", label: "Wasted per person on missed gifts",
    Icon: Leaf,
    copy: "£41 is the average each of us wastes on gifts that miss the mark. Coordinated gifting puts it back into the goal.",
    source: "Finder UK unwanted-gifts research, 2025",
    accent: "#34d399", glow: "rgba(52,211,153,0.4)",
    bg: "from-emerald-950/80 to-teal-950/50", border: "border-emerald-500/20",
  },
  {
    stat: 0, displayOverride: "0", label: "Duplicates when you guide your buyers",
    Icon: RotateCcw,
    copy: "Real-time claim locking means no two people can buy the same thing. A product feature, not a survey.",
    source: "How Kindled works",
    accent: "#a78bfa", glow: "rgba(167,139,250,0.4)",
    bg: "from-violet-950/80 to-purple-950/50", border: "border-violet-500/20",
  },
  {
    stat: 127, displayOverride: "£1.27bn", label: "Spent on unwanted gifts each Christmas",
    Icon: Banknote,
    copy: "£1.27 billion is spent on unwanted gifts every UK Christmas. Kindled helps redirect it toward goals people actually want.",
    source: "Finder UK unwanted-gifts research, 2025",
    accent: "#fbbf24", glow: "rgba(251,191,36,0.4)",
    bg: "from-yellow-950/80 to-amber-950/50", border: "border-yellow-500/20",
  },
  {
    stat: 2, displayOverride: "2 min", label: "To set up your first wish",
    Icon: TrendingUp,
    copy: "The pressure to get the right gift pushes people past what they meant to spend (Mintel). A two-minute shared wish replaces the guesswork.",
    source: "Mintel UK gift-buying research · product fact",
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
              See what your circle could really unlock, and the industry problem we&apos;re solving.
            </p>
          </motion.div>

          {/* Metric tiles */}
          <div className="mb-6">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
              Industry context (tap to expand)
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map((m, i) => (
                <div key={m.label} className={cn(i === 4 && "col-span-2")}>
                  <MetricTile metric={m} delay={i * 0.07} />
                </div>
              ))}
            </div>
            <p className="mx-2 mt-3 text-center text-[8.5px] leading-relaxed text-white/18">
              Sources: Finder UK unwanted-gifts research (2025) · Mintel UK gift-buying research. Product mechanics labelled as such.
            </p>
          </div>


        </div>
      </div>
    </section>
  );
}
