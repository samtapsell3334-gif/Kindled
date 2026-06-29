"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Sparkles, Repeat, Plus, Minus, Check, Lock, Unlock,
  ScrollText, Trophy, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  STAR_COUNT, calculateStarValue, createChart, setGoalValue, awardBehavior,
  isGoalUnlocked, DEFAULT_BEHAVIORS, type Behavior, type StarChartState,
} from "@/lib/star-engine";

type ManagedBehavior = Behavior & { enabled: boolean };

const GBP = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
}

export function StarChart({
  goalValue = 150,
  goalLabel = "Billy's Nintendo Switch",
}: { goalValue?: number; goalLabel?: string }) {
  const [chart, setChart] = useState<StarChartState>(() => createChart(goalValue, 7));
  const [behaviors, setBehaviors] = useState<ManagedBehavior[]>(() => DEFAULT_BEHAVIORS.map((b) => ({ ...b })));
  const [animating, setAnimating] = useState<Set<number>>(new Set());
  const [valuePulse, setValuePulse] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showLog, setShowLog] = useState(true);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const starValue = calculateStarValue(chart.goalValue);
  const unlocked = isGoalUnlocked(chart);
  const pct = Math.round((chart.starsFilled / STAR_COUNT) * 100);
  const now = Date.now();

  const applyAward = useCallback((behavior: Behavior) => {
    setChart((prev) => {
      if (isGoalUnlocked(prev)) return prev;
      const next = awardBehavior(prev, behavior);
      const justFilled = new Set<number>();
      for (let i = prev.starsFilled; i < next.starsFilled; i++) justFilled.add(i);
      if (justFilled.size > 0) {
        setAnimating(justFilled);
        setValuePulse(true);
        if (animTimer.current) clearTimeout(animTimer.current);
        animTimer.current = setTimeout(() => { setAnimating(new Set()); setValuePulse(false); }, 900);
        if (!isGoalUnlocked(prev) && isGoalUnlocked(next)) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 4200);
        }
      }
      return next;
    });
  }, []);

  const tapStar = useCallback((idx: number) => {
    if (idx !== chart.starsFilled) return; // only the next slot is fillable, keeps order
    applyAward({ id: "tap", description: "Tapped a star", starsAwarded: 1, isRecurring: false });
  }, [chart.starsFilled, applyAward]);

  const changeGoal = useCallback((delta: number) => {
    setChart((prev) => setGoalValue(prev, Math.max(30, prev.goalValue + delta)));
  }, []);

  const toggleBehavior = (id: string) =>
    setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const adjustStars = (id: string, delta: number) =>
    setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, starsAwarded: Math.max(1, Math.min(5, b.starsAwarded + delta)) } : b)));

  return (
    <div className="px-4 pb-32 pt-5" style={{ background: "linear-gradient(180deg,#16161a 0%,#1c1c20 100%)" }}>
      {/* ── Header: goal, value-per-star, pot value ── */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80">Star Chart</p>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-[22px] font-black leading-tight text-stone-50">{goalLabel}</h2>
          </div>
          <span className={cx("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider",
            unlocked ? "bg-amber-400 text-stone-900" : "bg-white/5 text-stone-400")}>
            {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {unlocked ? "Unlocked" : "Locked"}
          </span>
        </div>

        {/* Value-per-star indicator */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70">Value per star</p>
              <p style={{ fontFamily: "var(--font-display)" }} className="text-[20px] font-black leading-none text-amber-300">1 Star = {GBP(starValue)}</p>
            </div>
          </div>
          {/* Goal-value stepper — recomputes star value live */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Goal</p>
              <p className="text-[14px] font-black tabular-nums text-stone-200">{GBP(chart.goalValue)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => changeGoal(30)} aria-label="Raise goal" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-stone-300 transition-colors hover:bg-white/15"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => changeGoal(-30)} aria-label="Lower goal" className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-stone-300 transition-colors hover:bg-white/15"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Pot value — the single source of truth */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Pot value · earned so far</p>
            <motion.p animate={valuePulse ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.5 }}
              style={{ fontFamily: "var(--font-display)" }} className="text-[34px] font-black leading-none text-stone-50">
              {GBP(chart.potValue)}
            </motion.p>
          </div>
          <p className="text-[12px] font-bold tabular-nums text-stone-400">{chart.starsFilled}<span className="text-stone-600">/{STAR_COUNT}</span> ★ · {pct}%</p>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
            animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>

      {/* ── The 30-star grid ── */}
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Fill the chart · 30 stars to unlock</p>
          <Sparkles className="h-4 w-4 text-amber-400/70" />
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: STAR_COUNT }, (_, i) => {
            const filled = i < chart.starsFilled;
            const isNext = i === chart.starsFilled && !unlocked;
            const popping = animating.has(i);
            return (
              <motion.button key={i} onClick={() => tapStar(i)} disabled={!isNext}
                whileTap={isNext ? { scale: 0.85 } : {}}
                animate={popping ? { scale: [0.4, 1.3, 1] } : isNext ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={popping ? { duration: 0.6, ease: "easeOut" } : isNext ? { duration: 1.6, repeat: Infinity } : {}}
                className={cx("relative flex aspect-square items-center justify-center rounded-2xl border transition-colors",
                  filled ? "border-amber-400/40 bg-amber-400/10"
                    : isNext ? "cursor-pointer border-amber-400/50 bg-amber-400/[0.04]"
                    : "border-white/8 bg-white/[0.02]")}>
                <Star className={cx("h-7 w-7 transition-all",
                  filled ? "fill-amber-400 text-amber-400" : isNext ? "text-amber-400/50" : "text-white/12")}
                  strokeWidth={filled ? 1.5 : 2}
                  style={filled ? { filter: "drop-shadow(0 0 8px rgba(251,191,36,0.6))" } : {}} />
                {isNext && <span className="absolute -bottom-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400/70">tap</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Behavior Manager ── */}
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Behaviour Manager</p>
          <span className="text-[10px] text-stone-500">toggle · set stars · award</span>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-stone-500">Completing an enabled behaviour adds <span className="font-bold text-amber-300">stars × {GBP(starValue)}</span> to the pot.</p>
        <div className="space-y-2">
          {behaviors.map((b) => (
            <div key={b.id} className={cx("rounded-2xl border px-3 py-3 transition-colors",
              b.enabled ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-transparent opacity-50")}>
              {/* row 1 — toggle + description + value pill */}
              <div className="flex items-center gap-2.5">
                <button onClick={() => toggleBehavior(b.id)} aria-label={`Toggle ${b.description}`}
                  className={cx("relative h-5 w-9 shrink-0 rounded-full transition-colors", b.enabled ? "bg-amber-400" : "bg-white/15")}>
                  <motion.span layout className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                    style={{ left: b.enabled ? "calc(100% - 18px)" : "2px" }} />
                </button>
                <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-stone-100">{b.description}</p>
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {b.isRecurring && <Repeat className="h-2.5 w-2.5" />}{b.starsAwarded} ★ · {GBP(b.starsAwarded * starValue)}
                </span>
              </div>
              {/* row 2 — stepper + award */}
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">Stars</span>
                  <button onClick={() => adjustStars(b.id, -1)} disabled={!b.enabled} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-stone-300 transition-colors hover:bg-white/15 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                  <span className="w-4 text-center text-[13px] font-black tabular-nums text-amber-300">{b.starsAwarded}</span>
                  <button onClick={() => adjustStars(b.id, 1)} disabled={!b.enabled} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-stone-300 transition-colors hover:bg-white/15 disabled:opacity-30"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => applyAward(b)} disabled={!b.enabled || unlocked}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-4 text-[12px] font-black text-stone-900 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-stone-500">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audit log ── */}
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <button onClick={() => setShowLog((s) => !s)} className="flex w-full items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone-400">
            <ScrollText className="h-4 w-4 text-amber-400/70" /> Audit log · transparency
          </p>
          <span className="text-[10px] text-stone-500">{chart.auditLog.length} entries {showLog ? "▾" : "▸"}</span>
        </button>
        <AnimatePresence initial={false}>
          {showLog && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              {chart.auditLog.length === 0 ? (
                <p className="mt-3 text-[12px] text-stone-600">No stars awarded yet — every award will be logged here for full transparency.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {chart.auditLog.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-stone-300"><span className="font-bold text-stone-100">{a.behaviorDescription}</span> · +{a.starsAwarded} ★</span>
                      <span className="shrink-0 text-[12px] font-black tabular-nums text-amber-300">+{GBP(a.valueAdded)}</span>
                      <span className="shrink-0 text-[10px] text-stone-600">{timeAgo(a.timestamp, now)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Unlock celebration ── */}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setCelebrate(false)}>
            <motion.div initial={{ scale: 0.7, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#26241c] to-[#16161a] p-7 text-center">
              {Array.from({ length: 14 }, (_, i) => (
                <motion.span key={i} className="absolute" initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6], x: Math.cos((i / 14) * 6.28) * 120, y: Math.sin((i / 14) * 6.28) * 120 }}
                  transition={{ duration: 1.4, delay: 0.1 + i * 0.02, repeat: Infinity, repeatDelay: 0.6 }}
                  style={{ left: "50%", top: "40%" }}>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </motion.span>
              ))}
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400">
                  <Trophy className="h-8 w-8 text-stone-900" />
                </div>
                <p style={{ fontFamily: "var(--font-display)" }} className="mt-4 text-[24px] font-black text-stone-50">Goal unlocked!</p>
                <p className="mt-1 text-[13px] text-stone-300">All 30 stars earned — {goalLabel} is fully funded at <span className="font-bold text-amber-300">{GBP(chart.potValue)}</span>.</p>
                <button onClick={() => setCelebrate(false)} className="mt-5 w-full rounded-full bg-amber-400 py-3 text-[13px] font-black text-stone-900">Brilliant</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
