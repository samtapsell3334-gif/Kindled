"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  TrendingUp, Users, Flame, Gift, Lock, ChevronRight,
  BarChart2, Globe, Zap, Shield, Check, ArrowRight,
  Target, Database, CreditCard, Sparkles, Building2,
} from "lucide-react";
import content from "@/data/investor-content.json";

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "why" | "engine" | "journey" | "roadmap";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; shortLabel: string }[] = [
  { id: "why",     label: "The Why & Why Now",  shortLabel: "The Why"  },
  { id: "engine",  label: "The Engine",          shortLabel: "Engine"   },
  { id: "journey", label: "Customer Journey",    shortLabel: "Journey"  },
  { id: "roadmap", label: "Roadmap & Execution", shortLabel: "Roadmap"  },
];

// ─── PIN GATE ─────────────────────────────────────────────────────────────────

const CORRECT_PIN = "1066";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits]   = useState("");
  const [shake, setShake]     = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = useCallback((pin: string) => {
    if (pin === CORRECT_PIN) {
      setSuccess(true);
      setTimeout(onUnlock, 600);
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setDigits(""); }, 550);
    }
  }, [onUnlock]);

  const handle = useCallback((k: string) => {
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) submit(next);
  }, [digits, submit]);

  const del = useCallback(() => setDigits(d => d.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) handle(e.key);
      if (e.key === "Backspace") del();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handle, del]);

  const KEYS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#070c18]"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,58,138,0.35) 0%, transparent 70%)" }}>

      {/* Ambient grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm px-6">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <Flame className="h-7 w-7 text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {content.meta.confidential}
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight text-white">
              {content.meta.company} Investor Access
            </h1>
          </div>
        </div>

        {/* PIN card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl"
          style={{ boxShadow: "0 0 0 1px rgba(148,163,184,0.05), 0 32px 64px rgba(0,0,0,0.5)" }}>

          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Secure Access Required
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Dot display */}
            <motion.div
              animate={shake ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 flex justify-center gap-4">
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{
                    scale: digits.length > i ? 1 : 0.55,
                    backgroundColor: success
                      ? "#22c55e"
                      : shake
                      ? "#ef4444"
                      : digits.length > i
                      ? "#3b82f6"
                      : "rgba(148,163,184,0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="h-3.5 w-3.5 rounded-full"
                />
              ))}
            </motion.div>

            {/* Keypad */}
            <div className="grid gap-3">
              {KEYS.map((row, ri) => (
                <div key={ri} className="grid grid-cols-3 gap-3">
                  {row.map((key, ki) => key === "" ? (
                    <div key={ki} />
                  ) : (
                    <motion.button key={ki} whileTap={{ scale: 0.92 }}
                      onClick={() => key === "⌫" ? del() : handle(key)}
                      className={cn(
                        "flex items-center justify-center rounded-xl border text-[16px] font-semibold transition-colors",
                        key === "⌫"
                          ? "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:bg-slate-700/60"
                          : "border-slate-700/60 bg-slate-800/60 text-white hover:border-slate-600 hover:bg-slate-700/80",
                      )}
                      style={{ height: "52px" }}>
                      {key}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          {content.meta.company} · Private War Room · Authorised Access Only
        </p>
      </motion.div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400/80">
      {children}
    </p>
  );
}

function SectionHeadline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-[28px] font-bold leading-tight tracking-tight text-white md:text-[36px]", className)}>
      {children}
    </h2>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-800 bg-slate-900/50 p-6", className)}>
      {children}
    </div>
  );
}

function StatPill({ figure, caption, source }: { figure: string; caption: string; source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-[36px] font-bold leading-none tracking-tight text-white">{figure}</p>
      <p className="mt-1.5 text-[13px] leading-snug text-slate-300">{caption}</p>
      <p className="mt-2 text-[10px] text-slate-600">Source: {source}</p>
    </motion.div>
  );
}

// ─── TAB: THE WHY & WHY NOW ───────────────────────────────────────────────────

type WhyView = "problem" | "solution" | "howItWorks" | "whyNow";
const WHY_SUB = [
  { id: "problem" as WhyView,    label: "The Problem"  },
  { id: "solution" as WhyView,   label: "Why We Win"   },
  { id: "howItWorks" as WhyView, label: "How It Works" },
  { id: "whyNow" as WhyView,     label: "Why Now"      },
];

function WhyTab() {
  const { why } = content;
  const [view, setView] = useState<WhyView>("problem");

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>The Opportunity</SectionLabel>
        <SectionHeadline>{why.headline}</SectionHeadline>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-400">{why.subheadline}</p>
      </div>

      <div className="flex gap-0 overflow-x-auto scrollbar-none border-b border-slate-800">
        {WHY_SUB.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-5 pb-3 text-[13px] font-semibold transition-colors",
              view === t.id
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300",
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === "problem" && (
          <motion.div key="problem"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="space-y-6">
            <p className="max-w-2xl text-[15px] leading-relaxed text-slate-400">{why.problem.copy}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {why.problem.stats.map(s => <StatPill key={s.figure} {...s} />)}
            </div>
          </motion.div>
        )}

        {view === "solution" && (
          <motion.div key="solution"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="space-y-6">
            <div>
              <p className="text-[18px] font-semibold text-white">{why.solution.headline}</p>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-400">{why.solution.copy}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {why.solution.points.map((p, i) => (
                <Card key={i}>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
                    {i === 0 ? <Users className="h-4 w-4 text-blue-400" /> :
                     i === 1 ? <Shield className="h-4 w-4 text-blue-400" /> :
                               <TrendingUp className="h-4 w-4 text-blue-400" />}
                  </div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{p.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{p.body}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {view === "howItWorks" && (
          <motion.div key="how"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="space-y-4">
            <p className="text-[18px] font-semibold text-white">{why.howItWorks.headline}</p>
            <div className="space-y-3">
              {why.howItWorks.steps.map((step, i) => (
                <motion.div key={step.number}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <span className="shrink-0 text-[32px] font-black leading-none text-blue-500/30">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-white">{step.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === "whyNow" && (
          <motion.div key="whynow"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="space-y-4">
            <p className="text-[18px] font-semibold text-white">{why.whyNow.headline}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {why.whyNow.points.map((p, i) => (
                <Card key={i}>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    {i === 0 ? <CreditCard className="h-4 w-4 text-emerald-400" /> :
                     i === 1 ? <Sparkles className="h-4 w-4 text-violet-400" /> :
                               <Globe className="h-4 w-4 text-amber-400" />}
                  </div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{p.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{p.body}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TAB: THE ENGINE ──────────────────────────────────────────────────────────

const PILLAR_ICONS: Record<string, React.ElementType> = {
  "The Viral Loop": Users,
  "Intent Data Capture": Database,
  "Open Banking Revenue": CreditCard,
  "Cashback Flywheel": Zap,
  "Predictive B2B Licensing": BarChart2,
  "Temporal Advantage Windows": Target,
  "Stripe Connect Payouts": Shield,
  "Enterprise Gifting API": Building2,
};

function EngineTab() {
  const { engine } = content;
  const [activePhase, setActivePhase] = useState<1 | 2>(1);
  const phase = activePhase === 1 ? engine.phase1 : engine.phase2;

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Business Model</SectionLabel>
        <SectionHeadline>{engine.headline}</SectionHeadline>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-400">{engine.subheadline}</p>
      </div>

      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {([1, 2] as const).map(p => (
          <button key={p} onClick={() => setActivePhase(p)}
            className={cn(
              "rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
              activePhase === p
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200",
            )}>
            Phase {p} — {p === 1 ? engine.phase1.label : engine.phase2.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activePhase}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
          className="space-y-6">

          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-blue-950/20 p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-400">
                  {phase.period}
                </span>
                <p className="mt-2 text-[18px] font-bold text-white">{phase.tagline}</p>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-400">{phase.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {phase.metrics.map((m, i) => (
                  <div key={i} className="rounded-xl border border-slate-700/40 bg-slate-800/50 px-3 py-2.5">
                    <p className="text-[15px] font-bold text-white">{m.value}</p>
                    <p className="text-[10px] text-slate-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {phase.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[pillar.title] ?? Zap;
              return (
                <motion.div key={pillar.title}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                    <Icon className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
                  </div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{pillar.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{pillar.body}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── TAB: CUSTOMER JOURNEY ────────────────────────────────────────────────────

type JourneyId = "host" | "giver" | "reveal" | "loop";
const JOURNEY_ICONS: Record<JourneyId, React.ElementType> = {
  host: Flame, giver: CreditCard, reveal: Sparkles, loop: ArrowRight,
};
const JOURNEY_COLORS: Record<JourneyId, { accent: string; glow: string; badge: string }> = {
  host:   { accent: "#f59e0b", glow: "rgba(245,158,11,0.12)",  badge: "bg-amber-500/15 text-amber-400"   },
  giver:  { accent: "#3b82f6", glow: "rgba(59,130,246,0.12)",  badge: "bg-blue-500/15 text-blue-400"     },
  reveal: { accent: "#8b5cf6", glow: "rgba(139,92,246,0.12)",  badge: "bg-violet-500/15 text-violet-400" },
  loop:   { accent: "#10b981", glow: "rgba(16,185,129,0.12)",  badge: "bg-emerald-500/15 text-emerald-400" },
};

function JourneyTab() {
  const { journey } = content;
  const [active, setActive] = useState(0);
  const stage = journey.stages[active]!;
  const id = stage.id as JourneyId;
  const Icon = JOURNEY_ICONS[id] ?? Gift;
  const colors = JOURNEY_COLORS[id] ?? JOURNEY_COLORS.host;

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>The Experience</SectionLabel>
        <SectionHeadline>{journey.headline}</SectionHeadline>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-400">{journey.subheadline}</p>
      </div>

      {/* Stage selector */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {journey.stages.map((s, i) => {
          const sid = s.id as JourneyId;
          const c = JOURNEY_COLORS[sid] ?? JOURNEY_COLORS.host;
          const SI = JOURNEY_ICONS[sid] ?? Gift;
          return (
            <button key={s.id} onClick={() => setActive(i)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                active === i
                  ? "border-slate-700 bg-slate-800/80"
                  : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700",
              )}>
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: c.glow }}>
                <SI className="h-4 w-4" style={{ color: c.accent }} strokeWidth={1.75} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: active === i ? c.accent : "rgb(100,116,139)" }}>
                {s.persona}
              </p>
              <p className={cn("mt-0.5 text-[12px] font-semibold", active === i ? "text-white" : "text-slate-500")}>
                {s.moment}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      <AnimatePresence mode="wait">
        <motion.div key={stage.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700"
                  style={{ background: colors.glow }}>
                  <Icon className="h-5 w-5" style={{ color: colors.accent }} strokeWidth={1.75} />
                </div>
                <div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors.badge)}>
                    {stage.persona}
                  </span>
                  <p className="mt-0.5 text-[16px] font-bold text-white">{stage.moment}</p>
                </div>
              </div>
              <p className="text-[13px] italic leading-relaxed text-slate-400">
                &ldquo;{stage.narrative}&rdquo;
              </p>
              <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.accent }}>
                  The Insight
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{stage.insight}</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">What happens</p>
              <div className="space-y-3">
                {stage.steps.map((step, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${colors.accent}22` }}>
                      <Check className="h-3 w-3" style={{ color: colors.accent }} strokeWidth={2.5} />
                    </div>
                    <p className="text-[13px] leading-snug text-slate-300">{step}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setActive(i => Math.max(0, i - 1))}
                  disabled={active === 0}
                  className="text-[12px] text-slate-600 transition-colors hover:text-slate-400 disabled:opacity-20">
                  ← Previous
                </button>
                <button onClick={() => setActive(i => Math.min(journey.stages.length - 1, i + 1))}
                  disabled={active === journey.stages.length - 1}
                  className="text-[12px] text-slate-400 transition-colors hover:text-white disabled:opacity-20">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── TAB: ROADMAP ─────────────────────────────────────────────────────────────

function RoadmapTab() {
  const { roadmap } = content;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Execution Plan</SectionLabel>
        <SectionHeadline>{roadmap.headline}</SectionHeadline>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-400">{roadmap.subheadline}</p>
      </div>

      {roadmap.phases.map(phase => (
        <div key={phase.phase} className="space-y-3">
          <div className="flex items-center gap-4">
            <span className={cn(
              "rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider",
              phase.status === "in_progress"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-slate-800 text-slate-400",
            )}>
              {phase.phase} · {phase.label}
            </span>
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] text-slate-600">{phase.period}</span>
          </div>

          {phase.milestones.map((m, mi) => {
            const key = `${phase.phase}-${mi}`;
            const isOpen = open === key;
            return (
              <div key={key} className={cn(
                "overflow-hidden rounded-2xl border transition-colors",
                isOpen ? "border-slate-700 bg-slate-900/80" : "border-slate-800/60 bg-slate-900/30",
              )}>
                <button className="flex w-full items-center gap-4 p-4 text-left"
                  onClick={() => setOpen(isOpen ? null : key)}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black",
                    phase.status === "in_progress"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-slate-800 text-slate-500",
                  )}>
                    {mi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white">{m.title}</p>
                    <p className="text-[11px] text-slate-500">{m.quarter}</p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}>
                      <div className="border-t border-slate-800 px-4 pb-5 pt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                              Strategic Why
                            </p>
                            <p className="text-[13px] leading-relaxed text-slate-400">{m.why}</p>
                          </div>
                          <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Key Deliverables
                            </p>
                            <div className="space-y-1.5">
                              {m.deliverables.map((d, di) => (
                                <div key={di} className="flex items-start gap-2.5">
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                                  <p className="text-[12px] text-slate-400">{d}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── WAR ROOM SHELL ───────────────────────────────────────────────────────────

function WarRoom() {
  const [activeTab, setActiveTab] = useState<Tab>("why");

  return (
    <div className="min-h-screen bg-[#070c18] text-white"
      style={{ backgroundImage: "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(15,23,42,0.8) 0%, transparent 60%)" }}>

      {/* Ambient grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070c18]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15">
                <Flame className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
              </div>
              <span className="text-[14px] font-bold tracking-tight text-white">
                {content.meta.company}
                <span className="ml-1.5 text-[10px] font-normal uppercase tracking-widest text-slate-600">
                  Investor
                </span>
              </span>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:text-slate-300",
                  )}>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">
              <Lock className="h-3 w-3 text-slate-600" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Confidential</span>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="mt-2 flex gap-1 overflow-x-auto scrollbar-none md:hidden">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                  activeTab === tab.id ? "bg-slate-800 text-white" : "text-slate-500",
                )}>
                {tab.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-blue-950/20">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-400/70">
              Private Investor Briefing
            </p>
            <h1 className="mt-2 max-w-3xl text-[28px] font-bold leading-tight tracking-tight text-white md:text-[40px]">
              {content.meta.tagline}
            </h1>
            <div className="mt-6 flex flex-wrap gap-6">
              {content.traction.items.map(item => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <span className="text-[22px] font-bold tabular-nums text-white md:text-[26px]">{item.figure}</span>
                  <span className="max-w-[160px] text-[12px] leading-tight text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto max-w-6xl px-4 py-10 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            {activeTab === "why"     && <WhyTab />}
            {activeTab === "engine"  && <EngineTab />}
            {activeTab === "journey" && <JourneyTab />}
            {activeTab === "roadmap" && <RoadmapTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800/60 px-4 py-6 text-center">
        <p className="text-[11px] text-slate-700">
          {content.meta.confidential} · {content.meta.company} · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

// ─── PAGE ENTRY ───────────────────────────────────────────────────────────────

export default function InvestorPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("investor_unlocked") === "1") setUnlocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem("investor_unlocked", "1");
    setUnlocked(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div key="room"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}>
          <WarRoom />
        </motion.div>
      ) : (
        <motion.div key="gate"
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4 }}>
          <PinGate onUnlock={handleUnlock} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
