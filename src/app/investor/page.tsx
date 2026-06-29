"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Shield } from "lucide-react";
import content from "@/data/investor-content.json";
import { InvestorWarRoom } from "@/components/InvestorWarRoom";

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── PIN GATE ─────────────────────────────────────────────────────────────────

const CORRECT_PIN = "1066";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits]   = useState("");
  const [shake, setShake]     = useState(false);
  const [success, setSuccess] = useState(false);

  // Same proven pattern as the demo's gate: validate inline in the handler.
  const handle = useCallback((k: string) => {
    const next = (digits + k).slice(0, 4);
    setDigits(next);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setSuccess(true);
        setTimeout(onUnlock, 600);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(""); }, 550);
      }
    }
  }, [digits, onUnlock]);

  const del = useCallback(() => setDigits(d => d.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) handle(e.key);
      if (e.key === "Backspace") del();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handle, del]);

  const KEYS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#070c18]"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,58,138,0.35) 0%, transparent 70%)" }}>

      {/* Ambient grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm px-6">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <Flame className="h-7 w-7 text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {content.meta.confidential}
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight text-white">
              {content.meta.company} Investor Access
            </h1>
          </div>
        </div>

        {/* PIN card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl"
          style={{ boxShadow: "0 0 0 1px rgba(148,163,184,0.05), 0 32px 64px rgba(0,0,0,0.5)" }}>

          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Secure Access Required
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Dot display */}
            <motion.div
              animate={shake ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 flex justify-center gap-4">
              {[0,1,2,3].map(i => (
                <motion.div key={i}
                  animate={{
                    scale: digits.length > i ? 1 : 0.55,
                    backgroundColor: success
                      ? "#22c55e"
                      : shake
                      ? "#ef4444"
                      : digits.length > i
                      ? "#3b82f6"
                      : "rgba(148,163,184,0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="h-3.5 w-3.5 rounded-full"
                />
              ))}
            </motion.div>
            <p className="mb-5 text-center text-[11px] text-slate-500">
              {success ? "Access granted — entering…" : shake ? "Incorrect code — try again" : content.meta.access.hint}
            </p>

            {/* Keypad */}
            <div className="grid gap-3">
              {KEYS.map((row, ri) => (
                <div key={ri} className="grid grid-cols-3 gap-3">
                  {row.map((key, ki) => key === "" ? (
                    <div key={ki} />
                  ) : (
                    <button key={ki} type="button"
                      onClick={() => key === "⌫" ? del() : handle(key)}
                      className={cn(
                        "flex items-center justify-center rounded-xl border text-[16px] font-semibold transition-all active:scale-95",
                        key === "⌫"
                          ? "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:bg-slate-700/60"
                          : "border-slate-700/60 bg-slate-800/60 text-white hover:border-slate-600 hover:bg-slate-700/80",
                      )}
                      style={{ height: "52px" }}>
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          {content.meta.company} · Private War Room · Authorised Access Only
        </p>
      </motion.div>
    </div>
  );
}

// ─── PAGE ENTRY ───────────────────────────────────────────────────────────────

export default function InvestorPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("investor_unlocked") === "1") setUnlocked(true);
  }, []);

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem("investor_unlocked", "1");
    setUnlocked(true);
  }, []);

  // Plain conditional render (same as the demo gate). An AnimatePresence
  // "wait" swap here could stall on the gate's exit and never mount the room.
  if (unlocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <InvestorWarRoom />
      </motion.div>
    );
  }
  return <PinGate onUnlock={handleUnlock} />;
}
