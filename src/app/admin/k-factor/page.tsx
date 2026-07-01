import { computeKFactor, kFactorCards, type FunnelInputs } from "@/lib/k-factor";

export const metadata = { title: "Kindled · K-Factor", robots: { index: false } };

// Phase-1 funnel snapshot. In production these come from the analytics warehouse;
// here they're a representative sample so the dashboard renders standalone.
const FUNNEL: FunnelInputs = {
  visitors: 5000,
  signups: 1500,
  potsCreated: 400,
  shares: 1720,
  contributors: 900,
  contributorsWhoStarted: 198,
};

export default function KFactorDashboard() {
  const report = computeKFactor(FUNNEL);
  const cards = kFactorCards(report);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-5 py-10 text-[#f5f5f5]"
      style={{ backgroundImage: "radial-gradient(ellipse 90% 40% at 50% 0%, rgba(255,184,0,0.06) 0%, transparent 60%)" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffb800]/80">Growth · Internal</p>
          <h1 className="mt-1 text-[30px] font-bold tracking-tight">Viral K-Factor</h1>
          <p className="mt-2 text-[14px] text-slate-400">
            The loop compounds when a contributor to someone else&apos;s Fire starts their own. K &gt; 1 means each cohort more than replaces itself.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c, i) => {
            const headline = i === 3;
            return (
              <div key={c.label}
                className={`rounded-2xl border p-6 ${headline ? "border-[#ffb800]/40 bg-[#ffb800]/[0.06] sm:col-span-2" : "border-[#1c1c1c] bg-[#0f0f0f]"}`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.label}</p>
                <p className={`mt-2 font-bold leading-none tracking-tight ${headline ? "text-[52px] text-[#ffb800]" : "text-[38px] text-white"}`}>{c.value}</p>
                <p className="mt-2 text-[13px] text-slate-400">{c.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#1c1c1c] bg-[#0f0f0f] p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Sample window</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
            {([
              ["Visitors", FUNNEL.visitors], ["Signups", FUNNEL.signups], ["Fires created", FUNNEL.potsCreated],
              ["Shares", FUNNEL.shares], ["Contributors", FUNNEL.contributors], ["…who started a Fire", FUNNEL.contributorsWhoStarted],
            ] as const).map(([label, v]) => (
              <div key={label} className="flex items-baseline justify-between border-b border-[#1c1c1c]/70 py-1.5">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold tabular-nums text-slate-200">{v.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          Confidential · Kindled Growth · K = referral velocity × conversion rate = {report.referralVelocity.toFixed(2)} × {(report.conversionRate * 100).toFixed(0)}% = <span className="font-bold text-[#ffb800]">{report.kFactor.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
