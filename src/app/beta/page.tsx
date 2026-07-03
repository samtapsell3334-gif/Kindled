"use client";

/**
 * /beta — the founder's early-access ledger + research dashboard (v11 WS-13/14).
 * Server-side gated: this page holds NO pin constant; it posts the entered PIN
 * to /api/beta (BETA_PIN env var, rate-limited) and renders whatever the server
 * returns. Excluded from sitemap; robots noindex via layout metadata.
 */

import { useMemo, useState } from "react";
import { Download, Lock, Search } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { QUESTIONS, SCREENER } from "@/content/survey";

interface Signup { email: string; source: string; createdAt: string }
interface Response { sessionId: string; segment: string | null; answers: Record<string, string | string[]>; completed: boolean; createdAt: string }
type Seg = "all" | "parents" | "nonparents";

const isParent = (r: Response) => r.segment === "parent" || r.segment === "both";

function csvOf(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
}
function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[11px] text-stone-600"><span>{label}</span><span className="font-semibold">{count} · {pct}%</span></div>
      <div className="h-2 rounded-full bg-stone-100"><div className="h-full rounded-full [background:var(--ember)]" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function BetaPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<{ signups: Signup[]; survey: Response[] } | null>(null);
  const [tab, setTab] = useState<"signups" | "survey">("signups");
  const [seg, setSeg] = useState<Seg>("all");
  const [q, setQ] = useState("");

  async function unlock() {
    setError("");
    const r = await fetch("/api/beta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    if (!r.ok) { setError(r.status === 429 ? "Too many attempts. Try later." : "Wrong PIN."); return; }
    setData((await r.json()) as { signups: Signup[]; survey: Response[] });
  }

  const responses = useMemo(() => {
    const all = (data?.survey ?? []).filter((r) => r.segment !== "neither");
    if (seg === "parents") return all.filter(isParent);
    if (seg === "nonparents") return all.filter((r) => !isParent(r) && r.segment);
    return all;
  }, [data, seg]);
  const completed = responses.filter((r) => r.completed);
  // v11.3 Patch 4: these two panels are ALWAYS parents-only (the questions
  // themselves only ever reach parent/both respondents), independent of the
  // page's global segment toggle — otherwise buyer-segment rows (who never
  // saw these questions) would dilute the denominator and understate %s.
  const parentsCompleted = useMemo(
    () => (data?.survey ?? []).filter((r) => r.completed && isParent(r)),
    [data],
  );

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground px-5">
        <div className="w-full max-w-xs text-center">
          <LogoMark variant="light" size={40} className="mx-auto" />
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-bold text-stone-700"><Lock className="h-3.5 w-3.5" /> Founder console</p>
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void unlock()}
            aria-label="PIN" placeholder="PIN" className="mt-3 w-full rounded-xl border border-stone-300 bg-[var(--card)] px-4 py-3 text-center text-[16px] tracking-widest" />
          <button onClick={() => void unlock()} className="cta-primary mt-2.5 w-full rounded-xl py-3 text-[14px] font-bold">Unlock</button>
          {error && <p role="alert" className="mt-2 text-[12px] font-semibold text-rose-600">{error}</p>}
        </div>
      </div>
    );
  }

  const spark = (() => {
    const days = new Map<string, number>();
    for (const r of responses) days.set(r.createdAt.slice(0, 10), (days.get(r.createdAt.slice(0, 10)) ?? 0) + 1);
    const entries = [...days.entries()].sort();
    const max = Math.max(1, ...entries.map(([, n]) => n));
    return { entries, max };
  })();

  const single = (id: string, opts: string[], base: Response[] = completed) => {
    const counts = opts.map((o) => ({ o, n: base.filter((r) => r.answers[id] === o).length }));
    const total = counts.reduce((s, c) => s + c.n, 0);
    return { counts, total };
  };
  const multi = (id: string, opts: string[], base: Response[] = completed) => {
    const counts = opts.map((o) => ({ o, n: base.filter((r) => Array.isArray(r.answers[id]) && r.answers[id].includes(o)).length }));
    return { counts, total: base.length };
  };

  const concept = single("q13_concept", ["Definitely", "Probably", "Not sure", "Probably not"]);
  const intentPct = concept.total ? Math.round(((concept.counts[0]!.n + concept.counts[1]!.n) / concept.total) * 100) : 0;
  const chip = single("q3_chip_in", ["£5–10", "£10–20", "£20–50", "£50+"]);
  const chipMedian = (() => {
    let acc = 0; const half = chip.total / 2;
    for (const c of chip.counts) { acc += c.n; if (acc >= half && c.n > 0) return c.o; }
    return "—";
  })();

  const PAINS: [string, string, string[]][] = [
    ["q5_panic", "Gift panic", ["Often", "Every occasion"]],
    ["q6_overspend", "Overspend when unsure", ["Yes, often"]],
    ["q4_last_48", "Last-48-hours buying", ["Often", "Basically always"]],
    ["q7_landed", "Gifts miss the mark", ["Some", "Honestly, no idea"]],
  ];
  const painRank = PAINS.map(([id, label, high]) => ({
    label,
    pct: completed.length ? Math.round((completed.filter((r) => high.includes(r.answers[id] as string)).length / completed.length) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const texts = completed
    .map((r) => ({ t: (r.answers["q16_worst_moment"] as string) || "", at: r.createdAt }))
    .filter((x) => x.t && x.t.toLowerCase().includes(q.toLowerCase()));

  const exportSurvey = () => {
    const ids = [SCREENER.id, ...QUESTIONS.map((x) => x.id)];
    download("kindled-survey.csv", csvOf([
      ["sessionId", "segment", "completed", "createdAt", ...ids],
      ...responses.map((r) => [r.sessionId, r.segment ?? "", String(r.completed), r.createdAt,
        ...ids.map((id) => Array.isArray(r.answers[id]) ? r.answers[id].join("; ") : String(r.answers[id] ?? ""))]),
    ]));
  };

  return (
    <div className="min-h-screen bg-ground text-stone-900">
      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="flex items-center justify-between">
          <LogoMark variant="light" size={32} />
          <div className="flex gap-1 rounded-full border border-stone-200 bg-[var(--card)] p-1">
            {(["signups", "survey"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${tab === t ? "[background:var(--structure)] text-[var(--on-structure)]" : "text-stone-600"}`}>
                {t === "signups" ? `Sign-ups (${data.signups.length})` : `Survey (${responses.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === "signups" && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-bold">{data.signups.length} on the list</p>
              <button onClick={() => download("kindled-waitlist.csv", csvOf([["email", "source", "createdAt"], ...data.signups.map((s) => [s.email, s.source, s.createdAt])]))}
                className="btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold"><Download className="h-3.5 w-3.5" /> CSV</button>
            </div>
            <div className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-[var(--card)]">
              {data.signups.map((s) => (
                <div key={s.email} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                  <span className="font-semibold">{s.email}</span>
                  <span className="text-stone-600">{s.source} · {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
              {data.signups.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-stone-600">No sign-ups yet.</p>}
            </div>
          </section>
        )}

        {tab === "survey" && (
          <section className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 rounded-full border border-stone-200 bg-[var(--card)] p-1">
                {([["all", "All"], ["parents", "Parents"], ["nonparents", "Non-parents"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setSeg(v)}
                    className={`rounded-full px-3 py-1 text-[12px] font-bold ${seg === v ? "[background:var(--structure)] text-[var(--on-structure)]" : "text-stone-600"}`}>{l}</button>
                ))}
              </div>
              <button onClick={exportSurvey} className="btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold"><Download className="h-3.5 w-3.5" /> CSV</button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[["Responses", String(responses.length)], ["Completion", responses.length ? `${Math.round((completed.length / responses.length) * 100)}%` : "—"],
                ["Concept intent", `${intentPct}%`], ["Median chip-in", chipMedian]].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-stone-200 bg-[var(--card)] p-3 text-center">
                  <p className="text-[20px] font-bold">{v}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">{l}</p>
                </div>
              ))}
            </div>

            {spark.entries.length > 1 && (
              <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-600">Responses over time</p>
                <svg viewBox={`0 0 ${spark.entries.length * 10} 30`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
                  {spark.entries.map(([, n], i) => (
                    <rect key={i} x={i * 10 + 1} y={30 - (n / spark.max) * 28} width={8} height={(n / spark.max) * 28} rx={1.5} fill="var(--ember)" />
                  ))}
                </svg>
              </div>
            )}

            <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">Pain ranking (share reporting high pain)</p>
              {painRank.map((p) => <Bar key={p.label} label={p.label} count={p.pct} total={100} />)}
            </div>

            {QUESTIONS.filter((x) => x.kind === "wyr").map((w) => {
              if (w.kind !== "wyr") return null;
              const a = completed.filter((r) => r.answers[w.id] === w.a).length;
              const b = completed.filter((r) => r.answers[w.id] === w.b).length;
              const t = a + b;
              return (
                <div key={w.id} className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                  <p className="mb-2 text-[12px] font-bold text-stone-700">{w.a} <span className="text-stone-400">vs</span> {w.b}</p>
                  <Bar label={w.a} count={a} total={t} /><Bar label={w.b} count={b} total={t} />
                </div>
              );
            })}

            <div className="grid gap-4 sm:grid-cols-2">
              {([["q14_appeal", "Appeal"], ["q15_objection", "Objections"]] as const).map(([id, title]) => {
                const def = QUESTIONS.find((x) => x.id === id);
                if (!def || def.kind !== "multi") return null;
                const m = multi(id, def.options);
                return (
                  <div key={id} className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">{title}</p>
                    {m.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={m.total} />)}
                  </div>
                );
              })}
            </div>

            {/* v11.3 Patch 4: "Duplicate & panic pain" — pitch-ready, e.g.
                "X% of parents have had a child receive a duplicate gift".
                Parents-only base, independent of the segment toggle. */}
            {(() => {
              const dupDef = QUESTIONS.find((x) => x.id === "duplicate_pain_experienced");
              if (!dupDef || dupDef.kind !== "multi") return null;
              const m = multi(dupDef.id, dupDef.options, parentsCompleted);
              return (
                <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">Duplicate &amp; panic pain <span className="font-normal normal-case text-stone-400">(parents, n={m.total})</span></p>
                  {m.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={m.total} />)}
                </div>
              );
            })()}

            {/* v11.3 Patch 4: "Curated list appeal" — parents segment only. */}
            {(() => {
              const curDef = QUESTIONS.find((x) => x.id === "curated_list_appeal");
              if (!curDef || curDef.kind !== "single") return null;
              const r = single(curDef.id, curDef.options, parentsCompleted);
              return (
                <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">Curated list appeal <span className="font-normal normal-case text-stone-400">(parents, n={r.total})</span></p>
                  {r.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={r.total} />)}
                </div>
              );
            })()}

            {QUESTIONS.filter((x) => x.kind === "single" && x.id !== "curated_list_appeal").map((s) => {
              if (s.kind !== "single") return null;
              const r = single(s.id, s.options);
              return (
                <div key={s.id} className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                  <p className="mb-2 text-[12px] font-bold text-stone-700">{s.text} <span className="font-normal text-stone-400">(n={r.total})</span></p>
                  {r.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={r.total} />)}
                </div>
              );
            })}

            <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">Worst gift-buying moments ({texts.length})</p>
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-stone-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search responses" className="w-full text-[13px] outline-none" />
              </div>
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {texts.map((x, i) => <li key={i} className="rounded-lg bg-stone-50 px-3 py-2 text-[13px] text-stone-700">&ldquo;{x.t}&rdquo;</li>)}
              </ul>
            </div>

            <p className="text-center text-[11px] text-stone-600">
              Self-selected sample — treat as directional, not representative. n = {completed.length} completed of {responses.length} started ({seg}).
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
