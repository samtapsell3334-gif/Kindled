"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Users, Flame, Gift, Lock, ChevronRight, BarChart2, Globe,
  Zap, Shield, ShieldCheck, Check, ArrowRight, Target, Database, CreditCard,
  Sparkles, Repeat, Share2, Wallet, Percent, Tag, Cpu, GitBranch, Landmark, Bell,
} from "lucide-react";
import content from "@/data/investor-content.json";

/**
 * InvestorWarRoom — a dark, fintech-grade investor dashboard.
 *
 * Five pitch-ready tabs, every word pulled from investor-content.json so the
 * narrative stays cohesive. Shared by the /investor route and the PIN-gated
 * "Investor" tab in the demo (`embedded`).
 */

function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

type Tab = "opportunity" | "mechanism" | "value" | "edge" | "execution";

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "opportunity", label: "Why Now",         short: "Why Now"    },
  { id: "mechanism",   label: "The Mechanism",   short: "Mechanism"  },
  { id: "value",       label: "The Value Engine", short: "Value"     },
  { id: "edge",        label: "The Edge",         short: "Edge"      },
  { id: "execution",   label: "Execution",        short: "Execution" },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ffb800]/80">{children}</p>;
}
function SectionHeadline({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[26px] font-bold leading-tight tracking-tight text-white md:text-[34px]">{children}</h2>;
}
function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">{children}</p>;
}
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-[#1c1c1c] bg-[#0f0f0f]/50 p-5", className)}>{children}</div>;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay }}>
      {children}
    </motion.div>
  );
}

function StatPill({ figure, caption, source }: { figure: string; caption: string; source: string }) {
  return (
    <Reveal>
      <div className="rounded-2xl border border-[#1c1c1c] bg-[#0f0f0f]/60 p-5">
        <p className="text-[34px] font-bold leading-none tracking-tight text-white">{figure}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-slate-300">{caption}</p>
        <p className="mt-2 text-[10px] text-slate-600">Source: {source}</p>
      </div>
    </Reveal>
  );
}

// ─── Flywheel diagram (reused inside The Mechanism) ────────────────────────────

const LOOP_ICONS: Record<string, React.ElementType> = {
  flame: Flame, share: Share2, gift: Gift, sparkles: Sparkles, repeat: Repeat,
};

