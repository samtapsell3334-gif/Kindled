"use client";

/**
 * RevealExperience (v5 WS-R1/R2/R3a/R4) — the moment.
 *
 * SEALED → (tap) → IGNITION → THE NUMBER → THE PEOPLE → THE WORDS → THE FACES →
 * THE GIFT → (options, if the organiser still has to choose) → SHARE.
 *
 * Design rules implemented here:
 * - Tap-to-advance (receiver controls the pace); skip + replay always available.
 * - The Ignition: canvas ember particles (upward drift, warm palette, hand-drawn
 *   wobble) — no stock confetti, no DOM particles. Exported for reuse (v6 films).
 * - Sound: WebAudio-SYNTHESISED riser/strike/whoosh/swell — original by
 *   construction, zero copyright exposure (TODO-FOUNDER: commissioned signature
 *   audio slots straight in). Starts only on the ritual tap; mute persists.
 * - Haptics: Vibration API, feature-detected (silent no-op elsewhere).
 * - Photosensitivity: no flashes at all — warmth and bloom only (WCAG 2.3.1).
 * - Reduced motion: typography-led static beats; the content still lands.
 * - Kid pots: wholesome pacing/copy, star-chart celebration beat, no countdown
 *   pressure, nothing casino-like.
 * - Peak-end: the sequence ends on human content and the share moment — never
 *   on a menu. Partial funding is celebrated equally (what was raised).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Flame, Volume2, VolumeX, X, Star, Gift, Share2, Check, Heart } from "lucide-react";
import type { RevealOutcome } from "@/lib/sandbox/types";
import { KindleRecord } from "@/components/KindleRecord";

// ─── Ignition — reusable canvas ember system (WS-R2) ────────────────────────────

export function Ignition({ intensity = 1, className = "" }: { intensity?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    interface Ember { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; hue: number; wob: number }
    const embers: Ember[] = [];
    const spawn = () => {
      const w = canvas.width, h = canvas.height;
      embers.push({
        x: w * (0.35 + Math.random() * 0.3), y: h * (0.75 + Math.random() * 0.2),
        vx: (Math.random() - 0.5) * 0.6, vy: -(0.6 + Math.random() * 1.4) * dpr,
        r: (1 + Math.random() * 2.5) * dpr, life: 0, max: 90 + Math.random() * 80,
        hue: 25 + Math.random() * 25, wob: Math.random() * Math.PI * 2,
      });
    };
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < Math.round(2 * intensity); i++) if (embers.length < 140) spawn();
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]!;
        e.life++;
        e.wob += 0.08;
        e.x += e.vx + Math.sin(e.wob) * 0.45; // hand-drawn wobble
        e.y += e.vy;
        const t = e.life / e.max;
        if (t >= 1) { embers.splice(i, 1); continue; }
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${e.hue}, 95%, ${58 + t * 12}%, ${alpha * 0.9})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [intensity]);
  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true" />;
}

// ─── Synthesised audio (WS-R3a) — original by construction ─────────────────────

function useRevealAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const ensure = () => {
    if (!ctxRef.current && typeof AudioContext !== "undefined") ctxRef.current = new AudioContext();
    return ctxRef.current;
  };
  const play = useCallback((kind: "strike" | "whoosh" | "swell" | "tick") => {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(ctx.destination);
    if (kind === "strike" || kind === "whoosh") {
      // filtered noise burst / sweep
      const len = kind === "strike" ? 0.12 : 0.9;
      const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(kind === "strike" ? 2400 : 400, t);
      if (kind === "whoosh") f.frequency.exponentialRampToValueAtTime(1800, t + len);
      src.connect(f); f.connect(g);
      g.gain.setValueAtTime(kind === "strike" ? 0.25 : 0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      src.start(t); src.stop(t + len);
    } else if (kind === "swell") {
      // warm detuned swell
      [220, 277.18, 329.63].forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = "sine"; o.frequency.value = freq * (1 + (i - 1) * 0.002);
        o.connect(g); o.start(t); o.stop(t + 2.2);
      });
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    } else {
      const o = ctx.createOscillator();
      o.type = "triangle"; o.frequency.value = 880;
      o.connect(g);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.start(t); o.stop(t + 0.08);
    }
  }, [muted]);
  return play;
}

const buzz = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch { /* no-op */ }
};

// ─── Share card (WS-R3) — canvas-generated 9:16 story image ────────────────────

