"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────────────────────────────────────
// AMBIENT EMBER PARTICLES
// ──────────────────────────────────────────────────────────────────────────────

interface Ember { id: number; x: number; size: number; delay: number; duration: number; char: string }

const CHARS = ["✦", "✧", "⋆", "✦", "·", "✦", "✧", "⋆"];

function AmbientEmbers() {
  const embers: Ember[] = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 5 + (i / 17) * 90,
    size: 8 + (i % 4) * 3,
    delay: (i * 0.37) % 3.5,
    duration: 4 + (i % 5),
    char: CHARS[i % CHARS.length]!,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {embers.map((e) => (
        <span
          key={e.id}
          className="absolute bottom-0 select-none text-amber-400/40"
          style={{
            left: `${e.x}%`,
            fontSize: e.size,
            animation: `kindler-rise ${e.duration}s ${e.delay}s ease-in infinite`,
          }}
        >
          {e.char}
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// BURST SPARKLES (on submit)
// ──────────────────────────────────────────────────────────────────────────────

interface Sparkle { id: number; angle: number; dist: number; size: number }

function SparkBurst({ active }: { active: boolean }) {
  const sparkles: Sparkle[] = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    angle: (i / 22) * 360,
    dist: 55 + (i % 5) * 14,
    size: 10 + (i % 4) * 4,
  }));
  const CHARS_BURST = ["✨", "⭐", "🌟", "✦", "💫", "✧"];

  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {sparkles.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * s.dist;
        const ty = Math.sin(rad) * s.dist;
        return (
          <motion.span
            key={s.id}
            className="absolute select-none"
            style={{ fontSize: s.size }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: (s.id % 3) * 0.04 }}
          >
            {CHARS_BURST[s.id % CHARS_BURST.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 3-D TILT TICKET
// ──────────────────────────────────────────────────────────────────────────────

function TiltTicket({ ticketNumber }: { ticketNumber: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
    setShine({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "900px", transformStyle: "preserve-3d" }}
    >
      <motion.div
        initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
        animate={{
          rotateY: tilt.y,
          rotateX: tilt.x,
          scale: 1,
          opacity: 1,
        }}
        transition={{
          rotateY: tilt.y === 0 ? { type: "spring", stiffness: 280, damping: 28 } : { duration: 0.08 },
          rotateX: { duration: 0.08 },
          scale: { type: "spring", stiffness: 280, damping: 28, delay: 0 },
          opacity: { duration: 0.3 },
        }}
        className="relative overflow-hidden rounded-3xl border border-amber-400/60 bg-gradient-to-br from-amber-950/90 via-[#1a1004] to-stone-950 px-6 py-7 text-center"
        style={{
          boxShadow: "0 0 50px rgba(251,191,36,0.3), 0 0 100px rgba(251,191,36,0.12), inset 0 1px 0 rgba(251,191,36,0.2)",
        }}
      >
        {/* Shine overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.07]"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.9) 0%, transparent 55%)`,
          }}
        />

        {/* Pulsing border aura */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ animation: "ticket-glow 2.5s ease-in-out infinite alternate", boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.4)" }}
        />

        {/* Ticket serration top */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="flex gap-2.5 translate-y-[-50%]">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-4 w-4 rounded-full bg-[#0d0b12]" />
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 26 }}>
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-[28px]">🎫</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/70 mb-1">Official Creator Pass</p>
          <h3 className="text-[22px] font-black text-amber-400 leading-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Ticket #{ticketNumber}
          </h3>
          <p className="text-[13px] font-semibold text-white/80 mb-4">Reserved! ✨</p>

          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3">
            <p className="text-[11px] text-amber-300/70 leading-relaxed">
              You&apos;re on the exclusive First Kindlers list.<br />
              Expect early access, founder perks, and launch rewards.
            </p>
          </div>

          {/* Barcode-ish visual */}
          <div className="flex items-end justify-center gap-px opacity-30">
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="bg-amber-400 rounded-sm"
                style={{ width: 2, height: 6 + (i % 5) * 4 }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[8px] font-mono text-amber-400/40 tracking-widest">KINDLED · FIRST WAVE · {new Date().getFullYear()}</p>
        </motion.div>

        {/* Ticket serration bottom */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div className="flex gap-2.5 translate-y-[50%]">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-4 w-4 rounded-full bg-[#0d0b12]" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAGIC CHIME (Web Audio)
// ──────────────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  } catch {
    // audio not available
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

type Stage = "idle" | "submitting" | "burst" | "ticket";

const PLACEHOLDERS = [
  "your.family@kindled.gifts",
  "grandma.linda@kindled.gifts",
  "dad@kindled.gifts",
  "the.wilsons@kindled.gifts",
];

export function FirstKindlersCTA() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [showBurst, setShowBurst] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]!);

  useEffect(() => {
    const i = Math.floor(Math.random() * PLACEHOLDERS.length);
    setPlaceholder(PLACEHOLDERS[i]!);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }
    setStage("submitting");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Server error");
    } catch {
      // Non-fatal: still show ticket (demo-safe)
    }
    const num = String(Math.floor(Math.random() * 8999) + 1000).padStart(4, "0");
    setTicketNumber(num);
    playChime();
    setShowBurst(true);
    setStage("burst");
    setTimeout(() => {
      setShowBurst(false);
      setStage("ticket");
    }, 700);
  }, [email]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") void handleSubmit();
  }, [handleSubmit]);

  return (
    <>
      {/* Global keyframes — injected once */}
      <style>{`
        @keyframes kindler-rise {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-280px) scale(0.4); opacity: 0; }
        }
        @keyframes ticket-glow {
          from { box-shadow: inset 0 0 0 1px rgba(251,191,36,0.3), 0 0 30px rgba(251,191,36,0.15); }
          to   { box-shadow: inset 0 0 0 1px rgba(251,191,36,0.7), 0 0 55px rgba(251,191,36,0.35); }
        }
        @keyframes kindler-border-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.3), 0 0 24px rgba(251,191,36,0.15), 0 8px 32px rgba(0,0,0,0.5); }
          50%      { box-shadow: 0 0 0 2px rgba(251,191,36,0.65), 0 0 48px rgba(251,191,36,0.3),  0 8px 32px rgba(0,0,0,0.5); }
        }
      `}</style>

      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#130f04] to-[#0d0b12] px-5 pb-8 pt-6"
          style={{ animation: "kindler-border-pulse 3s ease-in-out infinite" }}
        >
          <AmbientEmbers />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {stage !== "ticket" ? (
                <motion.div key="form" exit={{ opacity: 0, scale: 0.92, y: -10 }} transition={{ duration: 0.22 }}>
                  {/* Header */}
                  <div className="mb-6 text-center">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      className="mb-3 text-[40px]"
                    >
                      🔥
                    </motion.div>
                    <h2
                      className="text-[24px] font-semibold text-white leading-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Become One of Our First Kindlers ✨
                    </h2>
                    <p className="mt-2 text-[13px] text-amber-200/55 leading-relaxed max-w-[300px] mx-auto">
                      Join our exclusive, invite-only First Creators list. Secure your spot to shape the future of collaborative family gifting — and unlock launch rewards.
                    </p>
                  </div>

                  {/* Perks row */}
                  <div className="mb-5 grid grid-cols-3 gap-2">
                    {[
                      { icon: "🚀", label: "Early Access" },
                      { icon: "🎁", label: "Launch Perks" },
                      { icon: "🏆", label: "Founder Status" },
                    ].map(({ icon, label }) => (
                      <div key={label} className="rounded-2xl border border-amber-400/15 bg-amber-400/6 px-2 py-2.5 text-center">
                        <p className="text-[18px] mb-1">{icon}</p>
                        <p className="text-[9px] font-semibold text-amber-300/70">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="relative mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      disabled={stage === "submitting"}
                      className="w-full rounded-2xl border border-amber-400/25 bg-white/6 px-4 py-3.5 text-[14px] text-white placeholder-white/25 outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-all backdrop-blur-sm disabled:opacity-50"
                    />
                    {error && (
                      <p className="absolute -bottom-5 left-1 text-[10px] text-red-400">{error}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <div className="relative mt-7">
                    <motion.button
                      whileHover={stage === "idle" ? { scale: 1.02, y: -1 } : {}}
                      whileTap={stage === "idle" ? { scale: 0.96 } : {}}
                      onClick={() => void handleSubmit()}
                      disabled={stage === "submitting"}
                      className="relative w-full overflow-visible rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 py-4 text-[15px] font-bold text-stone-900 shadow-xl shadow-amber-900/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {stage === "submitting" ? "Kindling your spot…" : "Reserve My Creator Spot 🔥"}
                      <SparkBurst active={showBurst} />
                    </motion.button>

                    <p className="mt-2.5 text-center text-[10px] text-white/25">
                      No spam, ever. Unsubscribe instantly.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <div className="mb-3 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/65">You&apos;re in the first wave</p>
                  </div>
                  <TiltTicket ticketNumber={ticketNumber} />
                  <p className="mt-5 text-center text-[12px] text-white/35 leading-relaxed">
                    We&apos;ll reach out before launch with your exclusive access. Keep an eye on your inbox. 🔥
                  </p>
                  <button
                    onClick={() => { setStage("idle"); setEmail(""); setTicketNumber(""); }}
                    className="mt-3 w-full rounded-xl py-2 text-[11px] font-medium text-white/30 hover:text-white/55 transition-colors"
                  >
                    Sign up another email →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </>
  );
}
