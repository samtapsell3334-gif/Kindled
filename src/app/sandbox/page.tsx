"use client";

/**
 * Sandbox — create a pot (v4.1 WS-B). The organiser flow: occasion + date →
 * who it's for → parent/guardian toggle (child pots per guardrail 5: first
 * name only, no data collected FROM children) → build the list (catalogue
 * quick-picks + manual add, every add captures category/retailer/price band)
 * → surprise toggle → share link + private manager link.
 */

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Flame, Check, Copy, Share2, Plus, X, Star, Lock } from "lucide-react";
import { DemoBanner } from "@/components/DemoBanner";

interface DraftItem { name: string; price: number; category: string; retailer: string }

const CATALOGUE: DraftItem[] = [
  { name: "LEGO Friends Treehouse", price: 65, category: "Toys", retailer: "Smyths" },
  { name: "Nintendo Switch game", price: 45, category: "Games", retailer: "Argos" },
  { name: "Roller skates", price: 45, category: "Sports", retailer: "Decathlon" },
  { name: "Art supplies set", price: 22, category: "Craft", retailer: "Hobbycraft" },
  { name: "Log burner", price: 799, category: "Home", retailer: "Charnwood" },
  { name: "Weekend spa voucher", price: 150, category: "Experiences", retailer: "Virgin Experience Days" },
  { name: "Espresso machine", price: 220, category: "Kitchen", retailer: "John Lewis" },
  { name: "Fountain pen", price: 40, category: "Stationery", retailer: "John Lewis" },
];

const band = (p: number) => (p < 25 ? "under25" : p <= 100 ? "25to100" : p <= 500 ? "100to500" : "over500");