function drawShareCard(opts: { raised: number; people: number; recipientName: string; slug: string }): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1920;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#1a0800"); grad.addColorStop(1, "#050200");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);
  // embers
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 1080, 500 + Math.random() * 1300, 2 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${25 + Math.random() * 25}, 95%, 60%, ${0.15 + Math.random() * 0.5})`;
    ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 64px system-ui";
  ctx.fillText("THE REVEAL", 540, 420);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 200px system-ui";
  ctx.fillText(`£${opts.raised.toLocaleString()}`, 540, 720);
  ctx.font = "600 72px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${opts.people} people`, 540, 880);
  ctx.fillText(`one very happy ${opts.recipientName}`, 540, 990);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 56px system-ui";
  ctx.fillText("Kindled", 540, 1700);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "44px system-ui";
  ctx.fillText(`kindledgift.co.uk/p/${opts.slug}?ref=${opts.slug}`, 540, 1780);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

// ─── The experience ─────────────────────────────────────────────────────────────

type Beat = "sealed" | "ignition" | "number" | "people" | "words" | "faces" | "gift" | "options" | "share";

export interface RevealMsg { displayName: string; text?: string; videoRef?: string }

export interface RevealExperienceProps {
  slug: string;
  recipientName: string;
  eventDate: string;
  raised: number;
  goal: number;
  isChild: boolean;
  contributors: { displayName: string; amount: number }[];
  messages: RevealMsg[];
  items: { name: string; price: number }[];
  /** Organiser choosing the outcome live (pot still open). */
  canChooseOutcome: boolean;
  onOutcome?: (outcome: RevealOutcome, retailer?: string) => Promise<void>;
  existingOutcome?: RevealOutcome;
  onClose: () => void;
}

