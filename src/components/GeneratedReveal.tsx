"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Heart, Sparkles, Share2, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * GeneratedReveal — a personalised, dynamically-generated "viral" reveal.
 *
 * This is NOT a static video. Every frame is built at runtime from the pot's
 * own data (recipient, gifts, contributors, amount), so each reveal is unique
 * to that fire. It's the always-available reveal experience used in the demo
 * and as the instant fallback when a bespoke AI video hasn't been generated.
 *
 * The sequence is tuned like creator-made social content: a teasing hook, a
 * countdown, an explosive money-shot, the gifts, a wall of love, and a final
 * screenshot-worthy share card.
 */

export interface RevealGift {
  name: string;
  sub?: string;
  Icon: LucideIcon;
  grad: string;
  glow: string;
  /** Real product photo — shown cinematically in the gifts phase */
  image?: string;
}

export interface RevealContributor {
  name: string;
  initials: string;
  grad: string;
  /** Real portrait photo — shown instead of initials, falls back to initials */
  image?: string;
}

interface GeneratedRevealProps {
  recipientName: string;
  occasion: string;
  totalRaised: number;
  gifts: RevealGift[];
  contributors: RevealContributor[];
  onComplete: () => void;
}

type Phase = "hook" | "countdown" | "boom" | "gifts" | "love" | "share";

const PHASE_ORDER: Phase[] = ["hook", "countdown", "boom", "gifts", "love", "share"];

// Funny, feel-good captions — kept warm, never mean.
const GIFT_CAPTIONS = ["certified glow-up", "this is NOT a drill", "main-character energy", "absolute scenes"];

// ─── Count-up number ────────────────────────────────────────────────────────────

function useCountUp(target: number, run: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return value;
}

// ─── Confetti burst ─────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#f59e0b", "#ffb800", "#f59e0b", "#ffb800", "#ffd166", "#ffb800", "#ffffff"];

