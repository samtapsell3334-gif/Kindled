"use client";

import { useState, useCallback, useRef, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Repeat, Plus, Minus, Check, Lock, Unlock,
  ScrollText, Trophy, ChevronUp, ChevronDown, ListChecks, X,
} from "lucide-react";
import {
  STAR_COUNT, calculateStarValue, createChart, setGoalValue, awardBehavior,
  isGoalUnlocked, DEFAULT_BEHAVIORS, type Behavior, type StarChartState,
} from "@/lib/star-engine";
import { VH_BOUNCE } from "@/lib/motion";
import { useBloom } from "@/components/lux/Bloom";

type ManagedBehavior = Behavior & { enabled: boolean };

const GBP = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const GBP0 = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

// ── Quest-path geometry: a flowing S-snake the 30 nodes sit on ──
const VB_W = 100, VB_H = 232;
const PAD = 13, CX = 50, AMP = 33, TURNS = 4.5;
function nodeAt(i: number) {
  const t = i / (STAR_COUNT - 1);
  return { x: CX + AMP * Math.sin(t * TURNS * Math.PI), y: PAD + t * (VB_H - 2 * PAD) };
}
const PATH_D = (() => {
  let d = "";
  const N = 260;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const x = CX + AMP * Math.sin(t * TURNS * Math.PI);
    const y = PAD + t * (VB_H - 2 * PAD);
    d += `${k === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
})();

export function StarChart({
  goalValue = 150,
  goalLabel = "Billy's Nintendo Switch",
}: { goalValue?: number; goalLabel?: string }) {
  const [chart, setChart] = useState<StarChartState>(() => createChart(goalValue, 7));
  const [behaviors, setBehaviors] = useState<ManagedBehavior[]>(() => DEFAULT_BEHAVIORS.map((b) => ({ ...b })));
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [celebrate, setCelebrate] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newStars, setNewStars] = useState(1);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { bloom, trigger } = useBloom();

  const starValue = calculateStarValue(chart.goalValue);
  const unlocked = isGoalUnlocked(chart);
  const progress = chart.starsFilled / STAR_COUNT;
  const now = Date.now();

  const applyAward = useCallback((behavior: Behavior, e?: MouseEvent) => {
    if (e) trigger(e.clientX, e.clientY);
    setChart((prev) => {
      if (isGoalUnlocked(prev)) return prev;
      const next = awardBehavior(prev, behavior);
      const filled = new Set<number>();
      for (let i = prev.starsFilled; i < next.starsFilled; i++) filled.add(i);
      if (filled.size) {
        setPopping(filled);
        if (popTimer.current) clearTimeout(popTimer.current);
        popTimer.current = setTimeout(() => setPopping(new Set()), 900);
        if (!isGoalUnlocked(prev) && isGoalUnlocked(next)) { setCelebrate(true); setTimeout(() => setCelebrate(false), 5000); }
      }
      return next;
    });
  }, [trigger]);

  const litNode = (i: number, e: MouseEvent) => {
    if (i !== chart.starsFilled) return;
    applyAward({ id: "node", description: "Lit a star", starsAwarded: 1, isRecurring: false }, e);
  };
  const changeGoal = (d: number) => setChart((p) => setGoalValue(p, Math.max(30, p.goalValue + d)));
  const toggleBehavior = (id: string) => setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  const adjustStars = (id: string, d: number) => setBehaviors((bs) => bs.map((b) => (b.id === id ? { ...b, starsAwarded: Math.max(1, Math.min(5, b.starsAwarded + d)) } : b)));
  const createBehavior = () => {
    const name = newTask.trim();
    if (!name) return;
    // 1/30th constraint: a single task can never award more than the 30-star chart holds.
    const stars = Math.max(1, Math.min(STAR_COUNT, newStars));
    setBehaviors((bs) => [...bs, { id: `custom_${Date.now()}`, description: name, starsAwarded: stars, isRecurring: true, enabled: true }]);
    setNewTask("");
    setNewStars(1);
  };

  return (
    <div className="vh vh-paper min-h-screen pb-28">
      {bloom}

      {/* ── Header — elegant text, no bar ── */}
      <div className="relative z-[1] px-6 pb-2 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">Star Quest</p>
            <h2 className="font-editorial mt-1 text-[30px] font-semibold leading-[0.98] text-[#0f172a]">{goalLabel}</h2>
            <p className="mt-2 text-[13px] text-[#0f172a]/55">
              <span className="font-bold text-[#0f172a]">{chart.starsFilled}</span> of {STAR_COUNT} stars lit
              <span className="text-[#0f172a]/30"> · </span>
              <span className="font-semibold text-[#f59e0b]">{GBP0(chart.potValue)}</span> of {GBP0(chart.goalValue)}
            </p>
          </div>
          <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${unlocked ? "bg-[#ffb800] text-white" : "bg-[#fffdf7] text-[#0f172a]/50 vh-lift"}`}>
            {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {unlocked ? "Unlocked" : `1★ = ${GBP(starValue)}`}
          </span>
        </div>
      </div>

      {/* ── The Quest Path ── */}
      <div className="relative z-[1] mx-auto w-full max-w-md px-4">
        <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none"
            style={{ filter: "drop-shadow(0 3px 4px rgba(15,23,42,0.12))", overflow: "visible" }}>
            {/* muted base track */}
            <path d={PATH_D} fill="none" stroke="#e3d8bd" strokeWidth="4.5" strokeLinecap="round" />
            <path d={PATH_D} fill="none" stroke="#d8ccab" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 7" />
            {/* amber filled trail */}
            <motion.path d={PATH_D} fill="none" stroke="#ffb800" strokeWidth="3" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 2px rgba(255,184,0,0.7))" }}
              initial={false} animate={{ pathLength: progress }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>

          {/* 30 nodes */}
          {Array.from({ length: STAR_COUNT }, (_, i) => {
            const p = nodeAt(i);
            const earned = i < chart.starsFilled;
            const isNext = i === chart.starsFilled && !unlocked;
            const pop = popping.has(i);
            return (
              <motion.button key={i} onClick={(e) => litNode(i, e)} disabled={!isNext}
                className="absolute flex items-center justify-center rounded-full"
                style={{ left: `${p.x}%`, top: `${(p.y / VB_H) * 100}%`, width: 30, height: 30, transform: "translate(-50%,-50%)",
                  background: earned ? "#ffb800" : "#ded2b6",
                  boxShadow: earned
                    ? "0 0 0 4px rgba(255,184,0,0.18), 0 4px 10px rgba(245,158,11,0.45), inset 0 1px 1px rgba(255,255,255,0.5)"
                    : "inset 0 1px 2px rgba(15,23,42,0.18), 0 1px 2px rgba(15,23,42,0.08)",
                  cursor: isNext ? "pointer" : "default" }}
                animate={pop ? { scale: [0.6, 1.35, 1] } : earned ? { scale: [1, 1.06, 1] } : isNext ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={pop ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  : earned ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                  : isNext ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                whileTap={isNext ? { scale: 0.85 } : {}}>
                {earned
                  ? <Star className="h-3.5 w-3.5 fill-white text-white" />
                  : isNext ? <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                  : <span className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/15" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Floating "Behaviours" trigger ── */}
      <div className="relative z-[1] mt-2 flex justify-center px-6">
        <motion.button whileTap={{ scale: 0.94 }} transition={VH_BOUNCE} onClick={() => setDrawer(true)}
          className="flex items-center gap-2.5 rounded-full bg-[#0f172a] px-6 py-3.5 text-[14px] font-bold text-[#fdf6e3] vh-lift-lg">
          <ListChecks className="h-4 w-4 text-[#ffb800]" /> Behaviours &amp; rewards
        </motion.button>
      </div>

      {/* ── Side Drawer ── */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)} className="fixed inset-0 z-[70] bg-[#0f172a]/40 backdrop-blur-sm" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="font-outfit fixed inset-y-0 right-0 z-[71] flex w-[88%] max-w-sm flex-col bg-[#fdf6e3] shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.3)]">
              <div className="flex items-center justify-between px-6 pb-3 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b]">Star Quest</p>
                  <h3 className="font-editorial text-[24px] font-semibold text-[#0f172a]">Behaviours</h3>
                </div>
                <button onClick={() => setDrawer(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffdf7] text-[#0f172a]/50 vh-lift"><X className="h-4 w-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-10">
                {/* Goal value */}
                <div className="flex items-center justify-between rounded-2xl bg-[#fffdf7] px-4 py-3 vh-lift">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0f172a]/40">Goal · 1 star</p>
                    <p className="text-[15px] font-bold text-[#0f172a]">{GBP0(chart.goalValue)} <span className="text-[#0f172a]/30">·</span> <span className="text-[#f59e0b]">{GBP(starValue)}</span></p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => changeGoal(-30)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdf6e3] text-[#0f172a]/60"><ChevronDown className="h-4 w-4" /></button>
                    <button onClick={() => changeGoal(30)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdf6e3] text-[#0f172a]/60"><ChevronUp className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Behaviour list */}
                <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0f172a]/40">Routines</p>
                <div className="space-y-2.5">
                  {behaviors.map((b) => (
                    <div key={b.id} className={`rounded-2xl bg-[#fffdf7] px-4 py-3 transition-opacity ${b.enabled ? "vh-lift" : "opacity-50"}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleBehavior(b.id)} aria-label={`Toggle ${b.description}`}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${b.enabled ? "bg-[#ff6b6b]" : "bg-[#0f172a]/15"}`}>
                          <motion.span layout className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow" style={{ left: b.enabled ? "calc(100% - 18px)" : "2px" }} />
                        </button>
                        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#0f172a]">{b.description}</p>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#f59e0b]">{b.isRecurring && <Repeat className="h-3 w-3" />}{b.starsAwarded}★</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[#0f172a]/40">Stars</span>
                          <button onClick={() => adjustStars(b.id, -1)} disabled={!b.enabled} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fdf6e3] text-[#0f172a]/60 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                          <span className="w-4 text-center text-[14px] font-bold text-[#0f172a]">{b.starsAwarded}</span>
                          <button onClick={() => adjustStars(b.id, 1)} disabled={!b.enabled} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fdf6e3] text-[#0f172a]/60 disabled:opacity-30"><Plus className="h-3 w-3" /></button>
                        </div>
                        <motion.button whileTap={{ scale: 0.93 }} transition={VH_BOUNCE} onClick={(e) => { applyAward(b, e); }} disabled={!b.enabled || unlocked}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-[#ff6b6b] px-4 text-[12px] font-bold text-white disabled:bg-[#0f172a]/10 disabled:text-[#0f172a]/35">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create your own — bespoke input, 1/30th constrained */}
                <div className="mt-3 rounded-2xl bg-[#fffdf7] p-4 vh-lift">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0f172a]/40">Create your own</p>
                  <div className="flex items-center gap-2 rounded-xl bg-[#fdf6e3] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#ff6b6b]/40">
                    <input
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value.slice(0, 40))}
                      onKeyDown={(e) => { if (e.key === "Enter") createBehavior(); }}
                      placeholder="e.g. Walked the dog"
                      className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#0f172a] placeholder:text-[#0f172a]/35 focus:outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => setNewStars((s) => Math.max(1, s - 1))} className="flex h-6 w-6 items-center justify-center rounded-md bg-[#fffdf7] text-[#0f172a]/50"><Minus className="h-3 w-3" /></button>
                      <span className="flex w-8 items-center justify-center gap-0.5 text-[13px] font-bold text-[#f59e0b]">{newStars}<Star className="h-3 w-3 fill-[#f59e0b]" /></span>
                      <button onClick={() => setNewStars((s) => Math.min(5, s + 1))} className="flex h-6 w-6 items-center justify-center rounded-md bg-[#fffdf7] text-[#0f172a]/50"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.96 }} transition={VH_BOUNCE} onClick={createBehavior} disabled={!newTask.trim()}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0f172a] py-3 text-[13px] font-bold text-[#fdf6e3] disabled:opacity-40">
                    <Plus className="h-4 w-4 text-[#f59e0b]" strokeWidth={3} /> Add task ({GBP(newStars * starValue)})
                  </motion.button>
                </div>

                {/* Audit log */}
                <p className="mb-2 mt-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0f172a]/40"><ScrollText className="h-3.5 w-3.5" /> Star history</p>
                {chart.auditLog.length === 0 ? (
                  <p className="text-[12px] text-[#0f172a]/40">No stars lit yet — every one is logged here.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {chart.auditLog.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 rounded-xl bg-[#fffdf7] px-3 py-2">
                        <Star className="h-3.5 w-3.5 shrink-0 fill-[#ffb800] text-[#ffb800]" />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-[#0f172a]/70"><span className="font-semibold text-[#0f172a]">{a.behaviorDescription}</span> · +{a.starsAwarded}★</span>
                        <span className="shrink-0 text-[12px] font-bold text-[#f59e0b]">+{GBP(a.valueAdded)}</span>
                        <span className="shrink-0 text-[10px] text-[#0f172a]/30">{timeAgo(a.timestamp, now)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Confetti bloom at 30/30 ── */}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0f172a]/35 backdrop-blur-[2px] px-6" onClick={() => setCelebrate(false)}>
            {/* elegant golden shapes */}
            {Array.from({ length: 28 }, (_, i) => {
              const ang = (i / 28) * Math.PI * 2;
              const dist = 150 + (i % 4) * 26;
              const gold = ["#ffb800", "#f59e0b", "#e8b04b", "#ffce63"][i % 4];
              const shape = i % 3;
              return (
                <motion.span key={i} className="absolute" style={{ left: "50%", top: "44%" }}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.6], x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 30, rotate: 180 + i * 12 }}
                  transition={{ duration: 1.9, delay: 0.05 + (i % 7) * 0.04, repeat: Infinity, repeatDelay: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  <span style={{ display: "block", background: gold,
                    width: shape === 0 ? 7 : 5, height: shape === 1 ? 12 : 5,
                    borderRadius: shape === 2 ? "50%" : 1, transform: shape === 0 ? "rotate(45deg)" : "none",
                    boxShadow: `0 1px 3px rgba(245,158,11,0.4)` }} />
                </motion.span>
              );
            })}
            <motion.div initial={{ scale: 0.8, y: 18 }} animate={{ scale: 1, y: 0 }} transition={VH_BOUNCE}
              className="relative w-full max-w-xs overflow-hidden rounded-[28px] bg-[#fffdf7] p-8 text-center vh-lift-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffb800]"><Trophy className="h-8 w-8 text-white" /></div>
              <p className="font-editorial mt-4 text-[26px] font-semibold text-[#0f172a]">Quest complete!</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#0f172a]/60">All 30 stars lit — {goalLabel} is fully funded at <span className="font-bold text-[#f59e0b]">{GBP(chart.potValue)}</span>.</p>
              <button onClick={() => setCelebrate(false)} className="mt-6 w-full rounded-2xl bg-[#ff6b6b] py-3.5 text-[14px] font-bold text-white vh-lift">Wonderful</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
