"use client";

/**
 * My wishes (sandbox) — the organiser's home after building. Lists the wishes created
 * on this device (localStorage; the private manager keys never leave the browser),
 * with live progress and one-tap access to run the reveal — surrounded by the
 * marketing/conversion surfaces (waitlist, "Would you rather?", Stack) so the
 * post-build moment sells the next step, per the v4.1 conversion engine rules.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Sparkles, ArrowRight, Plus } from "lucide-react";
import { DemoBanner } from "@/components/DemoBanner";
import { ExampleWishes } from "@/components/sandbox/ExampleWishes";
import { Logo } from "@/components/Logo";
import { WaitlistForm } from "@/components/WaitlistForm";

interface MyPot { slug: string; managerKey: string; title: string; recipientName: string; createdAt: number }
interface LivePot { raised: number; goal: number; status: string; contributors: { displayName: string }[]; messageCount: number }

export default function MyPotsPage() {
  const [mine, setMine] = useState<MyPot[]>([]);
  const [live, setLive] = useState<Record<string, LivePot>>({});
  const [wyr, setWyr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("kindled-my-pots") ?? "[]") as MyPot[];
      setMine(stored);
      for (const p of stored.slice(0, 10)) {
        void fetch(`/api/sandbox/pots/${p.slug}?key=${p.managerKey}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((v: LivePot | null) => { if (v) setLive((prev) => ({ ...prev, [p.slug]: v })); });
      }
    } catch { /* storage blocked */ }
  }, []);

  return (
    <div className="min-h-screen bg-ground text-stone-900">
      <DemoBanner />
      <main className="mx-auto max-w-md px-5 py-8 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" aria-label="Kindled home"><Logo variant="light" size={30} /></Link>
          <Link href="/sandbox" className="flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-[12px] font-bold text-white">
            <Plus className="h-3.5 w-3.5" /> New wish
          </Link>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[28px] font-bold">My wishes</h1>
        <p className="mt-1 text-[13px] text-stone-500">Every wish you&apos;ve built on this device. Share them, watch them fill, then run the reveal.</p>

        {mine.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-8 text-center">
            <p className="text-[14px] text-stone-500">No wishes yet.</p>
            <Link href="/sandbox" className="mt-3 inline-block rounded-2xl cta-primary px-6 py-3 text-[14px] font-bold">Start your first wish</Link>
            <div className="mt-6 text-left"><ExampleWishes /></div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {mine.map((p) => {
              const v = live[p.slug];
              const pct = v && v.goal > 0 ? Math.min(100, Math.round((v.raised / v.goal) * 100)) : 0;
              const revealed = v && v.status !== "open";
              return (
                <div key={p.slug} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-bold">{p.title}</p>
                      <p className="text-[12px] text-stone-500">for {p.recipientName}</p>
                    </div>
                    {revealed && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">Revealed</span>}
                  </div>
                  {v ? (
                    <>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1.5 text-[12px] text-stone-500">£{v.raised} of £{v.goal} · {v.contributors.length} contributor{v.contributors.length === 1 ? "" : "s"} · {v.messageCount} sealed message{v.messageCount === 1 ? "" : "s"}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-[12px] text-stone-500">Loading… (the sandbox may have been reset; wishes don&apos;t survive a reset)</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Link href={`/p/${p.slug}?key=${p.managerKey}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-[13px] font-bold text-stone-900">
                      <Gift className="h-4 w-4" /> {revealed ? "Watch the reveal" : "Open · run the reveal"}
                    </Link>
                    <Link href={`/p/${p.slug}`} className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-[13px] font-semibold text-stone-600">Share view</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Conversion surfaces (post-build moment, one idea per card) ── */}
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold"><Sparkles className="h-4 w-4 text-amber-500" /> Would you rather…</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["A log burner 🔥", "A Maldives fund 🌴"].map((c) => (
              <button key={c} onClick={() => setWyr(c)}
                className={`rounded-xl border p-3 text-[13px] font-semibold ${wyr === c ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>{c}</button>
            ))}
          </div>
          {wyr && (
            <Link href={`/sandbox?goal=${encodeURIComponent(wyr.replace(/[^\w ]/g, "").trim())}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-stone-900 py-3 text-[13px] font-bold text-white">
              Start a wish for it <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13px] font-bold text-stone-800">Big dreams take more than one birthday</p>
          <p className="mt-1 text-[12px] leading-relaxed text-stone-600">
            A wish that isn&apos;t finished by the big day simply <span className="font-semibold">stacks forward</span>, birthday to Christmas to birthday, so nothing raised is ever wasted.
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-stone-900 bg-stone-900 p-5 text-center">
          <p className="text-[14px] font-bold text-white">Like building with Kindled?</p>
          <p className="mx-auto mt-1 max-w-[300px] text-[12px] text-white/60">This sandbox uses simulated money. Reserve your spot and be first in when the real thing launches.</p>
          <div className="mt-4"><WaitlistForm variant="dark" /></div>
        </div>
      </main>
    </div>
  );
}
