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
import { Flame, Check, Lock, Gift, Sparkles, X } from "lucide-react";
import { DemoBanner } from "@/components/DemoBanner";
import { KindleRecord } from "@/components/KindleRecord";
import type { PotView } from "@/lib/sandbox/redact";

type Step = "idle" | "amount" | "sheet" | "message" | "done";

export default function PotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const search = useSearchParams();
  const managerKey = search.get("key");
  const asReceiver = search.get("view") === "receiver";

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

  const beacon = (stepName: "start" | "sheet") =>
    void fetch(`/api/sandbox/pots/${slug}/contribute?step=${stepName}`, { method: "PUT" });

  async function submitContribution() {
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
    if (res.ok) { setStep("done"); void load(); }
  }

  if (missing) {
    return (
      <div className="min-h-screen bg-[#fdf9f5]"><DemoBanner />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <p className="text-[15px] text-stone-600">This pot doesn&apos;t exist (the sandbox may have been reset).</p>
          <Link href="/sandbox" className="mt-4 inline-block rounded-2xl bg-stone-900 px-5 py-3 text-[14px] font-bold text-white">Start a pot</Link>
        </main>
      </div>
    );
  }
  if (!view) return <div className="min-h-screen bg-[#fdf9f5]"><DemoBanner /><p className="py-16 text-center text-[14px] text-stone-400">Warming up…</p></div>;

  // ── Receiver surprise view — the API sent no numbers; render the warmth ──
  if (view.kind === "receiver_surprise") {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#fdf6e3]"><DemoBanner />
        <main className="mx-auto max-w-md px-5 py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15"><Lock className="h-7 w-7 text-amber-400" /></span>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-5 text-[28px] font-bold">Something&apos;s being kept warm for you, {view.recipientName}</h1>
          <p className="mt-3 text-[14px] text-[#fdf6e3]/60">
            {view.activity === "quiet" ? "The embers are lit." : view.activity === "warming" ? "People are chipping in ✨" : "It's glowing in here ✨"}
            {" "}Everything stays a surprise until {new Date(view.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.
          </p>
          <p className="mt-8 text-[11px] text-[#fdf6e3]/30">Hidden from you — it&apos;s a surprise. That&apos;s the whole point.</p>
        </main>
      </div>
    );
  }

  const pct = view.goal > 0 ? Math.min(100, Math.round((view.raised / view.goal) * 100)) : 0;
  const isManager = view.kind === "manager";

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      <DemoBanner />
      <main className="mx-auto max-w-md px-5 py-8 pb-24">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">{view.occasion} · {new Date(view.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-[28px] font-bold leading-tight">{view.title}</h1>

        {/* Progress */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[24px] font-bold">£{view.raised}<span className="text-[13px] font-medium text-stone-400"> of £{view.goal}</span></p>
            <p className="text-[13px] font-bold text-amber-600">{pct}%</p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-stone-500">{view.contributors.length} contributor{view.contributors.length === 1 ? "" : "s"} · {view.messageCount} message{view.messageCount === 1 ? "" : "s"} sealed for the big day</p>
        </div>

        {/* List */}
        <div className="mt-4 space-y-2">
          {view.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
              <div><p className="text-[14px] font-semibold">{i.name}</p><p className="text-[11px] text-stone-400">{i.retailer} · {i.category}</p></div>
              <p className="text-[14px] font-bold text-stone-700">£{i.price}</p>
            </div>
          ))}
        </div>

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
            <p className="text-[14px] font-bold">How much would you like to chip in?</p>
            <div className="mt-3 flex gap-2">
              {[5, 10, 20, 50].map((a) => (
                <button key={a} onClick={() => setAmount(a)}
                  className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold ${amount === a ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600"}`}>£{a}</button>
              ))}
            </div>
            <input aria-label="Custom amount" type="number" min={1} max={500} value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              className="mt-2 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            <input aria-label="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name (shown at the reveal)"
              className="mt-2 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            <button onClick={() => { setStep("sheet"); beacon("sheet"); }}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-[14px] font-bold text-white">Continue to payment</button>
          </section>
        )}

        {step === "sheet" && (
          <section aria-label="Payment" className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-bold">Pay £{amount}</p>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Demo — no money moves</span>
            </div>
            {/* Fake Apple Pay (guardrail 1: never the real wallet API) */}
            <button onClick={() => setStep("message")}
              className="w-full rounded-xl bg-black py-3 text-[15px] font-semibold text-white"> Pay <span className="text-white/60">(simulated)</span></button>
            <div className="my-3 flex items-center gap-2 text-[11px] text-stone-400"><span className="h-px flex-1 bg-stone-200" />or card<span className="h-px flex-1 bg-stone-200" /></div>
            {/* Pre-filled dummy values; readOnly so nobody types a real PAN. Never read, never sent. */}
            <div className="space-y-2">
              <input readOnly value="4242 4242 4242 4242" aria-label="Card number (demo)" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
              <div className="flex gap-2">
                <input readOnly value="12/29" aria-label="Expiry (demo)" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
                <input readOnly value="123" aria-label="Security code (demo)" className="w-20 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-500" />
              </div>
              <p className="text-[11px] text-stone-400">Demo card — pre-filled so you never type a real card number. These fields are never sent anywhere.</p>
            </div>
            <button onClick={() => setStep("message")}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-[14px] font-bold text-stone-900">Pay £{amount} (simulated)</button>
          </section>
        )}

        {step === "message" && (
          <section aria-label="Add a message" className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-[14px] font-bold">Add a message they&apos;ll see on the big day</p>
            <p className="mt-1 text-[12px] text-stone-500">{view.recipientName} will see this at the reveal — not before.</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500}
              placeholder="Write something they'll treasure…" className="mt-3 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
            {videoRef ? (
              <p className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800">
                Video message attached <button aria-label="Remove video" onClick={() => setVideoRef(null)}><X className="h-4 w-4" /></button>
              </p>
            ) : recording ? (
              <div className="mt-3"><KindleRecord contributionId={contributionId} onRecorded={(m) => { setVideoRef(m.url); setRecording(false); }} onCancel={() => setRecording(false)} /></div>
            ) : (
              <button onClick={() => setRecording(true)} className="mt-2 w-full rounded-xl border border-stone-300 py-2.5 text-[13px] font-bold text-stone-700">Record a video instead</button>
            )}
            <button onClick={() => { void submitContribution(); }}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-[14px] font-bold text-white">
              {message || videoRef ? "Seal it for the reveal" : "Finish without a message"}
            </button>
          </section>
        )}

        {step === "done" && (
          <section aria-label="Thank you" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500"><Check className="h-6 w-6 text-white" strokeWidth={3} /></span>
            <p className="mt-3 text-[16px] font-bold">You just made {view.recipientName}&apos;s big day bigger.</p>
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
                  Start your own pot for it
                </Link>
              )}
            </div>
            <Link href={`/sandbox?ref=${slug}`} className="mt-3 inline-block text-[13px] font-semibold text-stone-600 underline underline-offset-2">
              Never do the awkward money-collection text again — start your own pot
            </Link>
          </section>
        )}

        {/* ── Manager panel ── */}
        {isManager && view.kind === "manager" && (
          <section aria-label="Organiser tools" className="mt-8 rounded-2xl border-2 border-stone-900 bg-white p-5">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-stone-500"><Lock className="h-3.5 w-3.5" /> Organiser · {view.organiserName}</p>
            <div className="mt-3 space-y-1 text-[13px] text-stone-600">
              {view.contributors.map((c, i) => <p key={i}>{c.displayName} chipped in £{c.amount}</p>)}
              {view.contributors.length === 0 && <p className="text-stone-400">No contributions yet — share the link!</p>}
            </div>
            <Link href={`/p/${slug}?view=receiver`} className="mt-3 inline-block text-[12px] text-stone-500 underline underline-offset-2">
              Preview what {view.recipientName} sees (surprise-safe)
            </Link>

            {view.status === "open" ? (
              <div className="mt-4 border-t border-stone-200 pt-4">
                <p className="text-[13px] font-bold">Simulate reveal day</p>
                <div className="mt-2 grid gap-2">
                  {([["gift_card", "Convert to gift card"], ["product", "Mark as product purchased"], ["stack", "Stack to the next occasion"]] as const).map(([o, label]) => (
                    <button key={o} disabled={revealBusy} onClick={() => {
                      setRevealBusy(true);
                      void fetch(`/api/sandbox/pots/${slug}/reveal`, { method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ key: managerKey, outcome: o, retailer: o === "gift_card" ? "Smyths" : undefined }) })
                        .then(async (r) => { if (r.ok && o === "gift_card") setVoucher(`KND-${slug.slice(0, 4).toUpperCase()}-DEMO`); await load(); })
                        .finally(() => setRevealBusy(false));
                    }} className="rounded-xl border border-stone-300 py-2.5 text-[13px] font-bold text-stone-700 hover:bg-stone-50">
                      <Gift className="mr-1.5 inline h-4 w-4" />{label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-[13px] text-emerald-800">
                <p className="font-bold">Revealed · outcome: {view.revealOutcome}</p>
                {voucher && <p className="mt-1">Simulated voucher: <span className="font-mono font-bold">{voucher}</span></p>}
                {view.simulatedCommission !== undefined && <p className="mt-1">Simulated commission recorded: £{view.simulatedCommission} <span className="text-emerald-600/70">(labelled simulated — sandbox only)</span></p>}
                <p className="mt-2">Messages unsealed: {view.messages.length}</p>
              </div>
            )}
          </section>
        )}

        <p className="mt-10 text-center text-[11px] text-stone-400">
          <Flame className="mr-1 inline h-3 w-3 text-amber-500" />Kindled sandbox · simulated money · <Link href="/sandbox" className="underline">start your own pot</Link>
        </p>
      </main>
    </div>
  );
}
