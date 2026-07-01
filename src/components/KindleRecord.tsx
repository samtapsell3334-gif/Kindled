"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mic, Square, RotateCcw, Check, AlertCircle } from "lucide-react";
import {
  type MediaKind, type KindleMemory, pickMimeType, mediaConstraints, uploadMemory,
  MAX_MEMORY_SEC, formatClock,
} from "@/lib/media-service";
import { LUX_EASE, VH_BOUNCE } from "@/lib/motion";

type Phase = "choose" | "ready" | "recording" | "saving" | "review";

/**
 * KindleRecord — attach a short video or voice "Memory" to a contribution.
 * Real MediaRecorder capture; the resulting blob is stored via the media-service and
 * tied to `contributionId`, then handed back as a KindleMemory for the Reveal.
 */
export function KindleRecord({
  contributionId,
  onRecorded,
  onCancel,
}: { contributionId: string; onRecorded: (memory: KindleMemory) => void; onCancel?: () => void }) {
  const [kind, setKind] = useState<MediaKind | null>(null);
  const [phase, setPhase] = useState<Phase>("choose");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [memory, setMemory] = useState<KindleMemory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => { stopStream(); if (timerRef.current) clearInterval(timerRef.current); }, [stopStream]);

  const choose = async (k: MediaKind) => {
    setError(null);
    setKind(k);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || !pickMimeType(k)) {
      setError("Recording isn't available on this device — you can still send a written card.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints(k));
      streamRef.current = stream;
      if (k === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (k === "voice") meterAudio(stream);
      setPhase("ready");
    } catch {
      setError("We need camera/mic access to record your Memory. Check your browser permissions.");
    }
  };

  const meterAudio = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setLevel(data.reduce((a, b) => a + b, 0) / data.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* metering is decorative */ }
  };

  const start = () => {
    const stream = streamRef.current;
    if (!stream || !kind) return;
    const mimeType = pickMimeType(kind);
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      setPhase("saving");
      const blob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined);
      const durationSec = (Date.now() - startRef.current) / 1000;
      const mem = await uploadMemory(blob, { contributionId, kind, durationSec });
      stopStream();
      setMemory(mem);
      setPhase("review");
    };
    recorderRef.current = rec;
    startRef.current = Date.now();
    setElapsed(0);
    rec.start();
    setPhase("recording");
    timerRef.current = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      setElapsed(s);
      if (s >= MAX_MEMORY_SEC) stop();
    }, 100);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  };

  const reset = () => {
    if (memory) URL.revokeObjectURL(memory.url);
    setMemory(null);
    setElapsed(0);
    setKind(null);
    setPhase("choose");
  };

  return (
    <div className="font-outfit rounded-3xl bg-[#0f172a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-editorial text-[18px] font-semibold text-[#fdf6e3]">Add a Memory</p>
        {onCancel && <button onClick={() => { stopStream(); onCancel(); }} className="text-[12px] font-semibold text-[#fdf6e3]/50">Skip</button>}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-[#ff6b6b]/15 px-3.5 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b6b]" />
          <p className="text-[12px] leading-snug text-[#fdf6e3]/80">{error}</p>
        </div>
      )}

      {/* Choose */}
      {phase === "choose" && !error && (
        <div className="grid grid-cols-2 gap-3">
          {([["video", Video, "Video Wish", "A face and a smile"], ["voice", Mic, "Voice Note", "Just your words"]] as const).map(([k, Icon, title, sub]) => (
            <motion.button key={k} whileTap={{ scale: 0.95 }} transition={VH_BOUNCE} onClick={() => { void choose(k); }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-[#fdf6e3]/[0.06] p-5 text-center transition-colors hover:bg-[#fdf6e3]/[0.1]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff6b6b]"><Icon className="h-6 w-6 text-white" /></span>
              <span className="text-[14px] font-bold text-[#fdf6e3]">{title}</span>
              <span className="text-[11px] text-[#fdf6e3]/50">{sub}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Ready / recording preview */}
      {(phase === "ready" || phase === "recording" || phase === "saving") && kind && (
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: kind === "video" ? "3 / 4" : "16 / 7" }}>
            {kind === "video" ? (
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-end justify-center gap-1.5 px-6 pb-6">
                {Array.from({ length: 13 }, (_, i) => (
                  <motion.span key={i} className="w-2 rounded-full bg-[#f59e0b]"
                    animate={{ height: phase === "recording" ? `${18 + level * 70 * (0.5 + Math.abs(Math.sin(i + elapsed * 3)))}%` : "18%" }}
                    transition={{ duration: 0.12, ease: LUX_EASE }} />
                ))}
              </div>
            )}
            {phase === "recording" && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                <motion.span className="h-2 w-2 rounded-full bg-[#ff6b6b]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
                <span className="text-[11px] font-bold tabular-nums text-white">{formatClock(elapsed)} / {formatClock(MAX_MEMORY_SEC)}</span>
              </div>
            )}
            {phase === "saving" && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[13px] font-semibold text-[#fdf6e3]">Saving your Memory…</div>}
          </div>

          <div className="mt-4 flex items-center justify-center">
            {phase === "ready" ? (
              <motion.button whileTap={{ scale: 0.9 }} transition={VH_BOUNCE} onClick={start} aria-label="Start recording"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6b6b] vh-lift">
                <span className="h-6 w-6 rounded-full bg-white" />
              </motion.button>
            ) : phase === "recording" ? (
              <motion.button whileTap={{ scale: 0.9 }} transition={VH_BOUNCE} onClick={stop} aria-label="Stop recording"
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#ff6b6b] bg-transparent">
                <Square className="h-6 w-6 fill-[#ff6b6b] text-[#ff6b6b]" />
              </motion.button>
            ) : null}
          </div>
          <p className="mt-3 text-center text-[11px] text-[#fdf6e3]/45">Up to {MAX_MEMORY_SEC}s · woven into their Reveal</p>
        </div>
      )}

      {/* Review */}
      <AnimatePresence>
        {phase === "review" && memory && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: LUX_EASE }}>
            <div className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: memory.kind === "video" ? "3 / 4" : "16 / 7" }}>
              {memory.kind === "video"
                ? <video src={memory.url} controls playsInline className="h-full w-full object-contain" />
                : <div className="flex h-full items-center justify-center"><audio src={memory.url} controls className="w-[85%]" /></div>}
            </div>
            <div className="mt-2 text-center text-[11px] text-[#fdf6e3]/45">Memory · {formatClock(memory.durationSec)} · {(memory.sizeBytes / 1024).toFixed(0)} KB</div>
            <div className="mt-4 flex gap-2.5">
              <motion.button whileTap={{ scale: 0.95 }} transition={VH_BOUNCE} onClick={reset}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#fdf6e3]/[0.08] py-3.5 text-[13px] font-bold text-[#fdf6e3]">
                <RotateCcw className="h-4 w-4" /> Re-record
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} transition={VH_BOUNCE} onClick={() => onRecorded(memory)}
                className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-[#ff6b6b] py-3.5 text-[14px] font-bold text-white vh-lift">
                <Check className="h-4 w-4" strokeWidth={3} /> Use this Memory
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
