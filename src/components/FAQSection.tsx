"use client";

/**
 * FAQ section (v16.3) — pre-empts the objection categories already being
 * tested in the live survey (Q18: "What would put you off?" — trusting it
 * with money, another app/account, preferring to choose gifts yourself,
 * possible fees), so research and marketing point at the same questions.
 * Ships with FAQPage schema.org JSON-LD for search rich snippets.
 *
 * Fee answer: content/claims.ts has no confirmed contributor-facing fee
 * figure (src/lib/fees.ts has an internal platform-fee calculation, but
 * that's an implementation detail, not a founder-approved public claim) —
 * per the brief, this ships as honest, neutral placeholder copy rather
 * than an invented "no fees, ever" claim. See TODO-FOUNDER.md.
 *
 * Living section: once real survey response data exists, revisit content
 * and order to match the actual top objections found (see REVIEW.md).
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const FAQS: { q: string; a: string; linkHref?: string; linkLabel?: string }[] = [
  {
    q: "Is my money safe?",
    a: "Every payment runs through Stripe — the same infrastructure trusted by millions of businesses — and contributions are held securely until the reveal.",
    linkHref: "#money",
    linkLabel: "How the money works",
  },
  {
    q: "Do I need to download an app or make an account?",
    a: "No. Kindled works entirely through a shared link — contributors never need to download anything or create an account to chip in.",
  },
  {
    q: "What if I'd rather just pick the gift myself?",
    a: "That's completely fine. Buy an item outright straight from the list, or suggest your own gift instead of chipping into someone else's choice.",
  },
  {
    q: "Are there any fees?",
    a: "We're finalising the exact fee position before launch. What we can promise: you'll always see precisely what you're paying before you confirm — nothing hidden, nothing sprung on you at the last step.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-28 px-5">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <div className="mx-auto max-w-2xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-amber-700">Questions</p>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-[34px] md:text-[46px] font-bold leading-[1.1] text-stone-900">
            Before you ask
          </h2>
        </div>

        <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-bold text-stone-800">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? {} : { height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[14px] leading-relaxed text-stone-600">
                        {f.a}{" "}
                        {f.linkHref && (
                          <Link href={f.linkHref} className="font-semibold text-amber-700 underline underline-offset-2">
                            {f.linkLabel}
                          </Link>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
