"use client";

/**
 * ExampleWishes (v9 WS-2.4) — "this is where your wish ends up".
 * A small gallery of completed example wishes shown where organisers and
 * contributors decide. Clearly badged as examples: this is seeded demo data
 * (DMCC — nothing illustrative presented as real), including one stacked wish
 * so Stack is sold by outcome rather than explanation.
 */

import { MaterialisingGift } from "@/components/sandbox/MaterialisingGift";

const EXAMPLES = [
  {
    title: "Ava's telescope",
    line: "14 people chipped in. Revealed on her 8th birthday, filmed by her mum.",
    outcome: "Fully funded",
  },
  {
    title: "Priya's leaving gift",
    line: "The whole team, one link. She cried at the spa voucher.",
    outcome: "Fully funded",
  },
  {
    title: "The log burner",
    line: "Carried from a birthday to Christmas, then granted. Nothing raised was lost.",
    outcome: "Stacked, then granted",
  },
] as const;

export function ExampleWishes({ heading = "Where wishes end up" }: { heading?: string }) {
  return (
    <section aria-label="Example wishes" className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-stone-800">{heading}</p>
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">
          Example wishes
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-stone-500">Seeded demo data, shown so you can see the finish line.</p>
      <div className="mt-3 space-y-2.5">
        {EXAMPLES.map((e) => (
          <div key={e.title} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
            <MaterialisingGift visual={{ mode: "complete" }} size={44} className="shrink-0" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-stone-800">
                {e.title}
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{e.outcome}</span>
              </p>
              <p className="text-[12px] leading-snug text-stone-600">{e.line}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