function CreatePot() {
  const params = useSearchParams();
  const seededGoal = params.get("goal") ?? "";
  const ref = params.get("ref") ?? "";

  const [title, setTitle] = useState(seededGoal ? `The ${seededGoal} pot` : "");
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("Birthday");
  const [eventDate, setEventDate] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [isChildPot, setIsChildPot] = useState(false);
  const [starChart, setStarChart] = useState(false);
  const [isSurprise, setIsSurprise] = useState(true);
  const [organiserName, setOrganiserName] = useState("");
  const [items, setItems] = useState<DraftItem[]>(seededGoal ? [{ name: seededGoal, price: 100, category: "Goal", retailer: "TBC" }] : []);
  const [manual, setManual] = useState({ name: "", price: "", category: "Other", retailer: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; managerKey: string } | null>(null);
  const [copied, setCopied] = useState<"share" | "manage" | null>(null);

  const catalogue = useMemo(
    () => (isChildPot ? CATALOGUE.filter((c) => ["Toys", "Games", "Sports", "Craft"].includes(c.category)) : CATALOGUE),
    [isChildPot],
  );

  async function submit() {
    setError("");
    if (!title || !recipientName || !organiserName) { setError("Please fill in the name fields."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/sandbox/pots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, recipientName, occasion, eventDate, isSurprise, isChildPot,
          starChartEnabled: starChart, organiserName,
          items: items.map((i) => ({ ...i, priceBand: band(i.price), source: "catalogue" as const })),
          ...(ref ? { ref } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? "Failed");
      setCreated(await res.json() as { slug: string; managerKey: string });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const copy = (text: string, which: "share" | "manage") => {
    void navigator.clipboard?.writeText(text).then(() => { setCopied(which); setTimeout(() => setCopied(null), 1500); });
  };

  if (created) {
    const shareUrl = `${window.location.origin}/p/${created.slug}`;
    const manageUrl = `${shareUrl}?key=${created.managerKey}`;
    return (
      <main className="mx-auto max-w-md px-5 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500"><Check className="h-7 w-7 text-white" strokeWidth={3} /></div>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-4 text-[28px] font-bold text-stone-900">Your pot is live</h1>
        <p className="mt-2 text-[14px] text-stone-500">Share the first link with the people who&apos;ll chip in. Keep the second link private — it&apos;s how you manage the pot and run the reveal.</p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Share link</p>
          <p className="mt-1 break-all text-[13px] text-stone-700">{shareUrl}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => copy(shareUrl, "share")} className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-bold text-white">
              {copied === "share" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "share" ? "Copied" : "Copy"}
            </button>
            {typeof navigator !== "undefined" && !!navigator.share && (
              <button onClick={() => { void navigator.share({ title: "Chip into our pot", url: shareUrl }).catch(() => {}); }}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-[12px] font-bold text-stone-700">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500"><Lock className="h-3 w-3" /> Private manager link</p>
          <p className="mt-1 break-all text-[13px] text-stone-600">{manageUrl}</p>
          <button onClick={() => copy(manageUrl, "manage")} className="mt-2 flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-[12px] font-bold text-stone-700">
            {copied === "manage" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "manage" ? "Copied" : "Copy"}
          </button>
        </div>

        <Link href={manageUrl} className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-[14px] font-bold text-stone-900">Open my pot</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500"><Flame className="h-4.5 w-4.5 text-stone-900" /></span>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-bold text-stone-900">Start a pot</h1>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">What&apos;s the occasion?</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {["Birthday", "Christmas", "Leaving do", "Wedding", "Joint goal"].map((o) => (
              <button key={o} onClick={() => setOccasion(o)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${occasion === o ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600"}`}>
                {o}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">The big day</span>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Who&apos;s it for? {isChildPot && <span className="text-stone-400">(first name only)</span>}</span>
          <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={isChildPot ? "e.g. Ava" : "e.g. Priya"}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-stone-700">I&apos;m a parent or guardian — this pot is for my child</span>
            <input type="checkbox" checked={isChildPot} onChange={(e) => { setIsChildPot(e.target.checked); if (!e.target.checked) setStarChart(false); }} className="h-5 w-5 accent-amber-500" />
          </label>
          {isChildPot && (
            <label className="mt-3 flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
              <span className="flex items-center gap-1.5 text-[13px] text-stone-600"><Star className="h-4 w-4 text-amber-500" /> Star chart — good behaviour earns towards the goal</span>
              <input type="checkbox" checked={starChart} onChange={(e) => setStarChart(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
          )}
        </div>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Pot name</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ava's 8th Birthday"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        <div>
          <span className="text-[12px] font-semibold text-stone-600">Build the list</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {catalogue.map((c) => {
              const on = items.some((i) => i.name === c.name);
              return (
                <button key={c.name} onClick={() => setItems((prev) => on ? prev.filter((i) => i.name !== c.name) : [...prev, c])}
                  className={`rounded-xl border p-2.5 text-left text-[12px] ${on ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>
                  <span className="font-semibold text-stone-800">{c.name}</span>
                  <span className="block text-stone-400">£{c.price} · {c.retailer}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="Add your own…"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-[13px]" />
            <input value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} placeholder="£" inputMode="numeric"
              className="w-16 rounded-xl border border-stone-200 px-3 py-2 text-[13px]" />
            <button aria-label="Add item" onClick={() => {
              const p = Number(manual.price);
              if (manual.name && Number.isFinite(p) && p > 0) {
                setItems((prev) => [...prev, { name: manual.name, price: Math.round(p), category: manual.category, retailer: manual.retailer || "Other" }]);
                setManual({ name: "", price: "", category: "Other", retailer: "" });
              }
            }} className="rounded-xl bg-stone-900 px-3 text-white"><Plus className="h-4 w-4" /></button>
          </div>
          {items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {items.map((i) => (
                <li key={i.name} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-1.5 text-[12px] text-stone-600">
                  {i.name} · £{i.price}
                  <button aria-label={`Remove ${i.name}`} onClick={() => setItems((prev) => prev.filter((x) => x.name !== i.name))}><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 p-4">
          <span className="text-[13px] font-semibold text-stone-700">Keep it a surprise until the reveal</span>
          <input type="checkbox" checked={isSurprise} onChange={(e) => setIsSurprise(e.target.checked)} className="h-5 w-5 accent-amber-500" />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Your name</span>
          <input value={organiserName} onChange={(e) => setOrganiserName(e.target.value)} placeholder="So contributors know who's organising"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}

        <button onClick={() => { void submit(); }} disabled={busy}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-[15px] font-bold text-stone-900 disabled:opacity-60">
          {busy ? "Creating…" : "Create pot & get the link"}
        </button>
        <p className="text-center text-[11px] text-stone-400">Sandbox: simulated money only. No payments are processed.</p>
      </div>
    </main>
  );
}

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      <DemoBanner />
      <Suspense fallback={null}>
        <CreatePot />
      </Suspense>
    </div>
  );
}
