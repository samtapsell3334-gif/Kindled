"use client";

import { useState, useCallback, useRef, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Repeat, Plus, Minus, Check, Lock, Unlock,
  ScrollText, Trophy, ChevronUp, ChevronDown, Flame,
} from "lucide-react";
import {
  STAR_COUNT, calculateStarValue, createChart, setGoalValue, awardBehavior,
  isGoalUnlocked, DEFAULT_BEHAVIORS, type Behavior, type StarChartState,
} from "@/lib/star-engine";
import { LUX_EASE, luxTransition } from "@/lib/motion";
import { Reveal } from "@/components/lux/Reveal";
import { MagneticCard } from "@/components/lux/MagneticCard";
import { useBloom } from "@/components/lux/Bloom";
import { Portal } from "@/components/lux/Portal";

type ManagedBehavior = Behavior & { enabled: boolean };

const GBP = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

// ── Fire Chart geometry: a boustrophedon snake through a 5×6 grid ──
const COLS = 5;
/** Fill order for the visual cell at (row, col) — snakes L→R, R→L, … */
function fillIndexFor(r: number, c: number): number {
  return r * COLS + (r % 2 === 0 ? c : COLS - 1 - c);
}
/** Path through the cell centres in fill order — the line the "fire" draws along. */
const FIRE_PATH = Array.from({ length: STAR_COUNT }, (_, k) => {
  const r = Math.floor(k / COLS);
  const p = k % COLS;
  const c = r % 2 === 0 ? p : COLS - 1 - p;
  return `${k === 0 ? "M" : "L"} ${c * 20 + 10} ${r * 20 + 10}`;
}).join(" ");

