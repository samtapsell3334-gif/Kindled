"use client";

/**
 * The market-research survey (v13). Mobile-first, one question per screen,
 * quick-tap where possible, consent up front, answers stored server-side
 * (append-only, durable). WYR sides — including the calculated Q6 pair —
 * are randomised per session. The thank-you screen converts: waitlist
 * capture (source=survey) + share. "Neither" respondents skip straight to
 * the same thank-you/email screen rather than a dead end.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, Share2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { SCREENER, QUESTIONS, questionSequence, computeTwoYearProjection, optionACopy, optionBCopy } from "@/content/survey";

type Answers = Record<string, string | string[] | number | boolean>;

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export default function SurveyPage() {
  const sessionId = useRef(`svy_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`).current;
  const [stage, setStage] = useState<"intro" | "screener" | "questions" | "done">("intro");
  const [segment, setSegment] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [multiDraft, setMultiDraft] = useState<string[]>([]);
  const [textDraft, setTextDraft] = useState("");
  const [stepperDraft, setStepperDraft] = useState(0);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sent">("idle");
  // Side-randomisation per session, fixed per pair (order-bias control) —
  // covers both static WYR pairs and the calculated Q6 pair.
  const flips = useMemo(() => Object.fromEntries(QUESTIONS.filter((q) => q.kind === "wyr" || q.kind === "calc_wyr").map((q) => [q.id, Math.random() < 0.5])), []);

  const seq = questionSequence(answers, segment);
  const q = seq[idx];

  useEffect(() => {
    if (q?.kind === "stepper") setStepperDraft(q.start);
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next: Answers, completed: boolean, seg = segment) =>
    void fetch("/api/survey", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answers: next, completed, ...(seg ? { segment: seg } : {}) }),
    }).catch(() => {});

  function advance(updates: Answers) {
    const next = { ...answers, ...updates };
    setAnswers(next);
    const isLast = idx >= questionSequence(next, segment).length - 1;
    persist(next, isLast);
    if (isLast) setStage("done");
    else { setIdx((i) => i + 1); setMultiDraft([]); setTextDraft(""); }
  }

  function record(id: string, value: string | string[] | number | boolean) {
    advance({ [id]: value });
  }

  const Dots = () => (
    <div className="mb-6 flex justify-center gap-1.5" aria-label={`Question ${idx + 1} of ${seq.length}`}>
      {seq.map((s, i) => (
        <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 [background:var(--ember)]" : i < idx ? "w-1.5 [background:var(--ember-soft)]" : "w-1.5 bg-stone-200"}`} />
      ))}
    </div>
  );

  const Opt = ({ label, onTap }: { label: string; onTap: () => void }) => (
    <button onClick={onTap}
      className="w-full rounded-2xl border border-stone-200 bg-[var(--card)] px-4 py-3.5 text-left text-[15px] font-semibold text-stone-800 transition-transform active:scale-[0.98]">
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-ground text-stone-900">
      <main className="mx-auto max-w-md px-5 py-10">
        {stage === "intro" && (
          <div className="text-center">
            <LogoMark variant="light" size={44} className="mx-auto" />
            <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-4 text-[26px] font-bold leading-tight">A few minutes on gift-giving?</h1>
            <p className="mt-2 text-[14px] text-stone-600">A short survey about how you really buy gifts. Quick taps, no typing (one optional line at the end).</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-700">About 4–5 minutes</p>
            <p className="mt-4 text-[11px] leading-snug text-stone-600">
              Anonymous; answers are stored so we can publish honest totals. No email needed unless you ask for early access at the end. <Link href="/privacy" className="underline">Privacy</Link>.
            </p>
            <button onClick={() => { setStage("screener"); persist({}, false); }}
              className="cta-primary mt-6 w-full rounded-2xl py-4 text-[15px] font-bold">Start</button>
          </div>
        )}

        {stage === "screener" && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">First things first</p>
            <h2 className="mt-1 text-[20px] font-bold">{SCREENER.text}</h2>
            <div className="mt-4 space-y-2.5">
              {SCREENER.options.map((o) => (
                <Opt key={o.segment} label={o.label} onTap={() => {
                  setSegment(o.segment);
                  const next: Answers = { ...answers, [SCREENER.id]: o.label, is_parent: o.segment === "parent" || o.segment === "both" };
                  setAnswers(next);
                  if (o.segment === "neither") { persist(next, true, o.segment); setStage("done"); }
                  else { persist(next, false, o.segment); setStage("questions"); }
                }} />
              ))}
            </div>
          </div>
        )}

        {stage === "questions" && q && (
          <div>
            <Dots />
            {q.kind === "single" && q.concept && (
              <p className="mb-4 rounded-2xl border border-stone-200 bg-[var(--card)] p-4 text-[14px] leading-relaxed text-stone-700">{q.concept}</p>
            )}
            {q.kind !== "calc_wyr" && <h2 className="text-[20px] font-bold leading-snug">{q.text}</h2>}
            {(q.kind === "single" || q.kind === "banded") && "helper" in q && q.helper && (
              <p className="mt-1.5 text-[13px] text-stone-500">{q.helper}</p>
            )}
            <div className="mt-4 space-y-2.5">
              {q.kind === "single" && q.options.map((o) => <Opt key={o} label={o} onTap={() => record(q.id, o)} />)}
              {q.kind === "banded" && q.options.map((o) => <Opt key={o.label} label={o.label} onTap={() => record(q.id, o.label)} />)}
              {q.kind === "wyr" && (flips[q.id]
                ? [{ label: q.b, choice: "B" as const }, { label: q.a, choice: "A" as const }]
                : [{ label: q.a, choice: "A" as const }, { label: q.b, choice: "B" as const }]
              ).map((o) => <Opt key={o.choice} label={o.label} onTap={() => record(q.id, o.choice)} />)}
              {q.kind === "multi" && (
                <>
                  {q.options.map((o) => {
                    const on = multiDraft.includes(o);
                    return (
                      <button key={o} onClick={() => setMultiDraft((d) => on ? d.filter((x) => x !== o) : [...d, o])}
                        aria-pressed={on}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold transition-transform active:scale-[0.98] ${on ? "border-amber-500 bg-[var(--ember-soft)] text-stone-900" : "border-stone-200 bg-[var(--card)] text-stone-800"}`}>
                        {o}{on && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                  <button onClick={() => record(q.id, multiDraft)} disabled={multiDraft.length === 0}
                    className="cta-primary w-full rounded-2xl py-3.5 text-[14px] font-bold disabled:opacity-50">Next</button>
                </>
              )}
              {q.kind === "text" && (
                <>
                  <input value={textDraft} onChange={(e) => setTextDraft(e.target.value)} maxLength={140} placeholder={q.placeholder}
                    className="w-full rounded-2xl border border-stone-200 bg-[var(--card)] px-4 py-3.5 text-[15px]" />
                  <button onClick={() => record(q.id, textDraft)} className="cta-primary w-full rounded-2xl py-3.5 text-[14px] font-bold">
                    {textDraft ? "Finish" : "Skip and finish"}
                  </button>
                </>
              )}
              {q.kind === "stepper" && (
                <>
                  {q.helper && <p className="-mt-2.5 mb-1 text-[13px] text-stone-500">{q.helper}</p>}
                  <div className="flex items-center justify-center gap-6 rounded-2xl border border-stone-200 bg-[var(--card)] py-8">
                    <button aria-label="Decrease" onClick={() => setStepperDraft((v) => Math.max(q.min, v - 1))} disabled={stepperDraft <= q.min}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 disabled:opacity-30">
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-[64px] text-center text-[36px] font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                      {stepperDraft >= q.max ? q.topLabel : stepperDraft}
                    </span>
                    <button aria-label="Increase" onClick={() => setStepperDraft((v) => Math.min(q.max, v + 1))} disabled={stepperDraft >= q.max}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 disabled:opacity-30">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <button onClick={() => record(q.id, stepperDraft)}
                    className="cta-primary w-full rounded-2xl py-3.5 text-[14px] font-bold">
                    Confirm {stepperDraft >= q.max ? q.topLabel : stepperDraft}
                  </button>
                </>
              )}
              {q.kind === "calc_wyr" && (() => {
                const projection = computeTwoYearProjection(answers);
                if (!projection) return null;
                const cardA = { key: "A" as const, copy: optionACopy(projection), button: "I'll take the mix" };
                const cardB = { key: "B" as const, copy: optionBCopy(projection), button: "Pool it together" };
                const ordered = flips[q.id] ? [cardB, cardA] : [cardA, cardB];
                return (
                  <>
                    <h2 className="mb-4 text-[20px] font-bold leading-snug">Here&apos;s what that looks like for you…</h2>
                    {ordered.map((c) => (
                      <button key={c.key} onClick={() => record(q.id, c.key)}
                        className="mb-2.5 w-full rounded-2xl border border-stone-200 bg-[var(--card)] p-4 text-left transition-transform active:scale-[0.98]">
                        <p className="text-[14px] leading-relaxed text-stone-700">{renderBold(c.copy)}</p>
                        <p className="mt-3 text-[14px] font-bold text-[var(--ember)]">{c.button} →</p>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500"><Check className="h-7 w-7 text-white" strokeWidth={3} /></span>
            <h2 className="mt-4 text-[22px] font-bold">That&apos;s everything. Thank you.</h2>
            <p className="mt-2 text-[14px] text-stone-600">
              Kindled is one link where friends and family chip into a chosen gift, revealed on the day. Launching soon.
            </p>
            <p className="mt-4 text-[15px] font-bold">Want early access when we launch?</p>
            {emailState === "idle" ? (
              <div className="mt-3">
                <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email for early access"
                  className="w-full rounded-2xl border border-stone-200 bg-[var(--card)] px-4 py-3.5 text-[15px]" />
                <button onClick={() => { if (email.includes("@")) { void fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source: "survey" }) }); setEmailState("sent"); } }}
                  className="cta-primary mt-2.5 w-full rounded-2xl py-4 text-[15px] font-bold">Reserve your spot</button>
                <p className="mt-1.5 text-[11px] text-stone-600">Early-access updates only. <Link href="/privacy" className="underline">Privacy</Link>.</p>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] font-semibold text-emerald-800">You&apos;re on the list.</p>
            )}
            <button onClick={() => { void fetch("/api/survey?event=shared").catch(() => {}); void navigator.share?.({ title: "Kindled — quick survey on gift-giving", text: "A quick survey about how we all actually buy gifts:", url: `${window.location.origin}/survey` }).catch(() => {}); }}
              className="btn-secondary mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-bold">
              <Share2 className="h-4 w-4" /> Share this survey
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
