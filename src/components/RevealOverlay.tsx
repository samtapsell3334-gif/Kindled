"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OverlayPhase =
  | "loading"   // Polling for video URL
  | "ready"     // Video URL received, ready to play
  | "playing"   // Video is playing fullscreen
  | "fadeout"   // Video ended or skipped — fading out
  | "error";    // Generation failed — show fallback

interface RevealOverlayProps {
  /** Internal RevealTask ID to poll for video status */
  taskId: string | null;
  /**
   * Pre-existing video URL — pass when the pot already has revealVideoUrl set.
   * Skips polling entirely and goes straight to playback.
   */
  videoUrl?: string | null;
  /** Called after the overlay fully fades out so the parent unmounts it */
  onComplete: () => void;
  /** Pot metadata for loading-screen copy */
  potTitle: string;
  amountRaised: number;
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 60; // 5 min ceiling

function useRevealStatus(taskId: string | null, initialVideoUrl?: string | null) {
  const [phase, setPhase] = useState<OverlayPhase>(
    initialVideoUrl ? "ready" : "loading",
  );
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(initialVideoUrl ?? null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (!taskId) return;
    if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
      setPhase("error");
      return;
    }

    attemptsRef.current += 1;

    try {
      const res = await fetch(`/api/reveal/status/${taskId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as {
        data?: { status: string; videoUrl: string | null; error: string | null };
      };
      const { status, videoUrl } = json.data ?? {};

      if (status === "COMPLETED" && videoUrl) {
        setResolvedUrl(videoUrl);
        setPhase("ready");
      } else if (status === "FAILED") {
        setPhase("error");
      } else {
        // Still PENDING or PROCESSING — schedule next poll
        timerRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      }
    } catch {
      // Network blip — retry rather than hard-fail
      timerRef.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
    }
  }, [taskId]);

  useEffect(() => {
    if (initialVideoUrl || !taskId) return;
    void poll();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll, taskId, initialVideoUrl]);

  return { phase, setPhase, resolvedUrl };
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen({
  potTitle,
  amountRaised,
  onSkip,
}: {
  potTitle: string;
  amountRaised: number;
  onSkip: () => void;
}) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-stone-950 p-8 text-center">
      {/* Animated fire/glow orb */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, #f97316 0%, #ef4444 50%, transparent 100%)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Loader2 className="relative h-10 w-10 animate-spin text-white" strokeWidth={1.5} />
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
          Preparing your reveal
        </p>
        <h2 className="mt-2 text-[22px] font-black leading-tight text-white">{potTitle}</h2>
        <p className="mt-1 text-[13px] text-stone-400">
          £{amountRaised.toFixed(0)} raised — your moment is being crafted
          {"...".slice(0, dot + 1)}
        </p>
      </div>

      <div className="mt-2 max-w-[260px] rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-stone-400">
          Our AI is generating a personalised reveal video just for you.
          This takes about 30–60 seconds.
        </p>
      </div>

      <button
        onClick={onSkip}
        className="mt-4 text-[11px] text-stone-500 underline underline-offset-4 transition-colors hover:text-stone-300"
      >
        Skip — reveal now without video
      </button>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ potTitle, onContinue }: { potTitle: string; onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-stone-950 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-red-400">
          Video unavailable
        </p>
        <h2 className="mt-2 text-[20px] font-black text-white">{potTitle}</h2>
        <p className="mt-1 text-[12px] text-stone-400">
          The reveal video could not be generated. Your pot is still fully funded!
        </p>
      </div>
      <button
        onClick={onContinue}
        className="rounded-2xl bg-amber-500 px-6 py-3 text-[14px] font-black text-stone-900"
      >
        Open my gift
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RevealOverlay({
  taskId,
  videoUrl: initialVideoUrl,
  onComplete,
  potTitle,
  amountRaised,
}: RevealOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { phase, setPhase, resolvedUrl } = useRevealStatus(taskId, initialVideoUrl);

  // Auto-play as soon as we transition to "ready"
  useEffect(() => {
    if (phase === "ready" && resolvedUrl && videoRef.current) {
      setPhase("playing");
      videoRef.current.play().catch(() => {
        // Autoplay blocked — show play button fallback is handled by controls
        setPhase("playing"); // still show the player
      });
    }
  }, [phase, resolvedUrl, setPhase]);

  const handleSkip = useCallback(() => {
    setPhase("fadeout");
    setTimeout(onComplete, 700);
  }, [setPhase, onComplete]);

  const handleVideoEnded = useCallback(() => {
    setPhase("fadeout");
    setTimeout(onComplete, 700);
  }, [setPhase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "fadeout" && (
        <motion.div
          key="reveal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          // Sits above everything; z-50 matches Tailwind's fixed modal convention
          className="fixed inset-0 z-50 bg-stone-950"
          style={{ isolation: "isolate" }}
        >
          {/* Skip button — always visible, low opacity */}
          {(phase === "playing" || phase === "ready") && (
            <button
              onClick={handleSkip}
              className={cn(
                "absolute right-4 top-safe-top z-10 mt-4 flex items-center gap-1.5",
                "rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm",
                "text-[11px] font-semibold text-white/50 transition-all hover:text-white/80",
              )}
              style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
            >
              <X className="h-3 w-3" />
              Skip
            </button>
          )}

          {/* Phase renders */}
          {(phase === "loading") && (
            <LoadingScreen
              potTitle={potTitle}
              amountRaised={amountRaised}
              onSkip={handleSkip}
            />
          )}

          {phase === "error" && (
            <ErrorScreen potTitle={potTitle} onContinue={handleSkip} />
          )}

          {(phase === "ready" || phase === "playing") && resolvedUrl && (
            <video
              ref={videoRef}
              src={resolvedUrl}
              onEnded={handleVideoEnded}
              playsInline
              muted={false}
              className="h-full w-full object-cover"
              style={{ display: "block" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