export function RevealExperience(p: RevealExperienceProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState<Beat>("sealed");
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("kindled-reveal-muted") === "1"; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem("kindled-reveal-muted", muted ? "1" : "0"); } catch { /* ignore */ } }, [muted]);
  const [shown, setShown] = useState(0); // counters within words/faces beats
  const [count, setCount] = useState(0);
  const [outcomeBusy, setOutcomeBusy] = useState(false);
  const [chosen, setChosen] = useState<RevealOutcome | null>(p.existingOutcome ?? null);
  const [shared, setShared] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [reactionRef, setReactionRef] = useState<string | null>(null);
  const play = useRevealAudio(muted);
  const announce = useRef<HTMLParagraphElement>(null);

  const texts = useMemo(() => p.messages.filter((m) => m.text), [p.messages]);
  const videos = useMemo(() => p.messages.filter((m) => m.videoRef), [p.messages]);
  const pct = p.goal > 0 ? Math.round((p.raised / p.goal) * 100) : 100;
  const fullyFunded = pct >= 100;

  const beacon = useCallback((step: string) => {
    void fetch(`/api/sandbox/pots/${p.slug}/contribute?step=${step}`, { method: "PUT" }).catch(() => {});
  }, [p.slug]);

  // Beat order, skipping empties. Options only when the organiser must choose.
  const order = useMemo<Beat[]>(() => {
    const b: Beat[] = ["sealed", "ignition", "number", "people"];
    if (texts.length) b.push("words");
    if (videos.length) b.push("faces");
    b.push("gift");
    if (p.canChooseOutcome) b.push("options");
    b.push("share");
    return b;
  }, [texts.length, videos.length, p.canChooseOutcome]);

  const next = useCallback(() => {
    setBeat((cur) => {
      const i = order.indexOf(cur);
      const n = order[Math.min(i + 1, order.length - 1)]!;
      if (announce.current) announce.current.textContent = `Now showing: ${n}`;
      return n;
    });
    setShown(0);
  }, [order]);

  // Ignition auto-advances (it's a transition, ~2.5s); everything else is a tap.
  useEffect(() => {
    if (beat === "ignition") {
      play("strike"); buzz([30, 60, 30]);
      const t1 = setTimeout(() => play("whoosh"), 350);
      const t2 = setTimeout(next, reduce ? 600 : 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (beat === "number") {
      play("swell"); buzz(80);
      if (reduce) { setCount(p.raised); return; }
      let raf = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1800);
        setCount(Math.round(p.raised * (1 - Math.pow(1 - t, 3)))); // fire-growth ease, not fruit-machine
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [beat, next, play, reduce, p.raised]);

  const begin = () => { buzz(30); next(); };

  async function choose(outcome: RevealOutcome, retailer?: string) {
    if (!p.onOutcome) return;
    setOutcomeBusy(true);
    try { await p.onOutcome(outcome, retailer); setChosen(outcome); next(); }
    finally { setOutcomeBusy(false); }
  }

  async function shareCard() {
    const blob = await drawShareCard({ raised: p.raised, people: p.contributors.length, recipientName: p.recipientName, slug: p.slug });
    beacon("share_card");
    if (!blob) return;
    const file = new File([blob], "kindled-reveal.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "The reveal", url: `${location.origin}/p/${p.slug}?ref=${p.slug}` }).catch(() => {});
      beacon("share_completed");
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "kindled-reveal.png"; a.click();
      URL.revokeObjectURL(url);
      beacon("share_completed");
    }
    setShared(true);
  }

  const tapToAdvance = !["sealed", "ignition", "words", "faces", "options", "share"].includes(beat);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#0a0400] text-white"
      onClick={tapToAdvance ? next : undefined}
      role="region"
      aria-label="The reveal"
    >
      {/* screen-reader beat announcements */}
      <p ref={announce} className="sr-only" aria-live="polite" />

      {/* embers behind everything (skipped for reduced motion) */}
      {!reduce && beat !== "sealed" && <Ignition intensity={beat === "ignition" ? 2.4 : 0.8} className="absolute inset-0 h-full w-full" />}

      {/* persistent controls */}
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }} aria-label={muted ? "Unmute" : "Mute"}
          className="rounded-full bg-white/10 p-2.5">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        {beat !== "share" && (
          <button onClick={(e) => { e.stopPropagation(); setBeat("share"); }} aria-label="Skip to the end"
            className="rounded-full bg-white/10 px-3.5 py-2.5 text-[11px] font-bold">Skip</button>
        )}
        <button onClick={(e) => { e.stopPropagation(); p.onClose(); }} aria-label="Close"
          className="rounded-full bg-white/10 p-2.5"><X className="h-4 w-4" /></button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {beat === "sealed" && (
          <div>
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15" style={reduce ? undefined : { animation: "pulse 2.4s ease-in-out infinite" }}>
              <Flame className="h-9 w-9 text-amber-400" />
            </span>
            <p className="mt-6 text-[13px] uppercase tracking-[0.25em] text-amber-400/70">
              Sealed · {p.contributors.length} {p.isChild ? "people who love you" : "people"}
            </p>
            <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-3 text-[32px] font-bold leading-tight">
              {p.recipientName}, something&apos;s been kept warm for you
            </h1>
            <button onClick={begin} className="mt-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-4 text-[16px] font-bold text-stone-900">
              Tap to begin the reveal
            </button>
          </div>
        )}

        {beat === "ignition" && (
          <p style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-bold text-amber-300/90">
            {reduce ? "It begins…" : ""}
          </p>
        )}

        {beat === "number" && (
          <div>
            <p className="text-[13px] uppercase tracking-[0.25em] text-amber-400/70">Together, everyone raised</p>
            <p style={{ fontFamily: "var(--font-display)" }} className="mt-3 text-[88px] font-black leading-none tabular-nums">£{count.toLocaleString()}</p>
            {!fullyFunded && <p className="mt-3 text-[15px] text-white/60">towards the goal — and that&apos;s worth celebrating</p>}
            <p className="mt-8 text-[12px] text-white/40">Tap to continue</p>
          </div>
        )}

        {beat === "people" && (
          <div>
            <p className="text-[13px] uppercase tracking-[0.25em] text-amber-400/70">Made possible by</p>
            <p style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-[40px] font-bold">{p.contributors.length} people</p>
            <div className="mt-5 flex max-w-sm flex-wrap justify-center gap-2">
              {p.contributors.map((c, i) => (
                <span key={i} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-[13px] font-semibold text-amber-100">{c.displayName}</span>
              ))}
            </div>
            <p className="mt-8 text-[12px] text-white/40">Tap to continue</p>
          </div>
        )}

        {beat === "words" && texts[shown] && (
          <div onClick={(e) => { e.stopPropagation(); if (shown < texts.length - 1) { setShown(shown + 1); play("tick"); } else next(); }} className="w-full max-w-sm cursor-pointer">
            <div className="rounded-3xl border border-amber-400/25 bg-white/[0.06] p-7 backdrop-blur-sm">
              <p className="text-[19px] leading-relaxed">&ldquo;{texts[shown].text}&rdquo;</p>
              <p className="mt-4 text-[14px] font-bold text-amber-300">— {texts[shown].displayName}</p>
            </div>
            <p className="mt-4 text-[12px] text-white/40">{shown + 1} of {texts.length} · tap for the next</p>
          </div>
        )}

        {beat === "faces" && videos[shown] && (
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <video key={videos[shown].videoRef} src={videos[shown].videoRef} autoPlay playsInline controls className="w-full rounded-3xl bg-black" style={{ aspectRatio: "3/4" }} />
            <p className="mt-2 text-[14px] font-bold text-amber-300">— {videos[shown].displayName}</p>
            <button onClick={() => { if (shown < videos.length - 1) setShown(shown + 1); else next(); }}
              className="mt-3 rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-bold">
              {shown < videos.length - 1 ? "Next video" : "Continue"}
            </button>
          </div>
        )}

        {beat === "gift" && (
          <div>
            {p.isChild && <div className="mb-4 flex justify-center gap-1.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-7 w-7 fill-amber-400 text-amber-400" />)}</div>}
            <p className="text-[13px] uppercase tracking-[0.25em] text-amber-400/70">{fullyFunded ? "It all unlocks" : "Within reach"}</p>
            <div className="mx-auto mt-4 max-w-sm space-y-2">
              {p.items.slice(0, 4).map((it) => (
                <div key={it.name} className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-white/[0.05] px-5 py-3.5">
                  <span className="flex items-center gap-2 text-[15px] font-semibold"><Gift className="h-4 w-4 text-amber-400" />{it.name}</span>
                  <span className="text-[14px] font-bold text-amber-300">£{it.price}</span>
                </div>
              ))}
            </div>
            {p.isChild && <p className="mt-4 text-[14px] text-amber-100/80">Every star you earned helped light this. ⭐</p>}
            <p className="mt-6 text-[12px] text-white/40">Tap to continue</p>
          </div>
        )}

        {beat === "options" && (
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <p style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-bold">
              {fullyFunded ? "Fully funded — choose how to take it" : `You're ${pct}% of the way — your choice`}
            </p>
            <div className="mt-5 grid gap-2.5">
              <button disabled={outcomeBusy} onClick={() => { void choose("gift_card", "Smyths"); }}
                className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">
                Take it now — convert to a gift card
              </button>
              <button disabled={outcomeBusy} onClick={() => { void choose("stack"); }}
                className="rounded-2xl border border-amber-400/40 bg-white/[0.06] py-3.5 text-[14px] font-bold">
                Keep it building — stack to the next occasion
                <span className="block text-[11px] font-medium text-amber-200/70">
                  Carried forward, your £{p.raised} starts the next pot at {p.goal > 0 ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0}% of this goal
                </span>
              </button>
              <button disabled={outcomeBusy} onClick={() => { void choose("product"); }}
                className="rounded-2xl border border-white/15 bg-white/[0.04] py-3.5 text-[14px] font-bold">
                Mark the gift as purchased
              </button>
            </div>
            <p className="mt-3 text-[11px] text-white/40">All three are wins — nothing raised is ever lost.</p>
          </div>
        )}

        {beat === "share" && (
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Heart className="mx-auto h-9 w-9 fill-amber-400 text-amber-400" />
            <p style={{ fontFamily: "var(--font-display)" }} className="mt-3 text-[26px] font-bold">
              {chosen === "stack" ? "The fire carries on" : "That's the moment"}
            </p>
            <p className="mt-2 text-[14px] text-white/60">£{p.raised.toLocaleString()} · {p.contributors.length} people · one very happy {p.recipientName}</p>
            {reacting ? (
              <div className="mt-5 text-left">
                <p className="mb-2 text-[12px] text-white/60">Film {p.isChild ? "their face for the family" : "the reaction"} — you can delete or re-record before anything is kept.</p>
                <KindleRecord contributionId={`reaction_${p.slug}`} onRecorded={(m) => { setReactionRef(m.url); setReacting(false); beacon("reaction"); }} onCancel={() => setReacting(false)} />
              </div>
            ) : reactionRef ? (
              <p className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-[13px] font-semibold text-emerald-200">Reaction saved — share it below ✓</p>
            ) : (
              <button onClick={() => setReacting(true)} className="mt-5 w-full rounded-2xl border border-amber-400/40 bg-white/[0.06] py-3.5 text-[14px] font-bold">
                Film the reaction
              </button>
            )}
            <div className="mt-3 grid gap-2.5">
              <button onClick={() => { void shareCard(); }} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">
                {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} {shared ? "Shared" : "Share the moment"}
              </button>
              <button onClick={() => { beacon("thankyou"); setThanked(true); }} disabled={thanked}
                className="rounded-2xl border border-white/15 bg-white/[0.05] py-3.5 text-[14px] font-bold disabled:opacity-60">
                {thanked ? "Thank-you sent to everyone who chipped in ✓" : "Send a thank-you to everyone"}
              </button>
              <button onClick={() => { setBeat("sealed"); setShown(0); setCount(0); }}
                className="rounded-2xl border border-white/10 py-3 text-[13px] font-semibold text-white/60">
                Replay the reveal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