function FlywheelDiagram() {
  const { flywheel } = content;
  const loop = flywheel.loop;
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % loop.length), 2600);
    return () => clearInterval(t);
  }, [loop.length]);

  const R = 38;
  const nodes = loop.map((s, i) => {
    const ang = (-90 + i * (360 / loop.length)) * (Math.PI / 180);
    return { ...s, x: 50 + R * Math.cos(ang), y: 50 + R * Math.sin(ang) };
  });
  const stage = loop[active]!;

  return (
    <div className="space-y-6">
      <div className="relative mx-auto aspect-square w-full max-w-[380px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={stage.color} strokeOpacity="0.5" strokeWidth="0.8"
            strokeDasharray="3 5" strokeLinecap="round" style={{ transition: "stroke 0.5s" }}>
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="22s" repeatCount="indefinite" />
          </circle>
        </svg>
        <motion.div className="pointer-events-none absolute inset-0" animate={{ rotate: 360 }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}>
          <div className="absolute left-1/2" style={{ top: "12%", transform: "translate(-50%,-50%)" }}>
            <div className="h-2.5 w-2.5 rounded-full bg-white" style={{ boxShadow: "0 0 12px 3px rgba(255,255,255,0.8)" }} />
          </div>
        </motion.div>
        <div className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-slate-700/60 bg-[#0f0f0f]/80 text-center backdrop-blur-sm"
          style={{ boxShadow: `0 0 40px ${stage.color}33`, transition: "box-shadow 0.5s" }}>
          <p className="text-[28px] font-black leading-none text-white">{flywheel.multiplier.value}</p>
          <p className="mt-1 px-2 text-[8.5px] font-semibold leading-tight text-slate-400">{flywheel.multiplier.label}</p>
        </div>
        {nodes.map((n, i) => {
          const Icon = LOOP_ICONS[n.icon] ?? Flame;
          const on = i === active;
          return (
            <button key={n.id} onClick={() => setActive(i)} className="absolute flex flex-col items-center"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)", width: "30%" }}>
              <motion.div animate={{ scale: on ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{ background: on ? n.color : "rgba(15,23,42,0.9)", borderColor: on ? n.color : "rgba(148,163,184,0.25)", boxShadow: on ? `0 0 24px ${n.color}88` : "none" }}>
                <Icon className="h-5 w-5" style={{ color: on ? "#fff" : n.color }} strokeWidth={2} />
              </motion.div>
              <span className="mt-1.5 text-center text-[9px] font-bold leading-tight" style={{ color: on ? "#fff" : "rgb(100,116,139)" }}>{n.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-md">
        <AnimatePresence mode="wait">
          <motion.div key={stage.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }} className="rounded-2xl border bg-[#0f0f0f]/50 p-5" style={{ borderColor: `${stage.color}40` }}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black text-white" style={{ background: stage.color }}>{active + 1}</span>
              <p className="text-[15px] font-bold text-white">{stage.title}</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{stage.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <Reveal>
        <div className="rounded-2xl border border-[#1c1c1c] bg-gradient-to-br from-[#0f0f0f] to-[#161616]/20 p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffb800]/80">{flywheel.compounding.label}</p>
          <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-none">
            {flywheel.compounding.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="min-w-[92px] shrink-0 rounded-xl border border-slate-700/50 bg-[#1c1c1c]/40 px-3 py-2.5 text-center">
                  <p className="text-[16px] font-black leading-none text-white">{s.people}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{s.tier}</p>
                </div>
                {i < flywheel.compounding.steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-[#ffb800]/60" />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{flywheel.compounding.caption}</p>
        </div>
      </Reveal>
    </div>
  );
}

// ─── TAB: WHY NOW (opportunity) ───────────────────────────────────────────────

function OpportunityTab() {
  const { opportunity } = content;
  const ICONS = [CreditCard, Sparkles, Globe];
  return (
    <div className="space-y-9">
      <div>
        <SectionLabel>The Opportunity</SectionLabel>
        <SectionHeadline>{opportunity.headline}</SectionHeadline>
        <Lead>{opportunity.subheadline}</Lead>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {opportunity.stats.map((s) => <StatPill key={s.figure} {...s} />)}
      </div>
      <div>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Why this is the moment</p>
        <div className="grid gap-4 md:grid-cols-3">
          {opportunity.whyNow.map((p, i) => {
            const Icon = ICONS[i] ?? Globe;
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <Panel>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/15"><Icon className="h-4 w-4 text-[#ffb800]" /></div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{p.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{p.body}</p>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: THE MECHANISM ───────────────────────────────────────────────────────

function ProjBar({ year, value, pct, delay }: { year: string; value: string; pct: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className="flex flex-1 flex-col items-center gap-1.5">
      <p className="text-[13px] font-black text-white">{value}</p>
      <div className="flex h-28 w-full items-end justify-center rounded-xl bg-[#1c1c1c]/40 p-1.5">
        <motion.div className="w-full rounded-lg bg-gradient-to-t from-[#ffb800] to-[#ffb800]"
          initial={{ height: "2%" }} animate={inView ? { height: `${pct}%` } : {}} transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      <p className="text-[10px] text-slate-500">{year}</p>
    </div>
  );
}

function MechanismTab() {
  const { mechanism, jointFires: jf } = content;
  const ICONS: Record<string, React.ElementType> = { viral: Users, intent: Database, overhead: Cpu };
  return (
    <div className="space-y-9">
      <div>
        <SectionLabel>The Engine</SectionLabel>
        <SectionHeadline>{mechanism.headline}</SectionHeadline>
        <Lead>{mechanism.subheadline}</Lead>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {mechanism.pillars.map((p, i) => {
          const Icon = ICONS[p.id] ?? Zap;
          return (
            <Reveal key={p.id} delay={i * 0.05}>
              <Panel className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/10"><Icon className="h-4 w-4 text-[#ffb800]" strokeWidth={1.75} /></div>
                  <span className="rounded-full bg-[#ffb800]/10 px-2.5 py-1 text-[10px] font-bold text-[#ffb800]">{p.metric}</span>
                </div>
                <p className="mb-1.5 text-[15px] font-bold text-white">{p.title}</p>
                <p className="text-[13px] leading-relaxed text-slate-400">{p.body}</p>
              </Panel>
            </Reveal>
          );
        })}
      </div>
      <div>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">The loop, visualised</p>
        <FlywheelDiagram />
      </div>

      {/* Joint Fires — pitch-ready marketing preview (the Milestone Engine) */}
      <Reveal>
        <div className="rounded-2xl border border-[#ffb800]/20 bg-gradient-to-br from-[#0f0f0f] to-[#1c1c1c]/10 p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ffb800]/80">{jf.label}</p>
          <p className="text-[20px] font-bold text-white">{jf.title}</p>
          <p className="mt-2 text-[16px] font-black leading-snug text-[#ffb800]">{jf.hook}</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-400">{jf.body}</p>

          <div className="mt-6 grid gap-5 md:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-end gap-3">
                {jf.projection.map((p, i) => <ProjBar key={p.year} year={p.year} value={p.value} pct={p.pct} delay={i * 0.1} />)}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-500">{jf.caption}</p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-[#ffb800]/25 bg-[#ffb800]/[0.07] p-5 text-center">
              <p className="text-[40px] font-black leading-none text-[#ffb800]">{jf.stat.value}</p>
              <p className="mx-auto mt-1.5 max-w-[180px] text-[11px] leading-tight text-slate-400">{jf.stat.label}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {jf.pillars.map((p) => (
              <div key={p.title} className="rounded-xl border border-[#1c1c1c] bg-[#0f0f0f]/50 p-4">
                <p className="mb-1.5 text-[13px] font-bold text-white">{p.title}</p>
                <p className="text-[12px] leading-relaxed text-slate-400">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Milestone architecture → retail intent segments</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {jf.categories.map((c) => (
                <div key={c.label} className="rounded-xl border border-[#1c1c1c] bg-[#0f0f0f]/40 p-3">
                  <p className="text-[12px] font-bold text-[#ffb800]">{c.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{c.segment}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{c.horizon}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ─── TAB: THE VALUE ENGINE ────────────────────────────────────────────────────

function CashbackSplit() {
  const { cashbackMath } = content.valueEngine;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-[#ffb800]" />
        <p className="text-[15px] font-bold text-white">{cashbackMath.title}</p>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{cashbackMath.intro}</p>

      <div ref={ref} className="mt-5 rounded-2xl border border-slate-700/50 bg-[#0a0a0a]/60 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{cashbackMath.exampleLabel}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[28px] font-black text-white">{cashbackMath.commission.amount}</span>
          <span className="text-[12px] text-slate-500">{cashbackMath.commission.label} ({cashbackMath.commission.value})</span>
        </div>
        {/* Split bar */}
        <div className="mt-4 flex h-9 w-full overflow-hidden rounded-xl">
          <motion.div initial={{ width: 0 }} animate={inView ? { width: "60%" } : {}} transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center justify-center bg-[#ffb800] text-[12px] font-black text-[#0a0a0a]">
            You · 3%
          </motion.div>
          <motion.div initial={{ width: 0 }} animate={inView ? { width: "40%" } : {}} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="flex items-center justify-center bg-[#2a2a2a] text-[12px] font-black text-[#ffb800]">
            Us · 2%
          </motion.div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {cashbackMath.split.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-700/40 bg-[#1c1c1c]/40 px-3 py-2.5">
              <p className="text-[16px] font-black text-white">{s.amount}</p>
              <p className="text-[11px]" style={{ color: s.tone === "user" ? "#ffb800" : "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      {cashbackMath.compoundLoop && (
        <div className="mt-4 rounded-xl border border-[#ffb800]/20 bg-[#ffb800]/[0.06] p-3">
          <div className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-[#ffb800]" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#ffb800]">{cashbackMath.compoundLoop.title}</p>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{cashbackMath.compoundLoop.body}</p>
        </div>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-slate-300">{cashbackMath.takeaway}</p>
    </Panel>
  );
}

function ValueTab() {
  const { valueEngine } = content;
  const f = valueEngine.fairness;
  return (
    <div className="space-y-9">
      <div>
        <SectionLabel>Revenue & Incentives</SectionLabel>
        <SectionHeadline>{valueEngine.headline}</SectionHeadline>
        <Lead>{valueEngine.subheadline}</Lead>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fairness / no-fee */}
        <Reveal>
          <Panel className="h-full">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#ffb800]" />
              <p className="text-[15px] font-bold text-white">{f.title}</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{f.body}</p>
            <div className="mt-3 rounded-xl border border-[#ffb800]/20 bg-[#ffb800]/[0.06] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#ffb800]">The Locked-In Loop</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{f.lockedLoop}</p>
            </div>
            <div className="mt-3 space-y-2">
              {f.points.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffb800]" strokeWidth={2.5} />
                  <p className="text-[12px] leading-snug text-slate-400">{p}</p>
                </div>
              ))}
            </div>
          </Panel>
        </Reveal>
        {/* Cashback math */}
        <Reveal delay={0.05}><CashbackSplit /></Reveal>
      </div>

      {/* Revenue models */}
      <div>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">Phase 1 revenue — three pillars</p>
        <div className="grid gap-4 md:grid-cols-3">
          {valueEngine.revenueModels.map((m, i) => {
            const Icon = [Tag, Database, Sparkles][i] ?? Tag;
            return (
              <Reveal key={m.id} delay={i * 0.05}>
                <Panel className="h-full">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/10"><Icon className="h-4 w-4 text-[#ffb800]" strokeWidth={1.75} /></div>
                    <span className="rounded-full bg-[#1c1c1c] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.tag}</span>
                  </div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{m.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{m.body}</p>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: THE EDGE ────────────────────────────────────────────────────────────

function UnitEconomicsTable() {
  const ue = content.edge.unitEconomics;
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[#1c1c1c] p-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#ffb800]" />
          <p className="text-[15px] font-bold text-white">{ue.title}</p>
        </div>
        <p className="mt-1 text-[12px] text-slate-500">{ue.subtitle}</p>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr_1fr] text-[12px]">
        <div className="border-b border-[#1c1c1c] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"> </div>
        <div className="flex items-center gap-1.5 border-b border-l border-[#1c1c1c] px-3 py-3 text-[11px] font-bold text-rose-300">
          <CreditCard className="h-3.5 w-3.5" /> {ue.columns[0]}
        </div>
        <div className="flex items-center gap-1.5 border-b border-l border-[#1c1c1c] bg-[#ffb800]/[0.05] px-3 py-3 text-[11px] font-bold text-[#ffb800]">
          <Landmark className="h-3.5 w-3.5" /> {ue.columns[1]}
        </div>
        {ue.rows.flatMap((r) => [
          <div key={`${r.label}-l`} className={cn("border-b border-[#1c1c1c]/70 px-4 py-3.5 font-medium text-slate-300", r.highlight && "text-white")}>{r.label}</div>,
          <div key={`${r.label}-c`} className={cn("border-b border-l border-[#1c1c1c]/70 px-3 py-3.5 text-rose-300/90", r.highlight && "font-bold")}>{r.card}</div>,
          <div key={`${r.label}-o`} className={cn("border-b border-l border-[#1c1c1c]/70 bg-[#ffb800]/[0.05] px-3 py-3.5 text-[#ffb800]", r.highlight && "font-bold")}>{r.openBanking}</div>,
        ])}
      </div>
      <p className="p-5 text-[13px] leading-relaxed text-slate-300">{ue.takeaway}</p>
    </Panel>
  );
}

function EdgeTab() {
  const { edge } = content;
  return (
    <div className="space-y-9">
      <div>
        <SectionLabel>The Competitive Edge</SectionLabel>
        <SectionHeadline>{edge.headline}</SectionHeadline>
        <Lead>{edge.subheadline}</Lead>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <Panel className="h-full">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/15"><Bell className="h-4 w-4 text-[#ffb800]" /></div>
            <p className="mb-1.5 text-[15px] font-bold text-white">{edge.smartShopper.title}</p>
            <p className="text-[13px] leading-relaxed text-slate-400">{edge.smartShopper.body}</p>
            <p className="mt-3 border-l-2 border-[#ffb800]/40 pl-3 text-[12px] italic leading-relaxed text-[#ffb800]/80">{edge.smartShopper.effect}</p>
          </Panel>
        </Reveal>
        <Reveal delay={0.05}>
          <Panel className="h-full">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/15"><ShieldCheck className="h-4 w-4 text-[#ffb800]" /></div>
            <p className="mb-1.5 text-[15px] font-bold text-white">{edge.dataBack.title}</p>
            <p className="text-[13px] leading-relaxed text-slate-400">{edge.dataBack.body}</p>
            <p className="mt-3 border-l-2 border-[#ffb800]/40 pl-3 text-[12px] italic leading-relaxed text-[#ffb800]/80">{edge.dataBack.effect}</p>
          </Panel>
        </Reveal>
      </div>
      <UnitEconomicsTable />
    </div>
  );
}

// ─── TAB: EXECUTION (risk + operator + roadmap) ───────────────────────────────

function ExecutionTab() {
  const { risk, operator, roadmap } = content;
  const [open, setOpen] = useState<string | null>(null);
  const opIcons = [Target, GitBranch, Sparkles];
  return (
    <div className="space-y-10">
      {/* Risk */}
      <div>
        <SectionLabel>Risk, Mitigated</SectionLabel>
        <SectionHeadline>{risk.headline}</SectionHeadline>
        <Lead>{risk.subheadline}</Lead>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {risk.items.map((it, i) => {
            const Icon = [Zap, Sparkles, Shield][i] ?? Shield;
            return (
              <Reveal key={it.title} delay={i * 0.05}>
                <Panel className="h-full">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/10"><Icon className="h-4 w-4 text-[#ffb800]" strokeWidth={1.75} /></div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{it.title}</p>
                  <p className="text-[12px] leading-relaxed text-slate-500"><span className="font-semibold text-slate-400">Risk:</span> {it.risk}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-300"><span className="font-semibold text-[#ffb800]">How we win:</span> {it.mitigation}</p>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Operator mindset */}
      <div>
        <SectionLabel>The Operator Mindset</SectionLabel>
        <SectionHeadline>{operator.headline}</SectionHeadline>
        <Lead>{operator.subheadline}</Lead>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {operator.principles.map((p, i) => {
            const Icon = opIcons[i] ?? Target;
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#0f0f0f] to-[#161616]/20 p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffb800]/15"><Icon className="h-4 w-4 text-[#ffb800]" /></div>
                  <p className="mb-1.5 text-[14px] font-bold text-white">{p.title}</p>
                  <p className="text-[13px] leading-relaxed text-slate-400">{p.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <SectionLabel>Execution Plan</SectionLabel>
        <SectionHeadline>{roadmap.headline}</SectionHeadline>
        <Lead>{roadmap.subheadline}</Lead>
        <div className="mt-5 space-y-6">
          {roadmap.phases.map((phase) => (
            <div key={phase.phase} className="space-y-3">
              <div className="flex items-center gap-4">
                <span className={cn("rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider",
                  phase.status === "in_progress" ? "bg-[#ffb800]/15 text-[#ffb800]" : "bg-[#1c1c1c] text-slate-400")}>
                  {phase.phase} · {phase.label}
                </span>
                <div className="h-px flex-1 bg-[#1c1c1c]" />
                <span className="text-[11px] text-slate-600">{phase.period}</span>
              </div>
              {phase.milestones.map((m, mi) => {
                const key = `${phase.phase}-${mi}`;
                const isOpen = open === key;
                return (
                  <div key={key} className={cn("overflow-hidden rounded-2xl border transition-colors", isOpen ? "border-slate-700 bg-[#0f0f0f]/80" : "border-[#1c1c1c]/60 bg-[#0f0f0f]/30")}>
                    <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(isOpen ? null : key)}>
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black",
                        phase.status === "in_progress" ? "bg-[#ffb800]/20 text-[#ffb800]" : "bg-[#1c1c1c] text-slate-500")}>{mi + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-white">{m.title}</p>
                        <p className="text-[11px] text-slate-500">{m.quarter}</p>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}><ChevronRight className="h-4 w-4 text-slate-600" /></motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="border-t border-[#1c1c1c] px-4 pb-5 pt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#ffb800]">Strategic Why</p>
                                <p className="text-[13px] leading-relaxed text-slate-400">{m.why}</p>
                              </div>
                              <div>
                                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Key Deliverables</p>
                                <div className="space-y-1.5">
                                  {m.deliverables.map((d, di) => (
                                    <div key={di} className="flex items-start gap-2.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffb800]" strokeWidth={2.5} /><p className="text-[12px] text-slate-400">{d}</p></div>
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
      </div>
    </div>
  );
}

// ─── WAR ROOM SHELL ───────────────────────────────────────────────────────────

export function InvestorWarRoom({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>("opportunity");

  return (
    <div className={cn("text-white", embedded ? "relative overflow-hidden rounded-3xl" : "min-h-screen")}
      style={{ backgroundColor: "#0a0a0a", backgroundImage: "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(15,23,42,0.8) 0%, transparent 60%)" }}>
      <div className={cn("pointer-events-none opacity-[0.025]", embedded ? "absolute inset-0" : "fixed inset-0")}
        style={{ backgroundImage: "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

      {/* Header */}
      <header className={cn("z-40 border-b border-[#1c1c1c]/80 bg-[#0a0a0a]/90 backdrop-blur-xl", embedded ? "relative" : "sticky top-0")}>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffb800]/15"><Flame className="h-4 w-4 text-[#ffb800]" strokeWidth={1.5} /></div>
              <span className="text-[14px] font-bold tracking-tight text-white">{content.meta.company}
                <span className="ml-1.5 text-[10px] font-normal uppercase tracking-widest text-slate-600">Investor</span>
              </span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all", tab === t.id ? "bg-[#1c1c1c] text-white" : "text-slate-500 hover:text-slate-300")}>
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#1c1c1c] bg-[#0f0f0f] px-3 py-1.5">
              <Lock className="h-3 w-3 text-slate-600" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Confidential</span>
            </div>
          </div>
          {/* Mobile tabs */}
          <div className="mt-2 flex gap-1 overflow-x-auto scrollbar-none md:hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all", tab === t.id ? "bg-[#1c1c1c] text-white" : "text-slate-500")}>
                {t.short}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative border-b border-[#1c1c1c]/50 bg-gradient-to-r from-[#0f0f0f]/50 to-[#161616]/20">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffb800]/70">{content.hero.eyebrow}</p>
            <h1 className="mt-2 max-w-3xl text-[26px] font-bold leading-tight tracking-tight text-white md:text-[38px]">{content.hero.headline}</h1>
            <p className="mt-2 max-w-2xl text-[14px] text-slate-400">{content.hero.subhead}</p>
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
              {content.traction.items.map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <span className="text-[22px] font-bold tabular-nums text-white md:text-[26px]">{item.figure}</span>
                  <span className="max-w-[170px] text-[12px] leading-tight text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab content */}
      <main className="relative mx-auto max-w-6xl px-4 py-10 pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            {tab === "opportunity" && <OpportunityTab />}
            {tab === "mechanism"   && <MechanismTab />}
            {tab === "value"       && <ValueTab />}
            {tab === "edge"        && <EdgeTab />}
            {tab === "execution"   && <ExecutionTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative border-t border-[#1c1c1c]/60 px-4 py-6 text-center">
        <p className="text-[11px] text-slate-700">{content.meta.confidential} · {content.meta.company} · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
