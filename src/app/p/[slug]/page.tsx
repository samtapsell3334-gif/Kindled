"use client";

/**
 * Sandbox pot page (v4.1 WS-C/D/E).
 * - Guest: view list + progress → chip in → SIMULATED payment sheet (guardrail 1:
 *   pre-filled dummy card, nothing transmitted or persisted; fake Apple Pay) →
 *   message and/or video → pot fills → the conversion moment (WS-D: "Would you
 *   rather?" + start-your-own with the ?ref chain).
 * - Manager (?key=…): progress, contributors, sealed-message count, "Simulate
 *   reveal day" with the three outcomes (gift card → fake voucher + simulated
 *   commission / product / stack).
 * - Receiver (?view=receiver): the surprise-safe ambient view — redaction is
 *   server-side; this page just renders what the API returns.
 */

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Gift, Sparkles, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { MaterialisingGift } from "@/components/sandbox/MaterialisingGift";
import { giftVisualFor } from "@/lib/sandbox/gift-visual";
import { DemoBanner } from "@/components/DemoBanner";
import { KindleRecord } from "@/components/KindleRecord";
import { RevealExperience } from "@/components/RevealExperience";
import type { RevealOutcome } from "@/lib/sandbox/types";
import type { PotView } from "@/lib/sandbox/redact";

type Step = "idle" | "amount" | "sheet" | "message" | "done";

