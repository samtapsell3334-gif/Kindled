"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";

/**
 * WaitlistForm — the single primary conversion action for the pre-launch site.
 * One email field, honest consent copy, a privacy-policy link, and a real success
 * state. Posts to the existing /api/signup (Resend) endpoint. No dark patterns.
 */
export function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const dark = variant === "dark";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
        className={`mx-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-4 ${
          dark ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-900"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </span>
        <div className="text-left">
          <p className="text-[15px] font-bold">You&apos;re on the list.</p>
          <p className={`text-[13px] ${dark ? "text-white/60" : "text-emerald-800/70"}`}>
            We&apos;ll email you the moment your spot opens up.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={(e) => { void submit(e); }} className="mx-auto max-w-md" noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          aria-describedby="waitlist-consent"
          className={`h-[52px] flex-1 rounded-2xl border px-4 py-3.5 text-[15px] outline-none transition-all focus:ring-2 ${
            dark
              ? "border-white/15 bg-white/[0.06] text-white placeholder:text-white/35 focus:border-amber-400/50 focus:ring-amber-400/30"
              : "border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:ring-amber-400/30"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-[15px] font-bold text-stone-900 shadow-lg transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-70"
          style={{ boxShadow: "0 8px 24px rgba(251,146,60,0.35)" }}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Reserve your spot <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-rose-500">
          {error}
        </p>
      )}

      <p id="waitlist-consent" className={`mt-3 text-[12px] leading-relaxed ${dark ? "text-white/40" : "text-stone-400"}`}>
        We&apos;ll only email you about early access and launch — no spam, unsubscribe anytime. See our{" "}
        <Link href="/privacy" className={`underline underline-offset-2 ${dark ? "hover:text-white/70" : "hover:text-stone-600"}`}>
          Privacy&nbsp;Policy
        </Link>
        .
      </p>
    </form>
  );
}
