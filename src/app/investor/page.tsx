"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  TrendingUp, Zap, Users, Repeat, Shield, Target,
  Check, X, Flame, Gift,
  BarChart2, Globe, Lock, DollarSign, Layers,
  RefreshCw, Star, AlertTriangle,
  Building2, Wallet, ShoppingBag,
} from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
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

// ─── PIN GATE ──────────────────────────────────────────────────────────────────
const CORRECT_PIN = "1066";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState("");
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleKey = useCallback((k: string) => {
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setFlash(true);
        setTimeout(onUnlock, 420);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(""); }, 520);
      }
    }
  }, [digits, onUnlock]);

  const handleDel = useCallback(() => setDigits(d => d.slice(0, -1)), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      if (e.key === "Backspace") handleDel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey, handleDel]);

  const PAD = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    ["","0","DEL"],
  ];

  return (
    <motion.div
      animate={shake ? { x: [-14, 14, -10, 10, -6, 6, 0] } : flash ? { opacity: [1, 1, 0], scale: [1, 1.04, 0.96] } : {}}
      transition={shake ? { duration: 0.5 } : flash ? { duration: 0.42 } : {}}
      className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="absolute left-1/3 top-2/3 h-56 w-56 rounded-full bg-orange-500/6 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xs">
        {/* Branding */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Flame className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-500/70">Kindled</p>
          <h1 className="mt-1 text-[22px] font-black text-white">Investor Access</h1>
          <p className="mt-1 text-[12px] text-slate-500">Enter your access code to continue</p>
        </div>

        {/* Dot display */}
        <div className="mb-8 flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <motion.div key={i}
              animate={digits.length > i ? { scale: [0.7, 1.25, 1], background: "#f59e0b" } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 transition-all",
                digits.length > i ? "border-amber-500 bg-amber-500" : "border-slate-600 bg-transparent",
              )}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {PAD.flat().map((k, i) => (
            <motion.button key={i}
              whileTap={k ? { scale: 0.88 } : {}}
              onClick={() => k === "DEL" ? handleDel() : k ? handleKey(k) : undefined}
              className={cn(
                "flex h-16 items-center justify-center rounded-2xl text-[22px] font-bold transition-all",
                k === "DEL"
                  ? "bg-slate-800/60 text-slate-400 text-[14px] font-semibold hover:bg-slate-700/60"
                  : k
                    ? "bg-white/6 text-white backdrop-blur-sm hover:bg-white/10 active:bg-amber-500/20"
                    : "pointer-events-none",
              )}>
              {k === "DEL" ? <X className="h-4 w-4" /> : k}
            </motion.button>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-slate-700">
          Confidential — for authorised investors only
        </p>
      </div>
    </motion.div>
  );
}

// ─── METRICS ───────────────────────────────────────────────────────────────────
interface MetricCard {
  label: string;
  value: string;
  raw: number;
  prefix?: string;
  suffix?: string;
  sub: string;
  color: string;
}

function AnimatedMetric({ m }: { m: MetricCard }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const count = useCountUp(m.raw, inView, 1600);
  return (
    <div ref={ref} className={cn("rounded-2xl border border-white/8 bg-white/4 p-4", m.color)}>
      <p className="text-[32px] font-black leading-none text-white">
        {m.prefix}{count}{m.suffix}
      </p>
      <p className="mt-1 text-[12px] font-bold text-white/80">{m.label}</p>
      <p className="mt-0.5 text-[10px] text-white/40 leading-snug">{m.sub}</p>
    </div>
  );
}

// ─── MODULE A: REVENUE ROADMAP ─────────────────────────────────────────────────
function RevenueRoadmap() {
  const [phase, setPhase] = useState<1 | 2>(1);

  const PHASE1_METRICS: MetricCard[] = [
    { label: "Platform clip per contribution", raw: 3, suffix: "%", value: "3%", sub: "On all card/wallet transactions", color: "" },
    { label: "Affiliate take per purchase", raw: 11, suffix: "%", value: "11%", sub: "Avg across catalogue partner network", color: "" },
    { label: "Avg pot GMV", raw: 310, prefix: "£", value: "£310", sub: "Mean across active Kindled pots", color: "" },
    { label: "Revenue per completed pot", raw: 27, prefix: "£", value: "£27", sub: "Platform fee + affiliate blend", color: "" },
  ];

  const PHASE2_METRICS: MetricCard[] = [
    { label: "Projected family LTV", raw: 48, prefix: "£", value: "£48", sub: "Per active family circle annually", color: "" },
    { label: "Viral K-factor", raw: 3, suffix: ".2×", value: "3.2×", sub: "1 host → 10 givers → 3.2 new hosts", color: "" },
    { label: "Target active pots at scale", raw: 50, suffix: "k", value: "50k", sub: "Unlock threshold for brand CPM deals", color: "" },
    { label: "Projected ARR at scale", raw: 2, prefix: "£", suffix: ".4M", value: "£2.4M", sub: "Platform + affiliate + brand mix", color: "" },
  ];

  const streams1 = [
    {
      Icon: DollarSign,
      title: "Platform Transaction Clip",
      when: "Day 1 — every contribution",
      desc: "3% clip on all card/wallet contributions processed through Stripe Connect. Secured at point of transaction regardless of pot outcome.",
      guaranteed: true,
    },
    {
      Icon: ShoppingBag,
      title: "Affiliate Catalogue Commission",
      when: "Day 1 — on every catalogue purchase",
      desc: "8–15% commission from merchant partners (Amazon, LEGO, Smyths, etc.) when givers purchase directly from Kindled catalogue.",
      guaranteed: false,
    },
    {
      Icon: Wallet,
      title: "Escrow Float Yield",
      when: "Continuous — during holding period",
      desc: "Funds held in yield-bearing escrow earn ~4.5% APY. Average holding window: 14–45 days. Revenue accrues on every £1 in the system.",
      guaranteed: true,
    },
    {
      Icon: Shield,
      title: "Baseline Admin Micro-Fee",
      when: "Per-pot — regardless of outcome",
      desc: "Flat £0.99 administrative fee per pot created. Secured upfront. Even on cancelled, refunded, or redirected pots — we earn on velocity, not completion.",
      guaranteed: true,
    },
  ];

  const streams2 = [
    {
      Icon: Building2,
      title: "Corporate & Brand Sponsorships",
      when: "Scale milestone — 50k active groups",
      desc: "Programmatic placement revenue. Brands pay CPM/CPA to feature products in the family's Kindled catalogue and push notifications.",
    },
    {
      Icon: Star,
      title: "Spark Balance Premium Tier",
      when: "Post-MVP — Q3 Year 1",
      desc: "Monthly micro-SaaS subscription (£2.99/mo) unlocking automated milestone matching, family circle routing, and multi-event stacking reminders.",
    },
    {
      Icon: Repeat,
      title: "Automated Matching Engine",
      when: "Enterprise tier — Year 2",
      desc: "White-label matching for employers, schools, and communities. HR benefit gifting, school fundraising, community milestone circles.",
    },
    {
      Icon: Globe,
      title: "Creator & Influencer Programme",
      when: "Community scale",
      desc: "Revenue share with power creators who run high-volume family circles. Incentivises organic virality and reduces CAC to near-zero.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Phase switcher */}
      <div className="flex rounded-2xl bg-white/5 p-1.5 gap-1.5">
        {([1, 2] as const).map(p => (
          <button key={p} onClick={() => setPhase(p)}
            className={cn(
              "flex-1 rounded-xl py-3 text-[13px] font-bold transition-all",
              phase === p
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/40"
                : "text-slate-400 hover:text-slate-300",
            )}>
            Phase {p}: {p === 1 ? "Immediate Capture" : "Ecosystem Scale"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 ? (
          <motion.div key="p1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }} className="space-y-5">

            {/* Timing strip */}
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex items-center gap-3">
              <Zap className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
              <p className="text-[12px] text-amber-300"><span className="font-black">Live Day 1.</span> Revenue triggers on every contribution, purchase, and pot creation from launch.</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              {PHASE1_METRICS.map(m => <AnimatedMetric key={m.label} m={m} />)}
            </div>

            {/* Revenue streams */}
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Revenue streams</p>
              {streams1.map(s => (
                <div key={s.title} className="rounded-2xl border border-white/7 bg-white/4 p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      s.guaranteed ? "bg-emerald-500/15" : "bg-amber-500/15")}>
                      <s.Icon className={cn("h-4.5 w-4.5", s.guaranteed ? "text-emerald-400" : "text-amber-400")} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-white">{s.title}</p>
                        {s.guaranteed && (
                          <span className="shrink-0 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-400">Guaranteed</span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-amber-400/70 mt-0.5">{s.when}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guaranteed revenue callout */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-emerald-400" strokeWidth={2} />
                <p className="text-[12px] font-black text-emerald-300">Guaranteed revenue — regardless of pot outcome</p>
              </div>
              <p className="text-[11px] text-emerald-400/60 leading-relaxed">
                Even if a pot fails to reach its target, is refunded, or redirected — we earn on the <em>movement and velocity</em> of cash. The admin micro-fee, escrow float yield, and processing clip are secured at the moment funds enter the system. We do not depend on a successful gift purchase to generate revenue.
              </p>
            </div>

            {/* ELI5 */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/40 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1.5">ELI5 — for the meeting</p>
              <p className="text-[13px] text-white/80 leading-relaxed italic">
                &quot;When people put money in the digital piggy bank for Billy, we take a tiny spoonful of sugar from the jar for setting up the party. If they buy the gift from our store partners, the store gives us a high-five and a slice of cashback. And the whole time the money sits in our jar waiting — we&apos;re quietly earning interest on every pound.&quot;
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="p2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }} className="space-y-5">

            {/* Timing strip */}
            <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 px-4 py-3 flex items-center gap-3">
              <Layers className="h-4 w-4 shrink-0 text-violet-400" strokeWidth={2} />
              <p className="text-[12px] text-violet-300"><span className="font-black">Scale milestone — 50k active circles.</span> Unlocks high-margin brand, subscription, and enterprise revenue.</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              {PHASE2_METRICS.map(m => <AnimatedMetric key={m.label} m={m} />)}
            </div>

            {/* Revenue streams */}
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Revenue streams</p>
              {streams2.map(s => (
                <div key={s.title} className="rounded-2xl border border-white/7 bg-white/4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                      <s.Icon className="h-4.5 w-4.5 text-violet-400" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white">{s.title}</p>
                      <p className="text-[10px] font-semibold text-violet-400/70 mt-0.5">{s.when}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* LTV model */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">LTV model at scale</p>
              <div className="space-y-2">
                {[
                  ["Phase 1 clip + affiliate (Year 1)", "£18 / circle"],
                  ["Phase 2 brand CPM (Year 2+)", "£12 / circle"],
                  ["Spark Balance subscription (Year 2+)", "£18 / circle / yr"],
                  ["Total family LTV (3yr horizon)", "£48 / circle"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-white/60">{k}</p>
                    <p className="text-[12px] font-black text-amber-300 shrink-0">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ELI5 */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/40 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1.5">ELI5 — for the meeting</p>
              <p className="text-[13px] text-white/80 leading-relaxed italic">
                &quot;Once millions of families use our piggy banks, big toy stores and brands will pay us directly to put their coolest rewards right at the top of the list. And the most dedicated parents will happily pay £2.99 a month for tools that make the whole family run smoother. It&apos;s a win for everyone — and we scale without scaling our costs.&quot;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MODULE B: INVESTOR PITCH ──────────────────────────────────────────────────
function InvestorPitch() {
  const [activeSection, setActiveSection] = useState<"problem" | "winwin" | "virality" | "matrix">("problem");

  const PROBLEMS = [
    { Icon: RefreshCw, title: "Duplicate Gifts", stat: "20%", statSub: "of all gifts are duplicates", desc: "1 in 5 gifts received is already owned or a repeat. Zero co-ordination between buyers.", color: "from-red-900/50 to-rose-950/50", border: "border-red-500/20", accent: "text-red-400" },
    { Icon: AlertTriangle, title: "Gift Anxiety", stat: "78%", statSub: "of adults feel gifting stress", desc: "78% of UK adults report anxiety buying gifts — fear of getting it wrong, overspending, or missing the mark.", color: "from-orange-900/50 to-amber-950/50", border: "border-orange-500/20", accent: "text-orange-400" },
    { Icon: DollarSign, title: "£3.2B Wasted", stat: "£3.2B", statSub: "in unwanted gifts annually", desc: "£3.2 billion spent on gifts that will be returned, unused, or discarded. Pure economic waste.", color: "from-yellow-900/50 to-amber-950/50", border: "border-yellow-500/20", accent: "text-yellow-400" },
    { Icon: Layers, title: "Split Payment Friction", stat: "64%", statSub: "abandon group collections", desc: "Awkward WhatsApp bank transfer chains. 64% of attempted group gifts are abandoned before completion.", color: "from-violet-900/50 to-purple-950/50", border: "border-violet-500/20", accent: "text-violet-400" },
  ];

  const WIN_WIN_COLS = [
    {
      role: "Receiver", Icon: Gift, color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-950/40",
      items: [
        "Gets the exact gift they want",
        "No duplicates, no awkward returns",
        "Meaningful milestones funded over time",
        "Surprise preserved until reveal",
        "Stars rewards for children",
      ],
    },
    {
      role: "Giver", Icon: Users, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-950/40",
      items: [
        "No gift anxiety — list is pre-approved",
        "Chip in £10–£50 comfortably",
        "Cashback via Spark Balance on every £",
        "Raffle entries on contributions",
        "One link, two taps, done",
      ],
    },
    {
      role: "Kindled", Icon: TrendingUp, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-950/40",
      items: [
        "3% clip on every transaction",
        "8–15% affiliate on catalogue buys",
        "Escrow float yield (avg 14–45 days)",
        "High-frequency transactional data",
        "Zero CAC — viral by design",
      ],
    },
  ];

  const COMPETITORS = [
    { name: "GoFundMe",      purpose: "Emergencies", recurring: false, social: false, milestones: false, virality: "Low",    emotion: "Crisis",    },
    { name: "JustGiving",    purpose: "Charity",     recurring: false, social: false, milestones: false, virality: "Low",    emotion: "Guilt",     },
    { name: "Monzo Pots",    purpose: "Banking",     recurring: true,  social: false, milestones: false, virality: "None",   emotion: "Utility",   },
    { name: "Amazon List",   purpose: "Shopping",    recurring: false, social: true,  milestones: false, virality: "Medium", emotion: "Practical", },
    { name: "Kindled",       purpose: "Milestones",  recurring: true,  social: true,  milestones: true,  virality: "High",   emotion: "Joy",       kindled: true },
  ];

  const sections: { id: typeof activeSection; label: string }[] = [
    { id: "problem", label: "The Problem" },
    { id: "winwin", label: "Win-Win" },
    { id: "virality", label: "Virality" },
    { id: "matrix", label: "Vs. Market" },
  ];

  return (
    <div className="space-y-5">
      {/* Section nav — horizontal scroll */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex min-w-max gap-2">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-[12px] font-bold transition-all",
                activeSection === s.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/40"
                  : "bg-white/6 text-slate-400 hover:text-slate-300",
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "problem" && (
          <motion.div key="problem" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }} className="space-y-3">
            <div className="mb-4">
              <h3 className="text-[18px] font-black text-white">The gifting industry is broken</h3>
              <p className="text-[12px] text-slate-400 mt-1">A £10B+ annual market built on friction, anxiety, and waste. Nobody has fixed it properly — yet.</p>
            </div>
            {PROBLEMS.map(p => (
              <div key={p.title} className={cn("rounded-2xl border p-4 bg-gradient-to-br", p.color, p.border)}>
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8")}>
                    <p.Icon className={cn("h-4.5 w-4.5", p.accent)} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-bold text-white">{p.title}</p>
                      <div className="text-right">
                        <p className={cn("text-[18px] font-black leading-none", p.accent)}>{p.stat}</p>
                        <p className="text-[9px] text-white/40 leading-tight">{p.statSub}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed mt-1.5">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/40 px-4 py-3">
              <p className="text-[12px] text-amber-300 font-semibold">The opportunity</p>
              <p className="text-[11px] text-amber-400/60 mt-1 leading-relaxed">
                Kindled is the first platform purpose-built for <strong className="text-amber-300">continuous family milestone gifting</strong>. Not tragedy. Not charity. Pure, repeat-usage joy — at a time when every family already has smartphones, WhatsApp, and a child&apos;s wish list in their head.
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === "winwin" && (
          <motion.div key="winwin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }} className="space-y-4">
            <div>
              <h3 className="text-[18px] font-black text-white">Three parties win simultaneously</h3>
              <p className="text-[12px] text-slate-400 mt-1">The model only works because every stakeholder gets clear, immediate value. This is why CAC stays near zero.</p>
            </div>
            {WIN_WIN_COLS.map(col => (
              <div key={col.role} className={cn("rounded-2xl border p-4", col.border, col.bg)}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-white/8")}>
                    <col.Icon className={cn("h-4 w-4", col.color)} strokeWidth={1.75} />
                  </div>
                  <p className={cn("text-[14px] font-black", col.color)}>{col.role} wins</p>
                </div>
                <div className="space-y-2">
                  {col.items.map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <Check className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", col.color)} strokeWidth={2.5} />
                      <p className="text-[11px] text-white/65 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 py-3">
              <p className="text-[11px] font-bold text-slate-300 mb-1">Why now?</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mobile payment infrastructure (Stripe, Apple Pay, Google Pay), WhatsApp group culture, and post-COVID digital gifting habits have all converged. The behaviour we need already exists — we&apos;re just giving it a dedicated, emotionally intelligent home.
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === "virality" && (
          <motion.div key="virality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }} className="space-y-5">
            <div>
              <h3 className="text-[18px] font-black text-white">A natural 1→10→3.2 growth loop</h3>
              <p className="text-[12px] text-slate-400 mt-1">Every single user we acquire generates 10 engaged touches — and 3.2 of those become new hosts. CAC compounds to near-zero at scale.</p>
            </div>

            {/* Loop visual */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
              <div className="space-y-4">
                {[
                  { step: "1", label: "1 Parent creates a board", sub: "Shares a single WhatsApp link", color: "bg-amber-500", textColor: "text-amber-400" },
                  { step: "→ 10", label: "10 Family members contribute", sub: "Each is exposed to the product firsthand — mobile-optimised, delightful", color: "bg-orange-500", textColor: "text-orange-400" },
                  { step: "→ 3.2", label: "3.2 become new hosts", sub: "Grandma. Uncle Steve. A school friend's parent. All inspired to start their own.", color: "bg-rose-500", textColor: "text-rose-400" },
                  { step: "→ ∞", label: "The loop compounds", sub: "Each new host brings 10 more contributors. K-factor: 3.2. CAC: £0.", color: "bg-violet-500", textColor: "text-violet-400" },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white", r.color)}>
                      {r.step}
                    </div>
                    <div>
                      <p className={cn("text-[13px] font-bold", r.textColor)}>{r.label}</p>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{r.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "K-factor", value: "3.2×", sub: "Viral coefficient" },
                { label: "CAC target", value: "£0", sub: "Pure organic loop" },
                { label: "Touch points", value: "10×", sub: "Per host acquired" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-center">
                  <p className="text-[24px] font-black text-white leading-none">{m.value}</p>
                  <p className="text-[11px] font-bold text-amber-400 mt-1">{m.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 px-4 py-3">
              <p className="text-[12px] font-bold text-emerald-300 mb-1">No ad spend required to grow</p>
              <p className="text-[11px] text-emerald-400/60 leading-relaxed">
                The product is the distribution. Every contribution link shared on WhatsApp is an acquisition channel. Every reveal ceremony shared on social is organic brand marketing. We grow because using the product requires sharing it.
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === "matrix" && (
          <motion.div key="matrix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }} className="space-y-4">
            <div>
              <h3 className="text-[18px] font-black text-white">We win the market others ignore</h3>
              <p className="text-[12px] text-slate-400 mt-1">No direct competitor is purpose-built for continuous family milestone gifting. We are in our own category.</p>
            </div>

            {/* Competitive matrix — card per competitor */}
            <div className="space-y-2">
              {COMPETITORS.map(c => (
                <div key={c.name}
                  className={cn("rounded-2xl border p-4 transition-all",
                    c.kindled
                      ? "border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-orange-950/40"
                      : "border-white/7 bg-white/3",
                  )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {c.kindled && <Flame className="h-4 w-4 text-amber-400" strokeWidth={2} />}
                      <p className={cn("text-[14px] font-black", c.kindled ? "text-amber-300" : "text-slate-300")}>
                        {c.name}
                      </p>
                      {c.kindled && <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">Us</span>}
                    </div>
                    <span className="text-[10px] text-slate-500">{c.purpose}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Recurring", val: c.recurring },
                      { label: "Social", val: c.social },
                      { label: "Milestone", val: c.milestones },
                    ].map(attr => (
                      <div key={attr.label} className={cn("rounded-xl border px-2 py-1.5 text-center",
                        attr.val
                          ? c.kindled ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/20 bg-emerald-950/30"
                          : "border-white/5 bg-white/3")}>
                        {attr.val
                          ? <Check className={cn("h-3.5 w-3.5 mx-auto", c.kindled ? "text-amber-400" : "text-emerald-400")} strokeWidth={2.5} />
                          : <X className="h-3.5 w-3.5 mx-auto text-slate-600" strokeWidth={2} />}
                        <p className="text-[8.5px] text-slate-500 mt-0.5">{attr.label}</p>
                      </div>
                    ))}
                    <div className={cn("rounded-xl border px-2 py-1.5 text-center",
                      c.kindled ? "border-amber-500/30 bg-amber-500/10" : "border-white/5 bg-white/3")}>
                      <p className={cn("text-[11px] font-black leading-none", c.kindled ? "text-amber-400" : "text-slate-400")}>{c.virality}</p>
                      <p className="text-[8.5px] text-slate-500 mt-0.5">Virality</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-[9px] text-slate-600">Emotional hook:</p>
                    <p className={cn("text-[9px] font-bold", c.kindled ? "text-amber-400" : "text-slate-500")}>{c.emotion}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-950/40 px-4 py-3">
              <p className="text-[11px] font-bold text-violet-300 mb-1">The category creation opportunity</p>
              <p className="text-[11px] text-violet-400/60 leading-relaxed">
                GoFundMe owns crisis giving. JustGiving owns charity. Monzo owns personal savings. Nobody owns continuous family milestone gifting — a behaviour that happens 4–6 times per family per year, every year. That&apos;s our market. We&apos;re building the Duolingo of gifting: habitual, joyful, and impossible to ignore.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN INVESTOR PAGE ────────────────────────────────────────────────────────
export default function InvestorPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeModule, setActiveModule] = useState<"revenue" | "pitch">("revenue");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="gate" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
            <PinGate onUnlock={() => setUnlocked(true)} />
          </motion.div>
        ) : (
          <motion.div key="portal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}>

            {/* Ambient background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
              <div className="absolute top-1/2 -right-20 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-orange-500/4 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-4 pt-8 pb-24">
              {/* Header */}
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                    <Flame className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-500/70">Kindled — Series Seed</p>
                    <p className="text-[10px] text-slate-600">Confidential investor materials · June 2026</p>
                  </div>
                </div>
                <h1 className="text-[28px] font-black leading-tight text-white md:text-[36px]">
                  The Continuous<br />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Family Gifting</span> Platform
                </h1>
                <p className="mt-2 max-w-[520px] text-[13px] text-slate-400 leading-relaxed">
                  We&apos;ve built the infrastructure layer for how families coordinate meaningful milestone gifting — a £10B market nobody has solved properly.
                </p>

                {/* Top-line KPIs */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: "Target raise", value: "£500k", sub: "Seed round" },
                    { label: "Valuation cap", value: "£3M", sub: "Pre-money" },
                    { label: "Instrument", value: "SAFE", sub: "Standard terms" },
                  ].map(m => (
                    <div key={m.label} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-center">
                      <p className="text-[20px] font-black text-amber-400 leading-none">{m.value}</p>
                      <p className="text-[11px] font-bold text-white mt-1">{m.label}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module switcher */}
              <div className="mb-6 flex rounded-2xl bg-white/5 p-1.5 gap-1.5">
                <button onClick={() => setActiveModule("revenue")}
                  className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold transition-all",
                    activeModule === "revenue"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/40"
                      : "text-slate-400 hover:text-slate-300")}>
                  <BarChart2 className="h-4 w-4" strokeWidth={2} />
                  Revenue Roadmap
                </button>
                <button onClick={() => setActiveModule("pitch")}
                  className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold transition-all",
                    activeModule === "pitch"
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40"
                      : "text-slate-400 hover:text-slate-300")}>
                  <Target className="h-4 w-4" strokeWidth={2} />
                  Investor Pitch
                </button>
              </div>

              {/* Module content */}
              <AnimatePresence mode="wait">
                {activeModule === "revenue" ? (
                  <motion.div key="revenue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <RevenueRoadmap />
                  </motion.div>
                ) : (
                  <motion.div key="pitch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <InvestorPitch />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="mt-10 border-t border-white/6 pt-6 text-center">
                <p className="text-[11px] text-slate-700">Kindled Ltd · Confidential · For authorised investors only · kindledgift.co.uk</p>
                <button onClick={() => setUnlocked(false)}
                  className="mt-3 flex items-center gap-1.5 mx-auto text-[10px] text-slate-700 hover:text-slate-500 transition-colors">
                  <Lock className="h-3 w-3" />
                  Lock portal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
