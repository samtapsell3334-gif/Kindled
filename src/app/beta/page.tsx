"use client";

/**
 * /beta — the founder's early-access ledger + research dashboard (v13).
 * Server-side gated: this page holds NO pin constant; it posts the entered PIN
 * to /api/beta (BETA_PIN env var, rate-limited) and renders whatever the server
 * returns. Excluded from sitemap; robots noindex via layout metadata.
 */

import { useMemo, useState } from "react";
import { Download, Lock, Search } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { QUESTIONS, SCREENER } from "@/content/survey";

interface Signup { email: string; source: string; createdAt: string }
interface Response { sessionId: string; segment: string | null; answers: Record<string, string | string[] | number | boolean>; completed: boolean; createdAt: string }
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

function meanOf(nums: number[]): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
}
function medianOf(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

const HISTOGRAM_BUCKETS: [string, (n: number) => boolean][] = [
  ["0–5", (n) => n <= 5], ["6–10", (n) => n >= 6 && n <= 10], ["11–15", (n) => n >= 11 && n <= 15],
  ["16–20", (n) => n >= 16 && n <= 20], ["21–25", (n) => n >= 21 && n <= 25], ["26+", (n) => n >= 26],
];
function histogram(nums: number[]) {
  const counts = HISTOGRAM_BUCKETS.map(([label, test]) => ({ o: label, n: nums.filter(test).length }));
  return { counts, total: nums.length };
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

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-stone-600">
        {title} {sub && <span className="font-normal normal-case text-stone-400">({sub})</span>}
      </p>
      {children}
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
  // These panels are ALWAYS parents-only (the underlying questions only ever
  // reach parent/both respondents), independent of the page's global segment
  // toggle — otherwise buyer-segment rows (who never saw these questions)
  // would dilute the denominator and understate %s.
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
  const numbersOf = (id: string, base: Response[] = completed) =>
    base.map((r) => r.answers[id]).filter((v): v is number => typeof v === "number");

  const concept = single("concept_intent", ["Definitely", "Probably", "Not sure", "Probably not"]);
  const intentPct = concept.total ? Math.round(((concept.counts[0]?.n ?? 0) + (concept.counts[1]?.n ?? 0)) / concept.total * 100) : 0;

  // Spend estimate (dashboard item 2): stored per-response at Q6-answer time.
  const twoYearValues = numbersOf("two_year_value");
  const avgTwoYearValue = meanOf(twoYearValues);
  const medianTwoYearValue = medianOf(twoYearValues);

  // Gifting scale (dashboard item 1): Q2/Q3 numeric steppers.
  const outgoing = numbersOf("people_bought_for");
  const incoming = numbersOf("people_buying_for_you");

  // Pooled-goal test (dashboard item 3): Q6 A/B choice.
  const wyr2yr = { a: completed.filter((r) => r.answers["wyr_2yr_choice"] === "A").length, b: completed.filter((r) => r.answers["wyr_2yr_choice"] === "B").length };
  // Kids version (dashboard item 4): Q7 A/B choice, parents-only base.
  const wyrKids = { a: parentsCompleted.filter((r) => r.answers["wyr_kids_choice"] === "A").length, b: parentsCompleted.filter((r) => r.answers["wyr_kids_choice"] === "B").length };

  // Pain ranking — share reporting high pain per dimension (v13 fields).
  const PAINS: [string, string, string[]][] = [
    ["returns_frequency", "Returns / re-gifting", ["Most occasions", "Almost every time"]],
    ["overcompensation", "Overspend when unsure", ["Yes, often"]],
    ["anxiety_level", "Christmas/event anxiety", ["Quite a bit", "It stresses me out every year"]],
    ["asked_frequency", "Never asked what they want", ["Rarely"]],
  ];
  const painRank = PAINS.map(([id, label, high]) => ({
    label,
    pct: completed.length ? Math.round((completed.filter((r) => high.includes(r.answers[id] as string)).length / completed.length) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const texts = completed
    .map((r) => ({ t: (r.answers["open_text"] as string) || "", at: r.createdAt }))
    .filter((x) => x.t && x.t.toLowerCase().includes(q.toLowerCase()));

  // Behaviour cluster (dashboard item 7): Q8, Q10–Q13.
  const BEHAVIOUR: [string, string, string[]][] = [
    ["returns_frequency", "Returns / re-gifting frequency", ["Never", "Occasionally", "Most occasions", "Almost every time"]],
    ["buy_behaviour", "Buying behaviour", ["Ask them directly", "Ask someone close to them", "Guess based on what I know", "A bit of all three"]],
    ["overcompensation", "Overcompensation", ["Yes, often", "Sometimes", "Rarely", "No, never"]],
    ["anxiety_level", "Event anxiety", ["None at all", "A little", "Quite a bit", "It stresses me out every year"]],
    ["video_appeal", "Video-message appeal", ["Love that", "A nice touch", "Not fussed either way", "Not really for me"]],
  ];

  // Dedicated panels excluded from the generic single-question auto-loop below.
  const DEDICATED_SINGLE_IDS = new Set(["curated_list_appeal", ...BEHAVIOUR.map(([id]) => id)]);

  const exportSurvey = () => {
    const ids = [SCREENER.id, "is_parent", ...QUESTIONS.map((x) => x.id), "two_year_gifts", "two_year_value", "tier"];
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
                ["Concept intent", `${intentPct}%`], ["Avg 2yr value", twoYearValues.length ? `£${avgTwoYearValue}` : "—"]].map(([l, v]) => (
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

            {/* Dashboard item 1 — gifting scale */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Panel title="Gifts given (per year)" sub={`mean ${meanOf(outgoing)}, median ${medianOf(outgoing)}, n=${outgoing.length}`}>
                {histogram(outgoing).counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={outgoing.length} />)}
              </Panel>
              <Panel title="Gifts received (per year)" sub={`mean ${meanOf(incoming)}, median ${medianOf(incoming)}, n=${incoming.length}`}>
                {histogram(incoming).counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={incoming.length} />)}
              </Panel>
            </div>

            {/* Dashboard item 2 — spend estimate */}
            <Panel title="Average estimated 2-year gifting value" sub={`median £${medianTwoYearValue}, n=${twoYearValues.length}`}>
              <p className="mb-3 text-[22px] font-bold">£{avgTwoYearValue}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-stone-500">Birthday value received</p>
                  {single("bday_value_band", ["Under £50", "£50–£100", "£100–£200", "£200–£400", "£400+"]).counts.map((c) => (
                    <Bar key={c.o} label={c.o} count={c.n} total={single("bday_value_band", ["Under £50", "£50–£100", "£100–£200", "£200–£400", "£400+"]).total} />
                  ))}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-stone-500">Christmas value received</p>
                  {single("xmas_value_band", ["Under £50", "£50–£100", "£100–£200", "£200–£400", "£400+"]).counts.map((c) => (
                    <Bar key={c.o} label={c.o} count={c.n} total={single("xmas_value_band", ["Under £50", "£50–£100", "£100–£200", "£200–£400", "£400+"]).total} />
                  ))}
                </div>
              </div>
            </Panel>

            {/* Dashboard item 3 — the pooled-goal test (Q6) */}
            <Panel title="The pooled-goal test" sub={`n=${wyr2yr.a + wyr2yr.b}`}>
              <Bar label="I'll take the mix" count={wyr2yr.a} total={wyr2yr.a + wyr2yr.b} />
              <Bar label="Pool it together" count={wyr2yr.b} total={wyr2yr.a + wyr2yr.b} />
            </Panel>

            {/* Dashboard item 4 — kids version (Q7), parents only */}
            <Panel title="Kids version" sub={`parents, n=${wyrKids.a + wyrKids.b}`}>
              <Bar label="Ten small toys, unwrapped one by one" count={wyrKids.a} total={wyrKids.a + wyrKids.b} />
              <Bar label="Everyone chipping in for the one big thing they'll actually remember" count={wyrKids.b} total={wyrKids.a + wyrKids.b} />
            </Panel>

            <Panel title="Pain ranking" sub="share reporting high pain">
              {painRank.map((p) => <Bar key={p.label} label={p.label} count={p.pct} total={100} />)}
            </Panel>

            {/* Dashboard item 5 — duplicate & panic pain (Q9a), parents only */}
            {(() => {
              const dupDef = QUESTIONS.find((x) => x.id === "duplicate_pain_experienced");
              if (!dupDef || dupDef.kind !== "multi") return null;
              const m = multi(dupDef.id, dupDef.options, parentsCompleted);
              return (
                <Panel title="Duplicate & panic pain" sub={`parents, n=${m.total}`}>
                  {m.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={m.total} />)}
                </Panel>
              );
            })()}

            {/* Dashboard item 6 — curated-list appeal (Q9b), parents only */}
            {(() => {
              const curDef = QUESTIONS.find((x) => x.id === "curated_list_appeal");
              if (!curDef || curDef.kind !== "single") return null;
              const r = single(curDef.id, curDef.options, parentsCompleted);
              return (
                <Panel title="Curated list appeal" sub={`parents, n=${r.total}`}>
                  {r.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={r.total} />)}
                </Panel>
              );
            })()}

            {/* Dashboard item 7 — behaviour cluster (Q8, Q10–Q13) */}
            <div className="grid gap-4 sm:grid-cols-2">
              {BEHAVIOUR.map(([id, title, opts]) => {
                const r = single(id, opts);
                return (
                  <Panel key={id} title={title} sub={`n=${r.total}`}>
                    {r.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={r.total} />)}
                  </Panel>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {([["appeal", "Appeal"], ["objection", "Objections"]] as const).map(([id, title]) => {
                const def = QUESTIONS.find((x) => x.id === id);
                if (!def || def.kind !== "multi") return null;
                const m = multi(id, def.options);
                return (
                  <Panel key={id} title={title}>
                    {m.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={m.total} />)}
                  </Panel>
                );
              })}
            </div>

            {QUESTIONS.filter((x) => x.kind === "single" && !DEDICATED_SINGLE_IDS.has(x.id)).map((s) => {
              if (s.kind !== "single") return null;
              const r = single(s.id, s.options);
              return (
                <div key={s.id} className="rounded-2xl border border-stone-200 bg-[var(--card)] p-4">
                  <p className="mb-2 text-[12px] font-bold text-stone-700">{s.text} <span className="font-normal text-stone-400">(n={r.total})</span></p>
                  {r.counts.map((c) => <Bar key={c.o} label={c.o} count={c.n} total={r.total} />)}
                </div>
              );
            })}

            <Panel title={`Worst gift-buying moments (${texts.length})`}>
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-stone-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search responses" className="w-full text-[13px] outline-none" />
              </div>
              <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                {texts.map((x, i) => <li key={i} className="rounded-lg bg-stone-50 px-3 py-2 text-[13px] text-stone-700">&ldquo;{x.t}&rdquo;</li>)}
              </ul>
            </Panel>

            <p className="text-center text-[11px] text-stone-600">
              Self-selected sample — treat as directional, not representative. n = {completed.length} completed of {responses.length} started ({seg}).
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
