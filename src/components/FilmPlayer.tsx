"use client";

/**
 * FilmPlayer (v6 WS-V1) — the code-played film engine.
 *
 * Plays scripted, timed scenes live in the browser (see PLAN.md: chosen over
 * Remotion for this environment). Captions-first: the caption bar is always on,
 * so the films land fully muted — the founder VO (see VO-RECORDING-GUIDE.md) is
 * an optional upgrade detected at runtime. Brand-system visuals only; the v5
 * Ignition opens both films. Reduced motion: manual scene stepping, content
 * carried by typography. No copyrighted audio, no stock footage, no TTS.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, Flame } from "lucide-react";
import { Ignition } from "@/components/RevealExperience";
import { track } from "@/lib/analytics";

export interface FilmScene {
  /** Seconds on screen. */
  dur: number;
  /** Burned caption — always visible. */
  caption: string;
  /** Big on-screen line (optional). */
  headline?: string;
  visual: "ignition" | "pain" | "potfill" | "split" | "wedge" | "flywheel" | "timeline" | "bars" | "reveal" | "endcard";
  /** Small print, e.g. a source or a placeholder label. */
  note?: string;
}

export interface Film {
  id: string;
  title: string;
  scenes: FilmScene[];
  /** Optional VO audio URL — enabled only if it loads (captions stay on). */
  voSrc?: string;
}

function Visual({ scene, animate }: { scene: FilmScene; animate: boolean }) {
  const v = scene.visual;
  if (v === "ignition") return <Ignition intensity={2} className="absolute inset-0 h-full w-full" />;
  if (v === "pain") {
    return (
      <div className="grid grid-cols-2 gap-2 px-6">
        {["“What does she want??”", "Two of the same present", "“Everyone send me £10”", "The unwanted-gift drawer"].map((x, i) => (
          <div key={x} className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-[12px] font-semibold text-rose-100"
            style={animate ? { animation: `film-pop 0.5s ${i * 0.15}s both` } : undefined}>{x}</div>
        ))}
      </div>
    );
  }
  if (v === "potfill" || v === "reveal") {
    return (
      <div className="w-full px-10">
        {v === "reveal" && <p className="mb-3 text-center text-[44px] font-black text-white" style={{ fontFamily: "var(--font-display)" }}>£450</p>}
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            style={animate ? { animation: "film-fill 2.4s ease-out both" } : { width: "78%" }} />
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {["J", "P", "A", "G", "+"].map((c, i) => (
            <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-200"
              style={animate ? { animation: `film-pop 0.4s ${0.4 + i * 0.2}s both` } : undefined}>{c}</span>
          ))}
        </div>
      </div>
    );
  }
  if (v === "split") {
    return (
      <div className="grid w-full grid-cols-2 gap-3 px-6">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-[12px] font-bold text-amber-200">Fully funded</p>
          <p className="mt-1 text-[11px] text-white/70">→ gift cards → commission</p>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-[12px] font-bold text-amber-200">Partly funded</p>
          <p className="mt-1 text-[11px] text-white/70">→ gift card or stacked forward</p>
        </div>
      </div>
    );
  }
  if (v === "wedge") {
    return (
      <div className="relative flex h-40 w-full items-center justify-center">
        <span className="z-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-[12px] font-bold text-stone-900">The child&apos;s list</span>
        {["Grandma", "Uncle", "Auntie", "Friends"].map((who, i) => (
          <span key={who} className="absolute rounded-full border border-amber-400/40 bg-[#1a0f00] px-3 py-1.5 text-[11px] font-semibold text-amber-100"
            style={{ transform: `rotate(${i * 90}deg) translateY(-64px) rotate(${-i * 90}deg)`, ...(animate ? { animation: `film-pop 0.4s ${0.3 + i * 0.2}s both` } : {}) }}>{who}</span>
        ))}
      </div>
    );
  }
  if (v === "flywheel") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-6 text-[12px] font-bold text-amber-100">
        {["Pot", "→", "Contributors", "→", "Their pots", "→", "Repeat"].map((x, i) => (
          <span key={i} className={x === "→" ? "text-amber-400" : "rounded-full border border-amber-400/40 px-3 py-1.5"}
            style={animate ? { animation: `film-pop 0.35s ${i * 0.18}s both` } : undefined}>{x}</span>
        ))}
      </div>
    );
  }
  if (v === "timeline") {
    return (
      <div className="w-full space-y-2 px-8">
        {[["Phase 1", "Gift card commissions — live from launch"], ["Phase 2", "Retail media on first-party gifting intent"], ["Roadmap", "Clean-room partnerships"]].map(([a, b], i) => (
          <div key={a} className="flex items-center gap-3" style={animate ? { animation: `film-pop 0.4s ${i * 0.5}s both` } : undefined}>
            <span className="w-20 shrink-0 rounded-full bg-amber-400/20 py-1 text-center text-[11px] font-bold text-amber-200">{a}</span>
            <span className="text-[12px] text-white/75">{b}</span>
          </div>
        ))}
      </div>
    );
  }
  if (v === "bars") {
    return (
      <div className="w-full space-y-2.5 px-10">
        {[["Build", 55], ["Growth", 30], ["Compliance & ops", 15]].map(([label, pct], i) => (
          <div key={String(label)}>
            <p className="mb-1 text-[11px] font-semibold text-white/70">{label} <span className="text-white/40">(placeholder split — founder to confirm)</span></p>
            <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: animate ? undefined : `${pct}%`, ...(animate ? { animation: `film-fill 1s ${i * 0.3}s both`, maxWidth: `${pct}%` } : {}) }} /></div>
          </div>
        ))}
      </div>
    );
  }
  // endcard
  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500"><Flame className="h-7 w-7 text-stone-900" /></span>
      <p className="mt-3 text-[24px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Gifting, reignited.</p>
      <p className="mt-1 text-[13px] text-amber-300">kindledgift.co.uk</p>
    </div>
  );
}