const PANEL = "border border-[rgba(245,245,245,0.1)] bg-[#f5f5f5]/[0.03]";

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
  const { bloom, trigger } = useBloom();

  const starValue = calculateStarValue(chart.goalValue);
  const unlocked = isGoalUnlocked(chart);
  const progress = chart.starsFilled / STAR_COUNT;
  const pct = Math.round(progress * 100);
  const now = Date.now();

  const applyAward = useCallback((behavior: Behavior, e?: MouseEvent) => {
    if (e) trigger(e.clientX, e.clientY);
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
  }, [trigger]);

  const tapStar = useCallback((fillIndex: number, e: MouseEvent) => {
    if (fillIndex !== chart.starsFilled) return;
    applyAward({ id: "tap", description: "Tapped a star", starsAwarded: 1, isRecurring: false }, e);
  }, [chart.starsFilled, applyAward]);

  const changeGoal = useCallback((delta: number) => {
    setChart((prev) => setGoalValue(prev, Math.max(30, prev.goalValue + delta)));
  }, []);

  const toggleBehavior = (id: string) =>
    setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const adjustStars = (id: string, delta: number) =>
    setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, starsAwarded: Math.max(1, Math.min(5, b.starsAwarded + delta)) } : b)));

  return (
    <div className="bg-[#0a0a0a] px-4 pb-32 pt-6">
      <Portal>{bloom}</Portal>

      {/* ── Header — goal, value-per-star, pot value ── */}
      <Reveal>
        <MagneticCard maxTilt={4} className={`block ${PANEL} p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ffb800]">Star Chart</p>
              <h2 className="font-editorial mt-1.5 text-[24px] font-semibold leading-tight text-[#f5f5f5]">{goalLabel}</h2>
            </div>
            <span className={`flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${unlocked ? "border-[#ffb800] bg-[#ffb800] text-[#0a0a0a]" : "border-[rgba(245,245,245,0.14)] text-[#f5f5f5]/45"}`}>
              {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>

          {/* Value-per-star + goal stepper */}
          <div className="mt-5 flex items-center justify-between border-y border-[rgba(245,245,245,0.1)] py-4">
            <div className="flex items-center gap-2.5">
              <Star className="h-5 w-5 fill-[#ffb800] text-[#ffb800]" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f5f5f5]/40">Value per star</p>
                <p className="font-editorial text-[22px] font-semibold leading-none text-[#ffb800]">1 Star = {GBP(starValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f5f5f5]/40">Goal</p>
                <p className="text-[15px] font-semibold tabular-nums tracking-tight text-[#f5f5f5]">{GBP(chart.goalValue)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => changeGoal(30)} aria-label="Raise goal" className="flex h-6 w-6 items-center justify-center border border-[rgba(245,245,245,0.14)] text-[#f5f5f5]/70 transition-colors hover:border-[#ffb800] hover:text-[#ffb800]"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => changeGoal(-30)} aria-label="Lower goal" className="flex h-6 w-6 items-center justify-center border border-[rgba(245,245,245,0.14)] text-[#f5f5f5]/70 transition-colors hover:border-[#ffb800] hover:text-[#ffb800]"><ChevronDown className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Pot value — the single source of truth */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f5f5f5]/40">Pot value · earned so far</p>
              <motion.p animate={valuePulse ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.5, ease: LUX_EASE }}
                className="font-editorial text-[38px] font-semibold leading-none text-[#f5f5f5]">{GBP(chart.potValue)}</motion.p>
            </div>
            <p className="text-[12px] font-semibold tabular-nums tracking-tight text-[#f5f5f5]/50">{chart.starsFilled}<span className="text-[#f5f5f5]/25">/{STAR_COUNT}</span> · {pct}%</p>
          </div>
          <div className="mt-2.5 h-px w-full bg-[rgba(245,245,245,0.12)]">
            <motion.div className="h-px bg-[#ffb800]" animate={{ width: `${pct}%` }} transition={luxTransition} style={{ boxShadow: "0 0 6px #ffb800" }} />
          </div>
        </MagneticCard>
      </Reveal>

      {/* ── The Fire Chart — glass-etched grid + self-drawing SVG path ── */}
      <Reveal delay={0.05}>
        <div className={`mt-4 ${PANEL} p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-editorial flex items-center gap-2 text-[16px] font-semibold text-[#f5f5f5]"><Flame className="h-4 w-4 text-[#ffb800]" /> The Fire Chart</h3>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f5f5f5]/35">30 stars to ignite</p>
          </div>

          <div className="relative">
            {/* Self-drawing fire path behind the grid */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 120" preserveAspectRatio="none" fill="none">
              <path d={FIRE_PATH} stroke="rgba(245,245,245,0.07)" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
              <motion.path d={FIRE_PATH} stroke="#ffb800" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 1.5px #ffb800)" }}
                initial={false} animate={{ pathLength: progress }} transition={{ duration: 0.9, ease: LUX_EASE }} />
            </svg>

            {/* Glass-etched 5×6 grid */}
            <div className="relative grid grid-cols-5 gap-2.5">
              {Array.from({ length: STAR_COUNT }, (_, k) => {
                const r = Math.floor(k / COLS);
                const c = k % COLS;
                const fi = fillIndexFor(r, c);
                const filled = fi < chart.starsFilled;
                const isNext = fi === chart.starsFilled && !unlocked;
                const popping = animating.has(fi);
                return (
                  <motion.button key={k} onClick={(e) => tapStar(fi, e)} disabled={!isNext}
                    whileTap={isNext ? { scale: 0.88 } : {}}
                    animate={popping
                      ? { scale: [0.5, 1.25, 1], boxShadow: ["0 0 0 rgba(255,184,0,0)", "0 0 26px rgba(255,184,0,0.65)", "0 0 0 rgba(255,184,0,0)"] }
                      : isNext ? { boxShadow: ["0 0 0 rgba(255,184,0,0)", "0 0 14px rgba(255,184,0,0.4)", "0 0 0 rgba(255,184,0,0)"] } : { scale: 1 }}
                    transition={popping ? { duration: 0.7, ease: LUX_EASE } : isNext ? { duration: 1.8, repeat: Infinity, ease: LUX_EASE } : {}}
                    className={`relative flex aspect-square items-center justify-center border backdrop-blur-[1px] transition-colors ${
                      filled ? "border-[#ffb800]/45 bg-[#ffb800]/[0.1]"
                        : isNext ? "cursor-pointer border-[#ffb800]/45 bg-[#ffb800]/[0.03]"
                        : "border-[rgba(245,245,245,0.08)] bg-[#f5f5f5]/[0.02]"}`}>
                    <Star className={`h-6 w-6 transition-all ${filled ? "fill-[#ffb800] text-[#ffb800]" : isNext ? "text-[#ffb800]/45" : "text-[#f5f5f5]/10"}`}
                      strokeWidth={filled ? 1.25 : 1.75}
                      style={filled ? { filter: "drop-shadow(0 0 6px rgba(255,184,0,0.7))" } : {}} />
                    {isNext && <span className="absolute -bottom-px text-[7px] font-semibold uppercase tracking-[0.2em] text-[#ffb800]/70">tap</span>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Behaviour Manager ── */}
      <Reveal delay={0.1}>
        <div className={`mt-4 ${PANEL} p-5`}>
          <h3 className="font-editorial text-[16px] font-semibold text-[#f5f5f5]">Behaviour Manager</h3>
          <p className="mb-4 mt-1 text-[11px] leading-relaxed tracking-tight text-[#f5f5f5]/45">Toggle a routine on, set its stars, then mark it done — it adds <span className="text-[#ffb800]">stars × {GBP(starValue)}</span> to the pot.</p>
          <div className="space-y-2">
            {behaviors.map((b) => (
              <div key={b.id} className={`border px-3 py-3 transition-colors ${b.enabled ? "border-[rgba(245,245,245,0.1)] bg-[#f5f5f5]/[0.03]" : "border-[rgba(245,245,245,0.05)] opacity-45"}`}>
                <div className="flex items-center gap-2.5">
                  <button onClick={() => toggleBehavior(b.id)} aria-label={`Toggle ${b.description}`}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${b.enabled ? "bg-[#ffb800]" : "bg-[#f5f5f5]/15"}`}>
                    <motion.span layout transition={{ duration: 0.3, ease: LUX_EASE }} className="absolute top-0.5 h-4 w-4 rounded-full bg-[#f5f5f5]"
                      style={{ left: b.enabled ? "calc(100% - 18px)" : "2px" }} />
                  </button>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight text-[#f5f5f5]">{b.description}</p>
                  <span className="flex shrink-0 items-center gap-1 whitespace-nowrap border border-[#ffb800]/25 px-2 py-0.5 text-[10px] font-semibold text-[#ffb800]">
                    {b.isRecurring && <Repeat className="h-2.5 w-2.5" />}{b.starsAwarded} ★ · {GBP(b.starsAwarded * starValue)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#f5f5f5]/35">Stars</span>
                    <button onClick={() => adjustStars(b.id, -1)} disabled={!b.enabled} className="flex h-6 w-6 items-center justify-center border border-[rgba(245,245,245,0.14)] text-[#f5f5f5]/70 transition-colors hover:border-[#ffb800] hover:text-[#ffb800] disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                    <span className="w-4 text-center text-[13px] font-semibold tabular-nums text-[#ffb800]">{b.starsAwarded}</span>
                    <button onClick={() => adjustStars(b.id, 1)} disabled={!b.enabled} className="flex h-6 w-6 items-center justify-center border border-[rgba(245,245,245,0.14)] text-[#f5f5f5]/70 transition-colors hover:border-[#ffb800] hover:text-[#ffb800] disabled:opacity-30"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={(e) => applyAward(b, e)} disabled={!b.enabled || unlocked}
                    className="flex h-8 shrink-0 items-center gap-1.5 bg-[#ffb800] px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0a0a0a] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]/10 disabled:text-[#f5f5f5]/35">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── Audit log ── */}
      <Reveal delay={0.15}>
        <div className={`mt-4 ${PANEL} p-5`}>
          <button onClick={() => setShowLog((s) => !s)} className="flex w-full items-center justify-between">
            <h3 className="font-editorial flex items-center gap-2 text-[16px] font-semibold text-[#f5f5f5]"><ScrollText className="h-4 w-4 text-[#ffb800]" /> Audit log</h3>
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#f5f5f5]/40">{chart.auditLog.length} entries {showLog ? "▾" : "▸"}</span>
          </button>
          <AnimatePresence initial={false}>
            {showLog && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: LUX_EASE }} className="overflow-hidden">
                {chart.auditLog.length === 0 ? (
                  <p className="mt-3 text-[12px] tracking-tight text-[#f5f5f5]/35">No stars awarded yet — every award is logged here for full transparency.</p>
                ) : (
                  <ul className="mt-3 space-y-px">
                    {chart.auditLog.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 border-b border-[rgba(245,245,245,0.06)] py-2.5">
                        <Star className="h-3.5 w-3.5 shrink-0 fill-[#ffb800] text-[#ffb800]" />
                        <span className="min-w-0 flex-1 truncate text-[12px] tracking-tight text-[#f5f5f5]/65"><span className="font-medium text-[#f5f5f5]">{a.behaviorDescription}</span> · +{a.starsAwarded} ★</span>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#ffb800]">+{GBP(a.valueAdded)}</span>
                        <span className="shrink-0 text-[10px] text-[#f5f5f5]/30">{timeAgo(a.timestamp, now)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      {/* ── Unlock celebration ── */}
      <Portal>
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: LUX_EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 px-6 backdrop-blur-sm" onClick={() => setCelebrate(false)}>
            <motion.div initial={{ scale: 0.8, y: 24 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.6, ease: LUX_EASE }}
              className="relative w-full max-w-xs overflow-hidden border border-[#ffb800]/30 bg-[#0a0a0a] p-8 text-center">
              {Array.from({ length: 14 }, (_, i) => (
                <motion.span key={i} className="absolute" initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6], x: Math.cos((i / 14) * 6.28) * 120, y: Math.sin((i / 14) * 6.28) * 120 }}
                  transition={{ duration: 1.5, delay: 0.1 + i * 0.02, repeat: Infinity, repeatDelay: 0.6, ease: LUX_EASE }}
                  style={{ left: "50%", top: "42%" }}>
                  <Star className="h-3 w-3 fill-[#ffb800] text-[#ffb800]" />
                </motion.span>
              ))}
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#ffb800]"><Trophy className="h-8 w-8 text-[#0a0a0a]" /></div>
                <p className="font-editorial mt-5 text-[26px] font-semibold text-[#f5f5f5]">Goal unlocked</p>
                <p className="mt-2 text-[13px] tracking-tight text-[#f5f5f5]/60">All 30 stars earned — {goalLabel} is fully funded at <span className="font-semibold text-[#ffb800]">{GBP(chart.potValue)}</span>.</p>
                <button onClick={() => setCelebrate(false)} className="mt-6 w-full bg-[#ffb800] py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]">Brilliant</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  );
}
