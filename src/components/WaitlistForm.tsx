"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

const REF_CODE_KEY = "kindled-ref-code";

/** A short, private-by-design personal share code — generated client-side,
 *  cached per browser. No account or PII required; just enough to tag a
 *  referral link (v16: extends the existing ?ref= chain from wish-sharing
 *  to the waitlist itself). */
function personalRefCode(): string {
  try {
    let code = localStorage.getItem(REF_CODE_KEY);
    if (!code) {
      code = Math.random().toString(36).slice(2, 8);
      localStorage.setItem(REF_CODE_KEY, code);
    }
    return code;
  } catch {
    return Math.random().toString(36).slice(2, 8);
  }
}

/**
 * WaitlistForm — the single primary conversion action for the pre-launch site.
 * One email field, honest consent copy, a privacy-policy link, and a real success
 * state. Posts to the existing /api/signup (Resend) endpoint. No dark patterns.
 * v16: reuses the existing ?ref= referral infrastructure (already live for
 * wish-sharing) — a signup arriving via a ?ref= link is tagged
 * source=waitlist_referral (the same durable `source` field every other
 * signup channel already uses, no schema change), and every successful
 * signup is offered its own referral link to pass on.
 */
export function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [incomingRef, setIncomingRef] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied">("idle");

  const dark = variant === "dark";

  useEffect(() => {
    track("waitlist_viewed");
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) setIncomingRef(ref.slice(0, 40));
    } catch { /* URL access can fail in some embedded contexts */ }
  }, []);

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
        body: JSON.stringify({ email, ...(incomingRef ? { source: "waitlist_referral" } : {}) }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
      track("waitlist_submitted", incomingRef ? { ref: incomingRef } : undefined);
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  async function shareReferral() {
    const link = `${window.location.origin}/?ref=${personalRefCode()}#waitlist`;
    const text = "Know someone who's always stressed about what to buy? Bring them in first — join the Kindled waitlist:";
    track("waitlist_referral_shared");
    if (navigator.share) {
      try { await navigator.share({ title: "Kindled", text, url: link }); setShareState("shared"); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      setShareState("copied");
    } catch { /* clipboard unavailable — WhatsApp link below still works */ }
  }

  if (status === "done") {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${typeof window !== "undefined" ? personalRefCode() : ""}#waitlist`;
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Know someone who's always stressed about what to buy? Bring them in first — join the Kindled waitlist: ${link}`)}`;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
        className={`mx-auto max-w-md rounded-2xl px-5 py-4 text-left ${
          dark ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[15px] font-bold">You&apos;re on the list.</p>
            <p className={`text-[13px] ${dark ? "text-white/60" : "text-emerald-800/70"}`}>
              We&apos;ll email you the moment your spot opens up.
            </p>
          </div>
        </div>

        <div className={`mt-4 rounded-xl p-4 ${dark ? "bg-white/[0.06]" : "bg-white"}`}>
          <p className={`text-[13px] font-semibold ${dark ? "text-white/90" : "text-stone-800"}`}>
            Know someone who&apos;s always stressed about what to buy? Bring them in first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { void shareReferral(); }}
              className="flex items-center gap-1.5 rounded-xl cta-primary px-4 py-2.5 text-[13px] font-bold"
            >
              <Share2 className="h-3.5 w-3.5" />
              {shareState === "shared" ? "Shared!" : shareState === "copied" ? "Link copied" : "Share your link"}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("waitlist_referral_shared", { channel: "whatsapp" })}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-bold ${dark ? "border-white/15 text-white/80 hover:bg-white/5" : "border-stone-200 text-stone-700 hover:bg-stone-50"}`}
            >
              WhatsApp
            </a>
          </div>
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
        We&apos;ll only email you about early access and launch. No spam, and you can unsubscribe anytime. See our{" "}
        <Link href="/privacy" className={`underline underline-offset-2 ${dark ? "hover:text-white/70" : "hover:text-stone-600"}`}>
          Privacy&nbsp;Policy
        </Link>
        .
      </p>
    </form>
  );
}