export function FilmPlayer({ film }: { film: Film }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(-1); // -1 = poster
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voAvailable, setVoAvailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scene = idx >= 0 ? film.scenes[Math.min(idx, film.scenes.length - 1)] : undefined;
  const done = idx >= film.scenes.length;

  const start = useCallback(() => {
    setIdx(0);
    setPaused(false);
    track("film_played", { film: film.id });
    if (audioRef.current && voAvailable && !muted) void audioRef.current.play().catch(() => {});
  }, [film.id, voAvailable, muted]);

  // Auto-advance by scene duration (manual stepping under reduced motion).
  useEffect(() => {
    if (idx < 0 || done || paused || reduce) return;
    const t = setTimeout(() => setIdx((i) => i + 1), (film.scenes[idx]?.dur ?? 4) * 1000);
    return () => clearTimeout(t);
  }, [idx, paused, reduce, done, film.scenes]);

  useEffect(() => {
    if (done) {
      track("film_completed", { film: film.id });
      audioRef.current?.pause();
    }
  }, [done, film.id]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0400]">
      <style>{`@keyframes film-pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}@keyframes film-fill{from{width:0}to{width:100%}}`}</style>
      {film.voSrc && (
        <audio ref={audioRef} src={film.voSrc} muted={muted} onCanPlay={() => setVoAvailable(true)} onError={() => setVoAvailable(false)} />
      )}
      <div className="relative flex aspect-video flex-col items-center justify-center">
        {idx === -1 && (
          <button onClick={start} className="group flex flex-col items-center gap-3" aria-label={`Play: ${film.title}`}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-transform group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 text-stone-900" fill="currentColor" />
            </span>
            <span className="text-[14px] font-bold text-white">{film.title}</span>
            <span className="text-[11px] text-white/50">Captions on · works with sound off</span>
          </button>
        )}

        {scene && !done && (
          <>
            {scene.visual === "ignition" && <Visual scene={scene} animate={!reduce} />}
            <div className="relative z-10 flex w-full flex-col items-center gap-4">
              {scene.headline && (
                <p className="max-w-md px-6 text-center text-[20px] font-bold leading-snug text-white" style={{ fontFamily: "var(--font-display)" }}>{scene.headline}</p>
              )}
              {scene.visual !== "ignition" && <Visual scene={scene} animate={!reduce} />}
              {scene.note && <p className="text-[10px] italic text-white/40">{scene.note}</p>}
            </div>
          </>
        )}

        {done && (
          <button onClick={() => setIdx(-1)} className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[13px] font-bold text-white">
            <RotateCcw className="h-4 w-4" /> Watch again
          </button>
        )}
      </div>

      {/* burned caption bar — always on while playing */}
      {scene && !done && (
        <div className="border-t border-white/10 bg-black/60 px-4 py-3">
          <p className="text-center text-[13px] font-semibold leading-snug text-white" aria-live="polite">{scene.caption}</p>
        </div>
      )}

      {/* controls */}
      {idx >= 0 && !done && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
          <div className="flex gap-1">
            {film.scenes.map((_, i) => (
              <span key={i} className={`h-1 w-4 rounded-full ${i <= idx ? "bg-amber-400" : "bg-white/15"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {reduce ? (
              <button onClick={() => setIdx((i) => i + 1)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white" aria-label="Next scene">
                Next <ChevronRight className="h-3 w-3" />
              </button>
            ) : (
              <button onClick={() => setPaused((p) => !p)} className="rounded-full bg-white/10 p-2 text-white" aria-label={paused ? "Resume" : "Pause"}>
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            )}
            {voAvailable && (
              <button onClick={() => setMuted((m) => !m)} className="rounded-full bg-white/10 p-2 text-white" aria-label={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
