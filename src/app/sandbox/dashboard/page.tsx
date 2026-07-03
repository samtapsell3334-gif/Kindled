"use client";

/**
 * Sandbox business dashboard (v4.1 WS-F) — the investor evidence. Every panel is
 * driven by the REAL event log (guardrail 7: nothing invented; seeded pots are
 * labelled). Shared-secret gate for the sandbox (TODO-FOUNDER: real auth).
 */

import { useMemo, useState } from "react";
import { Download, Lock, BarChart2 } from "lucide-react";
import { DemoBanner } from "@/components/DemoBanner";
import type { SandboxEvent } from "@/lib/sandbox/types";

const count = (evts: SandboxEvent[], name: string) => evts.filter((e) => e.event === name).length;

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function download(name: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function Panel({ title, children, csv }: { title: string; children: React.ReactNode; csv?: () => void }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-stone-900">{title}</h2>
        {csv && (
          <button onClick={csv} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-600">
            <Download className="h-3 w-3" /> CSV
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

const tally = (evts: SandboxEvent[], name: string, key: string): [string, number][] => {
  const m = new Map<string, number>();
  for (const e of evts.filter((x) => x.event === name)) {
    const v = String(e.props?.[key] ?? "unknown");
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export default function DashboardPage() {
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<SandboxEvent[] | null>(null);
  const [error, setError] = useState("");

  async function unlock() {
    setError("");
    const res = await fetch(`/api/sandbox/admin?secret=${encodeURIComponent(secret)}`);
    if (!res.ok) { setError("Wrong secret."); return; }
    setEvents(((await res.json()) as { events: SandboxEvent[] }).events);
  }

  const funnel = useMemo(() => {
    if (!events) return [];
    const steps: [string, string][] = [
      ["Wish viewed", "pot_viewed"], ["Contribution started", "contribution_started"],
      ["Payment sheet viewed", "payment_sheet_viewed"], ["Contribution completed", "contribution_completed"],
      ["Message/video added", "message_added"], ["WYR answered", "wyr_answered"],
      ["Own wish created from a share", "pot_created"],
    ];
    const rows = steps.map(([label, name]) => [label, name === "pot_created" ? events.filter((e) => e.event === name && e.ref).length : count(events, name)] as [string, number]);
    return rows;
  }, [events]);

  const k = useMemo(() => {
    if (!events) return null;
    const contributions = count(events, "contribution_completed");
    const referredPots = events.filter((e) => e.event === "pot_created" && e.ref).length;
    const conv = contributions > 0 ? referredPots / contributions : 0;
    const pots = count(events, "pot_created");
    const invites = pots > 0 ? count(events, "pot_viewed") / pots : 0;
    return { contributions, referredPots, conv, invites, K: Math.round(invites * conv * 100) / 100 };
  }, [events]);

  const commission = useMemo(() => {
    if (!events) return 0;
    return events.filter((e) => e.event === "reveal_outcome")
      .reduce((a, e) => a + Number(e.props?.simulated_commission ?? 0), 0);
  }, [events]);

  if (!events) {
    return (
      <div className="min-h-screen bg-[#fdf9f5]"><DemoBanner />
        <main className="mx-auto max-w-sm px-5 py-20 text-center">
        <p className="mb-4 rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-[12px] text-stone-600">
          Waitlist sign-ups and survey results live in the founder console: <a href="/beta" className="font-bold underline">/beta</a> (PIN-gated).
        </p>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900"><Lock className="h-5 w-5 text-amber-400" /></span>
          <h1 className="mt-4 text-[22px] font-bold text-stone-900">Business dashboard</h1>
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Admin secret"
            className="mt-4 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" aria-label="Admin secret" />
          {error && <p role="alert" className="mt-2 text-[13px] text-rose-600">{error}</p>}
          <button onClick={() => { void unlock(); }} className="mt-3 w-full rounded-2xl bg-stone-900 py-3 text-[14px] font-bold text-white">Unlock</button>
        </main>
      </div>
    );
  }

  const intent = tally(events, "item_added", "category");
  const retailers = tally(events, "item_added", "retailer");
  const bands = tally(events, "item_added", "price_band");
  const outcomes = tally(events, "reveal_outcome", "outcome");
  const wyrSplit = tally(events, "wyr_answered", "choice");
  const msgTypes = tally(events, "message_added", "type");

  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900"><DemoBanner />
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-8">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-amber-600" />
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[24px] font-bold">Sandbox evidence</h1>
          <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-stone-500">{events.length} events · sandbox sample</span>
        </div>

        <Panel title="1 · Intent data (the retail-media asset)" csv={() => download("intent", [["dimension", "value", "count"], ...intent.map(([v, c]) => ["category", v, c]), ...retailers.map(([v, c]) => ["retailer", v, c]), ...bands.map(([v, c]) => ["price_band", v, c])])}>
          <div className="grid gap-4 text-[13px] sm:grid-cols-3">
            {[["By category", intent], ["By retailer", retailers], ["By price band", bands]].map(([label, rows]) => (
              <div key={label as string}>
                <p className="mb-1 text-[11px] font-bold uppercase text-stone-400">{label as string}</p>
                {(rows as [string, number][]).map(([v, c]) => <p key={v} className="flex justify-between text-stone-600"><span>{v}</span><span className="font-bold">{c}</span></p>)}
                {(rows as [string, number][]).length === 0 && <p className="text-stone-400">No data yet</p>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="2 · Funnel" csv={() => download("funnel", [["step", "count"], ...funnel])}>
          {funnel.map(([label, c], i) => {
            const first = Number(funnel[0]?.[1] ?? 0);
            const pct = first > 0 ? Math.round((Number(c) / first) * 100) : 0;
            return (
              <div key={String(label)} className="mb-1.5">
                <div className="flex justify-between text-[12px] text-stone-600"><span>{i + 1}. {label}</span><span className="font-bold">{c} · {pct}%</span></div>
                <div className="h-1.5 rounded-full bg-stone-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </Panel>

        <Panel title="3 · K-factor" csv={() => k ? download("k-factor", [["metric", "value"], ["contributions", k.contributions], ["referred wishes", k.referredPots], ["invite views per wish", k.invites.toFixed(2)], ["contributor→creator conversion", k.conv.toFixed(3)], ["K", k.K]]) : undefined}>
          {k && (
            <div className="text-[13px] text-stone-600">
              <p className="mb-2 text-[12px] italic text-stone-400">K = average invites per new user × invite → new-wish conversion. Sandbox sample: small numbers, honestly labelled.</p>
              <p>Views per wish (invite proxy): <b>{k.invites.toFixed(2)}</b> · Contributor → creator conversion: <b>{(k.conv * 100).toFixed(1)}%</b></p>
              <p className="mt-1 text-[20px] font-bold text-stone-900">K = {k.K}</p>
              <p className="mt-2 text-[12px]">Referral chain: {k.referredPots} pot{k.referredPots === 1 ? "" : "s"} created from shared links ({events.filter((e) => e.event === "pot_created" && e.ref).map((e) => `←${String(e.ref).slice(0, 6)}`).join(" · ") || "none yet"})</p>
            </div>
          )}
        </Panel>

        <Panel title="3b · Occasions (v11 WS-1)">
          {events && (() => {
            const occasions = new Set(events.filter((e) => e.event === "pot_created").map((e) => e.potId)).size;
            const wishesAdded = events.filter((e) => e.event === "wish_added_to_occasion").length;
            const attributed = events.filter((e) => e.event === "contribution_completed" && e.props && "item_id" in (e.props as object));
            // per-wish funding velocity: attributed contributions per wish per day of activity
            const days = Math.max(1, new Set(events.map((ev) => new Date(ev.ts).toISOString().slice(0, 10))).size);
            return (
              <div className="flex flex-wrap gap-6 text-[13px] text-stone-600">
                <p>Average wishes per occasion: <b>{occasions ? (wishesAdded / occasions).toFixed(1) : "—"}</b></p>
                <p>Attributed chip-ins: <b>{attributed.length}</b></p>
                <p>Per-wish funding velocity: <b>{wishesAdded ? (attributed.length / wishesAdded / days).toFixed(2) : "—"}</b> <span className="text-stone-400">chip-ins/wish/day</span></p>
                {(() => {
                  // Cycle time (v11 WS-15 tie-in): the store stamps referred occasions
                  // with source_created_at at creation, so this is a direct read.
                  const deltas = events
                    .filter((e) => e.event === "pot_created" && e.props && typeof (e.props as Record<string, unknown>).source_created_at === "number")
                    .map((e) => (e.ts - ((e.props as Record<string, unknown>).source_created_at as number)) / 3_600_000)
                    .filter((h) => h >= 0)
                    .sort((a, b) => a - b);
                  const median = deltas.length ? deltas[Math.floor(deltas.length / 2)]! : null;
                  return <p>Cycle time (occasion → referred occasion): <b>{median !== null ? `${median.toFixed(1)}h median` : "—"}</b> <span className="text-stone-400">n={deltas.length}</span></p>;
                })()}
              </div>
            );
          })()}
        </Panel>

        <Panel title="4 · Reveal economics" csv={() => download("reveals", [["outcome", "count"], ...outcomes, ["simulated commission £", commission]])}>
          <div className="flex flex-wrap gap-6 text-[13px] text-stone-600">
            {outcomes.map(([o, c]) => <p key={o}>{o}: <b>{c}</b></p>)}
            {outcomes.length === 0 && <p className="text-stone-400">No reveals yet</p>}
            <p>Simulated gift-card commission: <b>£{commission.toFixed(2)}</b> <span className="text-stone-400">(simulated, sandbox only)</span></p>
          </div>
        </Panel>

        <Panel title="5 · Engagement" csv={() => download("engagement", [["metric", "value"], ...msgTypes.map(([t, c]) => [`messages: ${t}`, c] as [string, number]), ...wyrSplit])}>
          <div className="flex flex-wrap gap-6 text-[13px] text-stone-600">
            {msgTypes.map(([t, c]) => <p key={t}>{t} messages: <b>{c}</b></p>)}
            {wyrSplit.map(([w, c]) => <p key={w}>&ldquo;{w}&rdquo;: <b>{c}</b></p>)}
            {msgTypes.length === 0 && wyrSplit.length === 0 && <p className="text-stone-400">No engagement data yet</p>}
          </div>
        </Panel>
      </main>
    </div>
  );
}
