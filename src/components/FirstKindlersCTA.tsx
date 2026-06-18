"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Gift, Trophy, Flame, ArrowRight } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// AMBIENT RISING DOTS (replaces emoji ember chars)
// ──────────────────────────────────────────────────────────────────────────────

interface Dot { id: number; x: number; size: number; delay: number; duration: number }

function AmbientDots() {
  const dots: Dot[] = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: 4 + (i / 13) * 92,
    size: 2 + (i % 3),
    delay: (i * 0.41) % 3.8,
    duration: 4.5 + (i % 4),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {dots.map((d) => (
        <div
          key={d.id}
          className="absolute bottom-2 rounded-full bg-amber-400/30"
          style={{
            left: `${d.x}%`,
            width: d.size,
            height: d.size,
            animation: `kindler-rise ${d.duration}s ${d.delay}s ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// BURST SPARKLES — CSS dot rings on submit
// ──────────────────────────────────────────────────────────────────────────────

const BURST_COLORS = ["#fbbf24", "#f59e0b", "#fb923c", "#fde68a", "#f97316", "#fcd34d"];

function BurstRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 52 + (i % 4) * 12;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const color = BURST_COLORS[i % BURST_COLORS.length]!;
        const size = 5 + (i % 3) * 2;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: size, height: size, background: color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: (i % 3) * 0.03 }}
          />
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SVG FLAME MARK (replaces emoji)
// ──────────────────────────────────────────────────────────────────────────────

function FlameMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M14 1C10 9 4 11 6.5 18.5C8 23 11 26 14 28C17 26 20 23 21.5 18.5C24 11 18 9 14 1Z"
        fill="url(#fm-grad-outer)"
      />
      <path
        d="M14 15C12 19 12.5 24 14 27C15.5 24 16 19 14 15Z"
        fill="url(#fm-grad-inner)"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="fm-grad-outer" x1="14" y1="1" x2="14" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="0.6" stopColor="#f97316" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="fm-grad-inner" x1="14" y1="15" x2="14" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
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
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: dy * -11, y: dx * 11 });
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
      style={{ perspective: "900px" }}
    >
      <motion.div
        initial={{ rotateY: 90, scale: 0.82, opacity: 0 }}
        animate={{ rotateY: tilt.y, rotateX: tilt.x, scale: 1, opacity: 1 }}
        transition={{
          rotateY: tilt.y === 0 ? { type: "spring", stiffness: 260, damping: 28 } : { duration: 0.07 },
          rotateX: { duration: 0.07 },
          scale: { type: "spring", stiffness: 280, damping: 26 },
          opacity: { duration: 0.3 },
        }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #1c160a 0%, #0d0b05 50%, #1a1004 100%)",
          border: "1px solid rgba(251,191,36,0.45)",
          boxShadow: "0 0 50px rgba(251,191,36,0.22), 0 24px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Shine overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, white 0%, transparent 60%)` }}
        />

        {/* Pulsing border */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{ animation: "ticket-glow 2.6s ease-in-out infinite alternate" }} />

        {/* Perforation row top */}
        <div className="absolute inset-x-0 top-0 flex justify-center -translate-y-1/2 gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded-full bg-[#0d0b12]" />
          ))}
        </div>

        <div className="px-6 pb-7 pt-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-400/25">
                <FlameMark className="h-7 w-7" />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400/60 mb-1">
              Official Creator Pass
            </p>
            <p
              className="text-[26px] font-black text-amber-400 leading-tight mb-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              #{ticketNumber}
            </p>
            <p className="text-[13px] font-semibold text-white/75 mb-5">Reserved</p>

            <div className="mb-5 rounded-2xl border border-amber-400/18 bg-amber-400/6 px-4 py-3">
              <p className="text-[11px] text-amber-300/65 leading-relaxed">
                You&apos;re on the exclusive First Kindlers list.<br />
                Expect early access, founder perks, and launch rewards.
              </p>
            </div>

            {/* Minimal barcode strip */}
            <div className="flex items-end justify-center gap-px opacity-25">
              {Array.from({ length: 36 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: i % 3 === 0 ? 3 : 1.5,
                    height: 6 + (i % 7) * 3,
                    background: "#f59e0b",
                  }}
                />
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[7.5px] tracking-widest text-amber-400/30">
              KINDLED · FIRST WAVE · {new Date().getFullYear()}
            </p>
          </motion.div>
        </div>

        {/* Perforation row bottom */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center translate-y-1/2 gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded-full bg-[#0d0b12]" />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// WEB AUDIO CHIME
// ──────────────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  } catch { /* audio not available */ }
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

type Stage = "idle" | "submitting" | "burst" | "ticket";

const PLACEHOLDERS = [
  "your.family@kindled.gifts",
  "grandma.linda@kindled.gifts",
  "the.wilsons@kindled.gifts",
];

const PERKS = [
  { Icon: Rocket,  label: "Early Access"   },
  { Icon: Gift,    label: "Launch Perks"   },
  { Icon: Trophy,  label: "Founder Status" },
];

export function FirstKindlersCTA() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [showBurst, setShowBurst] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]!);

  useEffect(() => {
    setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]!);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }
    setStage("submitting");
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch { /* non-fatal */ }

    const num = String(Math.floor(Math.random() * 8999) + 1000).padStart(4, "0");
    setTicketNumber(num);
    playChime();
    setShowBurst(true);
    setStage("burst");
    setTimeout(() => { setShowBurst(false); setStage("ticket"); }, 700);
  }, [email]);

  return (
    <>
      <style>{`
        @keyframes kindler-rise {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          12%  { opacity: 0.5; }
          88%  { opacity: 0.2; }
          100% { transform: translateY(-300px) scale(0.3); opacity: 0; }
        }
        @keyframes ticket-glow {
          from { box-shadow: inset 0 0 0 1px rgba(251,191,36,0.25), 0 0 28px rgba(251,191,36,0.1); }
          to   { box-shadow: inset 0 0 0 1px rgba(251,191,36,0.6), 0 0 52px rgba(251,191,36,0.28); }
        }
        @keyframes kindler-border-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.22), 0 0 22px rgba(251,191,36,0.1), 0 8px 32px rgba(0,0,0,0.55); }
          50%      { box-shadow: 0 0 0 1.5px rgba(251,191,36,0.55), 0 0 44px rgba(251,191,36,0.22), 0 8px 32px rgba(0,0,0,0.55); }
        }
      `}</style>

      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(160deg, #130f04 0%, #0d0b12 60%, #0a0d14 100%)",
            animation: "kindler-border-pulse 3.2s ease-in-out infinite",
          }}
        >
          <AmbientDots />

          <div className="relative z-10 px-5 pb-8 pt-7">
            <AnimatePresence mode="wait">
              {stage !== "ticket" ? (
                <motion.div key="form" exit={{ opacity: 0, scale: 0.94, y: -8 }} transition={{ duration: 0.2 }}>
                  {/* Header */}
                  <div className="mb-6 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 360, damping: 22 }}
                      className="mb-4 flex justify-center"
                    >
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/12 border border-amber-400/20">
                        <FlameMark className="h-10 w-8" />
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "0 0 28px rgba(251,191,36,0.25)" }} />
                      </div>
                    </motion.div>

                    <h2
                      className="text-[24px] font-semibold text-white leading-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Become One of Our First Kindlers
                    </h2>
                    <p className="mt-2 max-w-[300px] mx-auto text-[13px] text-white/45 leading-relaxed">
                      Join our exclusive First Creators list. Secure your spot to shape the future of collaborative family gifting and unlock launch rewards.
                    </p>
                  </div>

                  {/* Perks */}
                  <div className="mb-5 grid grid-cols-3 gap-2">
                    {PERKS.map(({ Icon, label }) => (
                      <div key={label} className="rounded-2xl border border-amber-400/12 bg-white/[0.04] px-2 py-3 text-center">
                        <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/15">
                          <Icon className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <p className="text-[9px] font-semibold text-amber-300/65">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="relative mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                      placeholder={placeholder}
                      disabled={stage === "submitting"}
                      className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-[14px] text-white placeholder-white/22 outline-none transition-all focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/15 disabled:opacity-50"
                    />
                    {error && (
                      <p className="absolute -bottom-5 left-1 text-[10px] text-red-400">{error}</p>
                    )}
                  </div>

                  {/* Button */}
                  <div className="relative mt-7">
                    <motion.button
                      whileHover={stage === "idle" ? { scale: 1.02, y: -1 } : {}}
                      whileTap={stage === "idle" ? { scale: 0.96 } : {}}
                      onClick={() => void handleSubmit()}
                      disabled={stage === "submitting"}
                      className="relative w-full overflow-visible rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 py-4 text-[15px] font-bold text-stone-900 shadow-xl shadow-amber-900/35 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {stage === "submitting" ? (
                          "Securing your spot…"
                        ) : (
                          <>
                            <Flame className="h-4 w-4" />
                            Reserve My Creator Spot
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </span>
                      <BurstRing active={showBurst} />
                    </motion.button>
                    <p className="mt-2.5 text-center text-[10px] text-white/22">
                      No spam. Unsubscribe anytime.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="ticket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/60">
                    You&apos;re in the first wave
                  </p>
                  <TiltTicket ticketNumber={ticketNumber} />
                  <p className="mt-5 text-center text-[12px] text-white/32 leading-relaxed">
                    We&apos;ll reach out before launch with your exclusive access. Keep an eye on your inbox.
                  </p>
                  <button
                    onClick={() => { setStage("idle"); setEmail(""); setTicketNumber(""); }}
                    className="mt-3 w-full rounded-xl py-2 text-[11px] font-medium text-white/28 transition-colors hover:text-white/55"
                  >
                    Sign up another email
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