export default function PotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const search = useSearchParams();
  const managerKey = search.get("key");
  const asReceiver = search.get("view") === "receiver";
  const asKid = search.get("view") === "kid";

  const [view, setView] = useState<PotView | null>(null);
  const [missing, setMissing] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [amount, setAmount] = useState(20);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [videoRef, setVideoRef] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [wyr, setWyr] = useState<string | null>(null);
  const [revealBusy, setRevealBusy] = useState(false);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealMsgs, setRevealMsgs] = useState<{ displayName: string; text?: string; videoRef?: string }[] | null>(null);

  async function openReveal() {
    if (managerKey) {
      // The ceremony is the reveal moment — unseal via the manager key.
      const r = await fetch(`/api/sandbox/pots/${slug}?key=${managerKey}&unseal=1`);
      if (r.ok) {
        const v = (await r.json()) as { messages?: { displayName: string; text?: string; videoRef?: string }[] };
        setRevealMsgs(v.messages ?? []);
      }
    }
    setShowReveal(true);
  }
  const contributionId = useRef(`sbx_${Math.random().toString(36).slice(2, 10)}`).current;

  const load = useCallback(async () => {
    const qs = managerKey ? `?key=${managerKey}` : asReceiver ? "?view=receiver" : "";
    const res = await fetch(`/api/sandbox/pots/${slug}${qs}`);
    if (res.status === 404) { setMissing(true); return; }
    setView((await res.json()) as PotView);
  }, [slug, managerKey, asReceiver]);

  // Initial load + poll every 5s so concurrent contributions appear live.
  useEffect(() => {
    void load();
    const t = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function reviewPending(itemId: string, approve: boolean) {
    await fetch(`/api/sandbox/pots/${slug}/items`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: managerKey, action: approve ? "approve" : "reject", itemId }),
    });
    void load();
  }

  const beacon = (stepName: "start" | "sheet") =>
    void fetch(`/api/sandbox/pots/${slug}/contribute?step=${stepName}`, { method: "PUT" });

  async function submitContribution() {
    if (submitting) return; // double-tap cannot double-submit
    setSubmitting(true);
    const res = await fetch(`/api/sandbox/pots/${slug}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // NOTE (guardrail 1): the payment sheet's card fields are never read —
      // this payload is name + amount + message only.
      body: JSON.stringify({
        displayName: displayName || "A friend",
        amount,
        ...(message ? { message } : {}),
        ...(videoRef ? { videoRef, consent: true } : {}),
        ref: slug,
      }),
    });
    if (res.ok) {
      setStep("done");
      if (typeof navigator !== "undefined") navigator.vibrate?.(10);
      void load();
    }
    setSubmitting(false);
  }

  if (missing) {
    return (
      <div className="min-h-screen bg-[#fdf9f5]"><DemoBanner />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <p className="text-[15px] text-stone-600">This wish doesn&apos;t exist (the sandbox may have been reset).</p>
          <Link href="/sandbox" className="mt-4 inline-block rounded-2xl bg-stone-900 px-5 py-3 text-[14px] font-bold text-white">Start a wish</Link>
        </main>
      </div>
    );
  }
  if (!view) return <div className="min-h-screen bg-[#fdf9f5]"><DemoBanner /><p className="py-16 text-center text-[14px] text-stone-500">Warming up…</p></div>;

  // ── Receiver surprise view — the API sent no numbers; render the warmth ──
  if (view.kind === "receiver_surprise") {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#fdf6e3]"><DemoBanner />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[28px] font-bold">Something&apos;s being kept warm for you, {view.recipientName}</h1>
          {/* WS-2.3: the big-day teaser — anticipation without information */}
          <div className="mx-auto mt-6 max-w-[260px] rounded-3xl border border-amber-400/20 bg-white/[0.04] px-6 pb-5 pt-6">
            <MaterialisingGift visual={giftVisualFor(view)} size={140} className="mx-auto" />
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-amber-300">
              <Lock className="h-3.5 w-3.5" /> Sealed
            </p>
            <p className="mt-1 text-[13px] text-[#fdf6e3]/70">
              Revealed on {new Date(view.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
            </p>
          </div>
          <p className="mt-5 text-[14px] text-[#fdf6e3]/60">
            {view.activity === "quiet" ? "The embers are lit." : view.activity === "warming" ? "People are chipping in." : "It's glowing in here."}
          </p>
          <p className="mt-8 text-[11px] text-[#fdf6e3]/30">Hidden from you, because it&apos;s a surprise. That&apos;s the whole point.</p>
        </main>
      </div>
    );
  }

  const pct = view.goal > 0 ? Math.min(100, Math.round((view.raised / view.goal) * 100)) : 0;
  const isManager = view.kind === "manager";

  // P3.1 — kids' "circle it": rendered on the parent's device via the manager
  // link. Catalogue taps only; no free text, no data collected from the child.
  if (asKid && view.kind === "manager" && managerKey) {
    return (
      <div className="min-h-screen bg-[#fdf9f5] text-stone-900"><DemoBanner />
        <KidCircleView view={view} slug={slug} managerKey={managerKey} onChanged={() => { void load(); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      <DemoBanner />
      <main className="mx-auto max-w-md px-5 py-8 pb-24">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">{view.occasion} · {new Date(view.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-[28px] font-bold leading-tight">{view.title}</h1>
        {/* Provenance (crit A1): who made this, for whom */}
        <p className="mt-1.5 text-[13px] text-stone-500">Created by {view.organiserName} · for {view.recipientName}&apos;s {view.occasion.toLowerCase()}</p>

        {/* Progress — the gift materialises as funding rises (WS-2.1) */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <MaterialisingGift visual={giftVisualFor(view)} size={84} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <p className="text-[24px] font-bold">£{view.raised}<span className="text-[13px] font-medium text-stone-500"> of £{view.goal}</span></p>
                <p className="text-[13px] font-bold text-amber-600">{pct}%</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
                <div className={`h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ${pct > 0 && pct < 100 ? "animate-mg-breathe" : ""}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-stone-500">{view.contributors.length} contributor{view.contributors.length === 1 ? "" : "s"} · {view.messageCount} message{view.messageCount === 1 ? "" : "s"} {view.status === "open" ? "sealed for the big day" : "unsealed at the reveal"}</p>
          {/* WS-3: milestone beats — one line, never a modal */}
          {view.status === "open" && pct >= 90 && pct < 100 && <p className="mt-1.5 text-[12px] font-semibold text-amber-700">Almost there. One more chip-in could finish it.</p>}
          {view.status === "open" && pct >= 50 && pct < 90 && <p className="mt-1.5 text-[12px] font-semibold text-amber-700">Past halfway. {view.recipientName}&apos;s gift is taking shape.</p>}
        </div>

        {/* List */}
        <div className="mt-4 space-y-2">
          {view.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div><p className="text-[14px] font-semibold">{i.name}</p><p className="text-[11px] text-stone-500">{i.retailer} · {i.category}</p></div>
              <p className="text-[14px] font-bold text-stone-700">£{i.price}</p>
            </div>
          ))}
        </div>

        {/* Granted (WS-2.5): a completed wish is the product's proof */}
        {view.status !== "open" && (
          <section aria-label="Wish granted" className="mt-4 rounded-3xl bg-[#0f172a] p-6 text-center text-[#fdf6e3]">
            <MaterialisingGift visual={{ mode: "complete" }} size={110} className="mx-auto" />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">{view.status === "stacked" ? "Stacked forward" : "Granted"}</p>
            <p className="mt-2 text-[15px] font-semibold">
              {view.status === "stacked"
                ? `Every pound carries on to ${view.recipientName}'s next occasion. Nothing raised is lost.`
                : `${view.contributors.length} ${view.contributors.length === 1 ? "person" : "people"} made this happen for ${view.recipientName}.`}
            </p>
            <button onClick={() => setShowReveal(true)}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">
              <Sparkles className="mr-1.5 inline h-4 w-4" />Watch the reveal
            </button>
          </section>
        )}

        {/* Guest CTA */}
        {!isManager && view.status === "open" && step === "idle" && (
          <button onClick={() => { setStep("amount"); beacon("start"); }}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[15px] font-bold text-stone-900">
            Chip in for {view.recipientName}
          </button>
        )}

        {/* ── Contribute flow ── */}
        {step === "amount" && (
          <section aria-label="Choose amount" className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Step 1 of 3 · Your amount</p>
            <p className="mt-1 text-[14px] font-bold">How much would you like to chip in?</p>
            <div className="mt-3 flex gap-2">
              {[5, 10, 20, 50].map((a) => (
                <button key={a} onClick={() => setAmount(a)}
                  className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold ${amount === a ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600"}`}>£{a}</button>
              ))}
            </div>
            <input aria-label="Custom amount" type="number" min={1} max={500} value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              className="mt-2 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            {/* WS-2.2: the money becomes the thing, before they pay */}
            {view.goal > 0 && (
              <p className="mt-2 text-[12px] font-semibold text-amber-700">
                £{amount} moves {view.recipientName}&apos;s gift {Math.min(100 - pct, Math.max(1, Math.round((amount / view.goal) * 100)))}% closer.
              </p>
            )}
            <input aria-label="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name"
              className="mt-3 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            <p className="mt-1 text-[11px] text-stone-500">So {view.recipientName} knows who this came from at the reveal.</p>
            <button onClick={() => { setStep("sheet"); beacon("sheet"); }}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-[14px] font-bold text-white">Continue to payment</button>
          </section>
        )}

        {step === "sheet" && (
          <section aria-label="Payment" className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Step 2 of 3 · Payment</p>
            <div className="mb-3 mt-1 flex items-center justify-between">
              <p className="text-[14px] font-bold">Pay £{amount}</p>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Demo: no money moves</span>
            </div>
            {/* Fake Apple Pay (guardrail 1: never the real wallet API) */}
            <button onClick={() => setStep("message")}
              className="w-full rounded-xl bg-black py-3 text-[15px] font-semibold text-white"> Pay <span className="text-white/60">(simulated)</span></button>
            <div className="my-3 flex items-center gap-2 text-[11px] text-stone-500"><span className="h-px flex-1 bg-stone-200" />or card<span className="h-px flex-1 bg-stone-200" /></div>
            {/* Pre-filled dummy values; readOnly so nobody types a real PAN. Never read, never sent. */}
            <div className="space-y-2">
              <input readOnly value="4242 4242 4242 4242" aria-label="Card number (demo)" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
              <div className="flex gap-2">
                <input readOnly value="12/29" aria-label="Expiry (demo)" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
                <input readOnly value="123" aria-label="Security code (demo)" className="w-20 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
              </div>
              <p className="text-[11px] text-stone-500">This demo card is never read or sent; your £{amount} goes straight into the wish. <Link href="/#money" className="underline">How the money works</Link></p>
            </div>
            <button onClick={() => setStep("message")}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">Pay £{amount} (simulated)</button>
          </section>
        )}

        {step === "message" && (
          <section aria-label="Add a message" className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Step 3 of 3 · Your message</p>
            <p className="mt-1 text-[14px] font-bold">Add a message they&apos;ll see on the big day</p>
            <p className="mt-1 text-[12px] text-stone-500">{view.recipientName} will see this at the reveal, not before.</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500}
              placeholder="Write something they'll treasure…" className="mt-3 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            {videoRef ? (
              <p className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800">
                Video message attached <button aria-label="Remove video" onClick={() => setVideoRef(null)}><X className="h-4 w-4" /></button>
              </p>
            ) : recording ? (
              <div className="mt-3"><KindleRecord contributionId={contributionId} onRecorded={(m) => { setVideoRef(m.url); setRecording(false); }} onCancel={() => setRecording(false)} /></div>
            ) : (
              <div className="mt-2">
                <button onClick={() => setRecording(true)} className="w-full rounded-xl border border-stone-300 py-2.5 text-[13px] font-bold text-stone-700">Record a video instead</button>
                <p className="mt-1 text-[11px] text-stone-500">Your phone will ask for camera access. Only {view.recipientName} sees the video, at the reveal. Delete or re-record any time.</p>
              </div>
            )}
            <button onClick={() => { void submitContribution(); }} disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-[14px] font-bold text-white disabled:opacity-60">
              {submitting ? "Sealing…" : message || videoRef ? "Seal it for the reveal" : "Finish without a message"}
            </button>
          </section>
        )}

        {step === "done" && (
          <section aria-label="Thank you" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            {/* WS-3: coins-to-embers — the contribution lands in the gift (600ms, reduced-motion safe) */}
            <div className="relative mx-auto w-fit">
              <MaterialisingGift visual={giftVisualFor(view)} size={96} />
              {[[-26, -30], [0, -40], [26, -30], [-14, -38], [14, -38], [0, -26]].map(([x, y], i) => (
                <span key={i} aria-hidden className="animate-mg-ember-pop absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-orange-500"
                  style={{ "--ember-x": `${x}px`, "--ember-y": `${y}px`, animationDelay: `${i * 60}ms` } as React.CSSProperties} />
              ))}
            </div>
            <p className="mt-2 text-[16px] font-bold">
              {view.goal > 0
                ? <>You just lit up {Math.max(1, Math.round((amount / view.goal) * 100))}% of {view.recipientName}&apos;s gift.</>
                : <>You just made {view.recipientName}&apos;s big day bigger.</>}
            </p>
            <p className="mt-1 text-[13px] text-stone-600">They&apos;ll see your message when it&apos;s revealed on {new Date(view.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.</p>

            {/* WS-D: the conversion moment — after the dopamine, never before */}
            <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
              <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-stone-800"><Sparkles className="h-4 w-4 text-amber-500" /> Would you rather…</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["A log burner 🔥", "A Maldives fund 🌴"].map((c) => (
                  <button key={c} onClick={() => { setWyr(c); void fetch(`/api/sandbox/pots/${slug}/contribute?step=wyr&choice=${encodeURIComponent(c.replace(/[^\w ]/g, "").trim())}`, { method: "PUT" }); }}
                    className={`rounded-xl border p-3 text-[13px] font-semibold ${wyr === c ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>{c}</button>
                ))}
              </div>
              {wyr && (
                <Link href={`/sandbox?goal=${encodeURIComponent(wyr.replace(/[^\w ]/g, "").trim())}&ref=${slug}`}
                  className="mt-3 inline-block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-[14px] font-bold text-stone-900">
                  Start your own wish for it
                </Link>
              )}
            </div>
            <Link href={`/sandbox?ref=${slug}`} className="mt-3 inline-block text-[13px] font-semibold text-stone-600 underline underline-offset-2">
              Never send the awkward money-collection text again. Start your own wish
            </Link>
          </section>
        )}

        {/* ── Manager panel ── */}
        {isManager && view.kind === "manager" && (
          <section aria-label="Organiser tools" className="mt-8 rounded-2xl border-2 border-stone-900 bg-white p-5">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-stone-500"><Lock className="h-3.5 w-3.5" /> Organiser · {view.organiserName}</p>
            <div className="mt-3 space-y-1 text-[13px] text-stone-600">
              {view.contributors.map((c, i) => <p key={i}>{c.displayName} chipped in £{c.amount}</p>)}
              {view.contributors.length === 0 && <p className="text-stone-500">No contributions yet. Share the link!</p>}
            </div>
            <Link href={`/p/${slug}?view=receiver`} className="mt-3 inline-block text-[12px] text-stone-500 underline underline-offset-2">
              Preview what {view.recipientName} sees (surprise-safe)
            </Link>

            {/* P3.1 — the approval queue: kid-circled items wait here */}
            {view.isChildPot && view.status === "open" && (
              <div className="mt-4 border-t border-stone-200 pt-4">
                {view.pendingItems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[12px] font-bold text-stone-700">{view.recipientName} circled these — your call</p>
                    <ul className="mt-2 space-y-2">
                      {view.pendingItems.map((i) => (
                        <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2">
                          <span className="min-w-0 text-[13px] font-semibold text-stone-800">{i.name} <span className="font-normal text-stone-500">· £{i.price}</span></span>
                          <span className="flex shrink-0 gap-1.5">
                            <button onClick={() => { void reviewPending(i.id, true); }} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white">Add it</button>
                            <button onClick={() => { void reviewPending(i.id, false); }} className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-[11px] font-bold text-stone-600">Not this time</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link href={`/p/${slug}?view=kid&key=${managerKey}`} className="inline-block rounded-xl border border-stone-300 px-3.5 py-2 text-[12px] font-bold text-stone-700">
                  Hand the catalogue to {view.recipientName}
                </Link>
                <p className="mt-1.5 text-[11px] text-stone-500">They circle what they&apos;d love on your phone; nothing joins the wish until you approve it here.</p>
              </div>
            )}

            {view.status === "open" ? (
              <div className="mt-4 border-t border-stone-200 pt-4">
                <button disabled={revealBusy} onClick={() => { void openReveal(); }}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">
                  <Gift className="mr-1.5 inline h-4 w-4" />Simulate reveal day
                </button>
                <p className="mt-2 text-[11px] text-stone-500">Runs the full reveal experience, and you choose the outcome at the end.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[13px] text-emerald-800">
                <p className="font-bold">Revealed · outcome: {view.revealOutcome}</p>
                {voucher && <p className="mt-1">Simulated voucher: <span className="font-mono font-bold">{voucher}</span></p>}
                {view.simulatedCommission !== undefined && <p className="mt-1">Simulated commission recorded: £{view.simulatedCommission} <span className="text-emerald-600/70">(labelled simulated — sandbox only)</span></p>}
                <p className="mt-2">Messages unsealed: {view.messages.length}</p>
                <button onClick={() => { void openReveal(); }} className="mt-2 rounded-xl border border-emerald-300 px-3.5 py-2 text-[12px] font-bold text-emerald-800">Watch the reveal again</button>
              </div>
            )}
          </section>
        )}

        <p className="mt-10 text-center text-[11px] text-stone-500">
          <LogoMark variant="light" compact size={14} className="mr-1 inline-block align-[-2px]" />Kindled sandbox · simulated money · <Link href="/sandbox" className="underline">start your own wish</Link>
        </p>

        {showReveal && (
          <RevealExperience
            slug={slug}
            recipientName={view.recipientName}
            eventDate={view.eventDate}
            raised={view.raised}
            goal={view.goal}
            isChild={view.isChildPot}
            contributors={view.contributors}
            messages={revealMsgs ?? (view.kind === "manager" ? view.messages : (view.unsealedMessages ?? []))}
            items={view.items.map((i) => ({ name: i.name, price: i.price }))}
            canChooseOutcome={isManager && view.status === "open"}
            {...(isManager && view.status === "open" ? {
              onOutcome: async (outcome: RevealOutcome, retailer?: string) => {
                setRevealBusy(true);
                try {
                  const r = await fetch(`/api/sandbox/pots/${slug}/reveal`, { method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: managerKey, outcome, ...(retailer ? { retailer } : {}) }) });
                  if (r.ok && outcome === "gift_card") setVoucher(`KND-${slug.slice(0, 4).toUpperCase()}-DEMO`);
                  await load();
                } finally { setRevealBusy(false); }
              },
            } : {})}
            {...(view.kind === "manager" && view.revealOutcome ? { existingOutcome: view.revealOutcome } : {})}
            onClose={() => setShowReveal(false)}
          />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// P3.1 — KIDS' "CIRCLE IT" VIEW
// Rendered on the parent's device (manager link). The child taps catalogue
// cards; a felt-tip loop draws around their picks. Catalogue data only —
// no free text, no inputs, nothing collected from the child.
// ═══════════════════════════════════════════════════════════════════════════════

const KID_CATALOGUE = [
  { name: "LEGO Friends Treehouse", price: 65, category: "Toys", retailer: "Smyths" },
  { name: "Roller skates", price: 45, category: "Sports", retailer: "Decathlon" },
  { name: "Art supplies set", price: 22, category: "Craft", retailer: "Hobbycraft" },
  { name: "Nintendo Switch game", price: 45, category: "Games", retailer: "Argos" },
  { name: "Telescope", price: 120, category: "Science", retailer: "John Lewis" },
  { name: "Football boots", price: 38, category: "Sports", retailer: "Sports Direct" },
  { name: "Craft beads mega tub", price: 15, category: "Craft", retailer: "Hobbycraft" },
  { name: "Walkie talkies", price: 28, category: "Toys", retailer: "Argos" },
] as const;

function FeltTipLoop() {
  // A wobbly hand-drawn ellipse that draws itself in (reduced-motion safe).
  return (
    <svg viewBox="0 0 100 60" className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)]" aria-hidden="true">
      <path
        d="M50 4 C82 2 97 14 96 30 C95 48 74 57 48 56 C22 55 4 46 4 30 C4 13 24 6 54 5"
        fill="none" stroke="#ff6b6b" strokeWidth="3.5" strokeLinecap="round"
        pathLength={1} className="animate-felt-draw" style={{ transform: "rotate(-2deg)", transformOrigin: "center" }}
      />
    </svg>
  );
}

function KidCircleView({ view, slug, managerKey, onChanged }: {
  view: Extract<PotView, { kind: "manager" }>;
  slug: string;
  managerKey: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const circledNames = new Set([
    ...view.items.map((i) => i.name),
    ...view.pendingItems.map((i) => i.name),
  ]);

  async function circle(item: (typeof KID_CATALOGUE)[number]) {
    if (busy || circledNames.has(item.name)) return;
    setBusy(item.name);
    await fetch(`/api/sandbox/pots/${slug}/items`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: managerKey, action: "circle", item }),
    });
    if (typeof navigator !== "undefined") navigator.vibrate?.(10);
    onChanged();
    setBusy(null);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8 pb-24">
      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">The catalogue</p>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-[28px] font-bold leading-tight">
        Circle what you&apos;d love, {view.recipientName}
      </h1>
      <p className="mt-1.5 text-[13px] text-stone-600">Tap anything that makes your eyes go big. A grown-up says yes before it counts.</p>
      {view.starChartEnabled && (
        <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
          <Sparkles className="h-3.5 w-3.5 shrink-0" /> Your stars go toward whatever gets circled.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {KID_CATALOGUE.map((item) => {
          const on = circledNames.has(item.name);
          return (
            <button key={item.name} onClick={() => { void circle(item); }} disabled={!!busy}
              aria-pressed={on}
              className={`relative rounded-2xl border-2 p-3.5 text-left transition-transform active:scale-95 ${on ? "border-transparent bg-white" : "border-stone-200 bg-white"}`}>
              {on && <FeltTipLoop />}
              <p className="text-[14px] font-bold leading-snug text-stone-800">{item.name}</p>
              <p className="mt-1 text-[11px] text-stone-500">£{item.price} · {item.retailer}</p>
              <p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${on ? "text-[#ff6b6b]" : "text-stone-400"}`}>
                {on ? "Circled!" : "Tap to circle"}
              </p>
            </button>
          );
        })}
      </div>

      <Link href={`/p/${slug}?key=${managerKey}`}
        className="mt-8 block w-full rounded-2xl bg-stone-900 py-3.5 text-center text-[14px] font-bold text-white">
        All done — hand back to the grown-up
      </Link>
      <p className="mt-2 text-center text-[11px] text-stone-500">Circled things wait for a grown-up&apos;s yes.</p>
    </main>
  );
}