function Confetti({ count = 64 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: (Math.random() - 0.5) * 120,
        round: Math.random() > 0.5,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-[-8%]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.4,
            borderRadius: p.round ? "9999px" : "2px",
            background: p.color,
          }}
          initial={{ y: "-10vh", opacity: 0, rotate: p.rotate }}
          animate={{ y: "110vh", x: p.drift, opacity: [0, 1, 1, 0.9], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────

export function GeneratedReveal({
  recipientName,
  occasion,
  totalRaised,
  gifts,
  contributors,
  onComplete,
}: GeneratedRevealProps) {
  const [phase, setPhase] = useState<Phase>("hook");
  const [closing, setClosing] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const goTo = useCallback((next: Phase, delay: number) => {
    const t = setTimeout(() => setPhase(next), delay);
    timers.current.push(t);
  }, []);

  // Drive the auto-advancing sequence.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (phase === "hook") goTo("countdown", 2600);
    else if (phase === "countdown") goTo("boom", 1700);
    else if (phase === "boom") goTo("gifts", 3000);
    else if (phase === "gifts") goTo("love", 3600);
    else if (phase === "love") goTo("share", 3000);
    return () => timers.current.forEach(clearTimeout);
  }, [phase, goTo]);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onComplete, 600);
  }, [onComplete]);

  const skip = useCallback(() => {
    if (phase === "share") return close();
    timers.current.forEach(clearTimeout);
    setPhase("share");
  }, [phase, close]);

  const amount = useCountUp(totalRaised, phase === "boom", 1500);
  const people = contributors.length;
  const fundedGifts = gifts.length;

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          key="generated-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0a]"
          style={{ isolation: "isolate" }}
        >
          {/* Ambient gradient wash */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 50% 30%, rgba(249,115,22,0.18), transparent 60%)",
                "radial-gradient(circle at 50% 40%, rgba(168,85,247,0.20), transparent 60%)",
                "radial-gradient(circle at 50% 30%, rgba(56,189,248,0.18), transparent 60%)",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Skip / close */}
          <button
            onClick={skip}
            className="absolute right-4 z-30 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-[11px] font-semibold text-white/50 backdrop-blur-sm transition-all hover:text-white/90"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <X className="h-3 w-3" />
            {phase === "share" ? "Close" : "Skip"}
          </button>

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-7 text-center">
            <AnimatePresence mode="wait">
              {/* ── HOOK ── */}
              {phase === "hook" && (
                <motion.div
                  key="hook"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center gap-5"
                >
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5"
                  >
                    <Eye className="h-8 w-8 text-amber-300" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-[13px] font-black uppercase tracking-[0.3em] text-amber-300/80">
                    POV: your family actually listened
                  </p>
                  <h2 className="max-w-[16ch] text-[30px] font-black leading-[1.05] text-white">
                    {recipientName} has{" "}
                    <span className="bg-gradient-to-r from-[#ffd166] to-[#ffb800] bg-clip-text text-transparent">
                      no idea
                    </span>{" "}
                    what&apos;s coming…
                  </h2>
                </motion.div>
              )}

              {/* ── COUNTDOWN ── */}
              {phase === "countdown" && (
                <motion.div key="countdown" className="relative flex items-center justify-center">
                  {[3, 2, 1].map((n, i) => (
                    <motion.span
                      key={n}
                      className="absolute text-[160px] font-black text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                      initial={{ opacity: 0, scale: 2.2 }}
                      animate={{ opacity: [0, 1, 1, 0], scale: [2.2, 1, 1, 0.4] }}
                      transition={{ duration: 0.55, delay: i * 0.5, times: [0, 0.25, 0.75, 1] }}
                    >
                      {n}
                    </motion.span>
                  ))}
                </motion.div>
              )}

              {/* ── BOOM ── */}
              {phase === "boom" && (
                <motion.div
                  key="boom"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Confetti count={80} />
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[12px] font-black uppercase tracking-[0.3em] text-white/60"
                  >
                    Billy&apos;s {occasion}
                  </motion.p>
                  <motion.h1
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 14 }}
                    className="text-[88px] font-black leading-none text-white"
                    style={{ fontFamily: "var(--font-display)", textShadow: "0 0 40px rgba(249,115,22,0.5)" }}
                  >
                    £{amount}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-[17px] font-black text-amber-300"
                  >
                    raised by {people} people who love you
                  </motion.p>
                </motion.div>
              )}

              {/* ── GIFTS ── */}
              {phase === "gifts" && (
                <motion.div key="gifts" className="flex w-full max-w-sm flex-col items-center gap-3">
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-1 text-[12px] font-black uppercase tracking-[0.3em] text-white/50"
                  >
                    Unwrapping {fundedGifts} gifts
                  </motion.p>
                  {gifts.map((g, i) => (
                    <motion.div
                      key={g.name}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80, rotate: i % 2 === 0 ? -6 : 6 }}
                      animate={{ opacity: 1, x: 0, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 + i * 0.5 }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm"
                    >
                      {/* Real product photo over a gradient+icon fallback */}
                      <div
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${g.grad}`}
                        style={{ boxShadow: `0 8px 24px ${g.glow}66` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <g.Icon className="h-7 w-7 text-white" strokeWidth={2} />
                        </div>
                        {g.image && (
                          <motion.img
                            src={g.image} alt={g.name} loading="lazy" decoding="async"
                            initial={{ scale: 1.15, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.5 }}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.remove(); }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[15px] font-black text-white">{g.name}</p>
                        {g.sub && <p className="truncate text-[11px] text-white/55">{g.sub}</p>}
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300/80">
                          {GIFT_CAPTIONS[i % GIFT_CAPTIONS.length]}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* ── LOVE ── */}
              {phase === "love" && (
                <motion.div key="love" className="flex w-full max-w-sm flex-col items-center gap-4">
                  <Heart className="h-9 w-9 text-[#ffb800]" fill="currentColor" />
                  <p className="text-[20px] font-black leading-tight text-white">
                    the group chat
                    <br />
                    <span className="bg-gradient-to-r from-[#ffd166] to-[#ffb800] bg-clip-text text-transparent">
                      came through
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    {contributors.map((c, i) => (
                      <motion.div
                        key={c.name}
                        initial={{ opacity: 0, scale: 0.4, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 360, damping: 18, delay: i * 0.12 }}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3"
                      >
                        <span
                          className={`relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${c.grad} text-[10px] font-black text-white`}
                        >
                          {c.initials}
                          {c.image && (
                            <img
                              src={c.image} alt={c.name} loading="lazy" decoding="async"
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.remove(); }}
                            />
                          )}
                        </span>
                        <span className="text-[12px] font-bold text-white/90">{c.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── SHARE CARD ── */}
              {phase === "share" && (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="flex w-full max-w-sm flex-col items-center"
                >
                  <Confetti count={50} />
                  <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-md">
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-300" />
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">
                        Funded with love
                      </span>
                    </div>
                    <h2 className="text-[26px] font-black leading-tight text-white">
                      {recipientName}&apos;s {occasion},
                      <br />
                      made real.
                    </h2>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        [`£${totalRaised}`, "raised"],
                        [String(people), "people"],
                        [String(fundedGifts), "gifts"],
                      ].map(([v, l]) => (
                        <div key={l} className="rounded-2xl bg-white/[0.06] py-3">
                          <p className="text-[22px] font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                            {v}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span className="text-[12px] font-black tracking-tight text-white">Kindled</span>
                    </div>
                  </div>

                  <button
                    onClick={close}
                    className="mt-5 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffb800] to-[#f59e0b] px-7 py-3.5 text-[15px] font-black text-stone-900 shadow-lg transition-transform active:scale-95"
                  >
                    <Share2 className="h-4 w-4" />
                    Share this moment
                  </button>
                  <p className="mt-3 text-[11px] text-white/40">screenshot-worthy, certified</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="absolute inset-x-0 z-20 flex justify-center gap-1.5" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
            {PHASE_ORDER.map((p) => (
              <div
                key={p}
                className={`h-1 rounded-full transition-all duration-300 ${
                  PHASE_ORDER.indexOf(p) <= PHASE_ORDER.indexOf(phase) ? "w-6 bg-white" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
