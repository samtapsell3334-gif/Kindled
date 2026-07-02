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
import { Check, Copy, Share2, Plus, X, Star, Lock } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { DemoBanner } from "@/components/DemoBanner";
import { ExampleWishes } from "@/components/sandbox/ExampleWishes";

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

  const [title, setTitle] = useState(seededGoal ? `The ${seededGoal} wish` : "");
  const [titleTouched, setTitleTouched] = useState(!!seededGoal);
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("Birthday");
  const [eventDate, setEventDate] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10));
  const [isChildPot, setIsChildPot] = useState(false);
  const [starChart, setStarChart] = useState(false);
  const [isSurprise, setIsSurprise] = useState(true);
  const [organiserName, setOrganiserName] = useState("");
  const [organiserEmail, setOrganiserEmail] = useState("");
  const [items, setItems] = useState<DraftItem[]>(seededGoal ? [{ name: seededGoal, price: 100, category: "Goal", retailer: "TBC" }] : []);
  const [manual, setManual] = useState({ name: "", price: "", category: "Other", retailer: "" });
  const [pasteUrl, setPasteUrl] = useState("");
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteError, setPasteError] = useState("");
  const [suggestions, setSuggestions] = useState<{ alternatives: DraftItem[]; complement: DraftItem; line: string } | null>(null);

  async function pasteLink() {
    if (!pasteUrl || pasteBusy) return;
    setPasteBusy(true); setPasteError(""); setSuggestions(null);
    try {
      const r = await fetch("/api/sandbox/link-preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pasteUrl }),
      });
      const d = (await r.json()) as { preview?: { title: string; price?: number; category: string; retailer: string }; suggestions?: { alternatives: DraftItem[]; complement: DraftItem; line: string } | null; error?: string };
      if (!r.ok || !d.preview) throw new Error(d.error ?? "Couldn't read that link");
      const it: DraftItem = { name: d.preview.title, price: d.preview.price ?? 0, category: d.preview.category, retailer: d.preview.retailer };
      setItems((prev) => prev.some((x) => x.name === it.name) ? prev : [...prev, it]);
      setSuggestions(d.suggestions ?? null);
      setPasteUrl("");
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : "Couldn't read that link. Add it manually below.");
    } finally {
      setPasteBusy(false);
    }
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; managerKey: string } | null>(null);
  const [copied, setCopied] = useState<"share" | "manage" | null>(null);
  const [shareMsg, setShareMsg] = useState("");

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
          ...(organiserEmail ? { organiserEmail } : {}),
          items: items.map((i) => ({ ...i, priceBand: band(i.price), source: "catalogue" as const })),
          ...(ref ? { ref } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? "Failed");
      const made = await res.json() as { slug: string; managerKey: string };
      try {
        const mine = JSON.parse(localStorage.getItem("kindled-my-pots") ?? "[]") as unknown[];
        mine.unshift({ slug: made.slug, managerKey: made.managerKey, title, recipientName, createdAt: Date.now() });
        localStorage.setItem("kindled-my-pots", JSON.stringify(mine.slice(0, 20)));
      } catch { /* private mode etc. */ }
      setCreated(made);
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
    const msg = shareMsg || `We're all chipping in for ${title} — tap to join in 🎉 ${shareUrl}`;
    const manageUrl = `${shareUrl}?key=${created.managerKey}`;
    return (
      <main className="mx-auto max-w-md px-5 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500"><Check className="h-7 w-7 text-white" strokeWidth={3} /></div>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-4 text-[28px] font-bold text-stone-900">Your wish is live</h1>
        <p className="mt-2 text-[14px] text-stone-500">Share the first link with the people who&apos;ll chip in. Keep the second link private; it&apos;s how you manage the wish and run the reveal.</p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Your invite message (edit it, then send)</p>
          <textarea value={msg} onChange={(e) => setShareMsg(e.target.value)} rows={3} aria-label="Invite message"
            className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-[13px] text-stone-700" />
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-[12px] font-bold text-white">
              <Share2 className="h-3.5 w-3.5" /> WhatsApp
            </a>
            {typeof navigator !== "undefined" && !!navigator.share && (
              <button onClick={() => { void navigator.share({ text: msg }).catch(() => {}); }}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-[12px] font-bold text-stone-700">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            )}
            <button onClick={() => copy(msg, "share")} className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-bold text-white">
              {copied === "share" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "share" ? "Copied" : "Copy message"}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-left">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500"><Lock className="h-3 w-3" /> Private manager link</p>
          <p className="mt-1 break-all text-[13px] text-stone-600">{manageUrl}</p>
          <button onClick={() => copy(manageUrl, "manage")} className="mt-2 flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-[12px] font-bold text-stone-700">
            {copied === "manage" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "manage" ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/sandbox/wishes" className="rounded-2xl cta-primary px-6 py-3.5 text-[14px] font-bold">Go to My wishes</Link>
          <Link href={manageUrl} className="rounded-2xl border border-stone-300 px-6 py-3.5 text-[14px] font-semibold text-stone-700">Open this wish</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <LogoMark variant="light" size={38} />
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[26px] font-bold text-stone-900">Start a wish</h1>
      </div>

      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">1 · The occasion</p>
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

        <p className="pt-2 text-[11px] font-bold uppercase tracking-widest text-amber-700">2 · Who it&apos;s for</p>
        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Who&apos;s it for? {isChildPot && <span className="text-stone-500">(first name only)</span>}</span>
          <input value={recipientName} onChange={(e) => {
              setRecipientName(e.target.value);
              if (!titleTouched) setTitle(e.target.value ? `${e.target.value}'s ${occasion}` : "");
            }} placeholder={isChildPot ? "e.g. Ava" : "e.g. Priya"}
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-stone-700">I&apos;m a parent or guardian and this wish is for my child</span>
            <input type="checkbox" checked={isChildPot} onChange={(e) => { setIsChildPot(e.target.checked); if (!e.target.checked) setStarChart(false); }} className="h-5 w-5 accent-amber-500" />
          </label>
          {isChildPot && (
            <label className="mt-3 flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
              <span className="flex items-center gap-1.5 text-[13px] text-stone-600"><Star className="h-4 w-4 text-amber-500" /> Star chart: good behaviour earns towards the goal</span>
              <input type="checkbox" checked={starChart} onChange={(e) => setStarChart(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
          )}
        </div>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Wish name <span className="font-normal text-stone-500">(auto-filled, edit if you like)</span></span>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} placeholder="e.g. Ava's 8th Birthday"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
        </label>

        <p className="pt-2 text-[11px] font-bold uppercase tracking-widest text-amber-700">3 · Build the list</p>
        {!isChildPot && (
          <div>
            <span className="text-[12px] font-semibold text-stone-600">Paste a product link from any website</span>
            <span className="mt-0.5 block text-[11px] text-stone-500">Title, photo and price fill in automatically.</span>
            <div className="mt-1.5 flex gap-2">
              <input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void pasteLink()}
                placeholder="https://…" inputMode="url" aria-label="Product link"
                className="flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
              <button onClick={() => void pasteLink()} disabled={pasteBusy}
                className="cta-primary rounded-xl px-4 text-[13px] font-bold disabled:opacity-60">{pasteBusy ? "Reading…" : "Add"}</button>
            </div>
            {pasteError && <p role="alert" className="mt-1 text-[12px] font-medium text-rose-600">{pasteError} You can add it manually below.</p>}
            {suggestions && (
              <div className="mt-2 rounded-2xl border border-stone-200 bg-[var(--card)] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Other price points</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {suggestions.alternatives.map((a) => (
                    <button key={a.name} onClick={() => setItems((prev) => prev.some((x) => x.name === a.name) ? prev : [...prev, a])}
                      className="rounded-xl border border-stone-200 p-2.5 text-left text-[12px]">
                      <span className="font-semibold text-stone-800">{a.name}</span>
                      <span className="block text-stone-500">£{a.price} · {a.retailer}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-[12px] font-semibold text-amber-800">{suggestions.line}</p>
                <button onClick={() => setItems((prev) => prev.some((x) => x.name === suggestions.complement.name) ? prev : [...prev, suggestions.complement])}
                  className="btn-secondary mt-1.5 rounded-xl px-3 py-2 text-[12px] font-bold">
                  Add {suggestions.complement.name} · £{suggestions.complement.price}
                </button>
              </div>
            )}
          </div>
        )}
        <div>
          <span className="text-[12px] font-semibold text-stone-600">{isChildPot ? "Tap to add, and prices and shops fill in automatically" : "Or pick from the catalogue"}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {catalogue.map((c) => {
              const on = items.some((i) => i.name === c.name);
              return (
                <button key={c.name} onClick={() => setItems((prev) => on ? prev.filter((i) => i.name !== c.name) : [...prev, c])}
                  className={`rounded-xl border p-2.5 text-left text-[12px] ${on ? "border-amber-400 bg-amber-50" : "border-stone-200"}`}>
                  <span className="font-semibold text-stone-800">{c.name}</span>
                  <span className="block text-stone-500">£{c.price} · {c.retailer}</span>
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
              {items.map((i, idx) => (
                <li key={i.name} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-1.5 text-[12px] text-stone-600">
                  <span className="min-w-0 flex-1 truncate">{i.name} · £{i.price}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button aria-label={`Move ${i.name} up`} disabled={idx === 0}
                      onClick={() => setItems((prev) => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx]!, n[idx - 1]!]; return n; })}
                      className="rounded px-1 text-stone-500 disabled:opacity-30">↑</button>
                    <button aria-label={`Move ${i.name} down`} disabled={idx === items.length - 1}
                      onClick={() => setItems((prev) => { const n = [...prev]; [n[idx + 1], n[idx]] = [n[idx]!, n[idx + 1]!]; return n; })}
                      className="rounded px-1 text-stone-500 disabled:opacity-30">↓</button>
                    <button aria-label={`Remove ${i.name}`}
                      onClick={() => { if (window.confirm(`Remove "${i.name}" from the list?`)) setItems((prev) => prev.filter((x) => x.name !== i.name)); }}>
                      <X className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {/* v11 WS-1: the one warm, skippable nudge — appears after the first wish, once per session */}
          {items.length === 1 && !nudgeDismissed && !isChildPot && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-[var(--ember-soft)]/40 p-3.5">
              <p className="text-[13px] font-semibold text-stone-800">Add another wish? Two or three get funded faster — it gives everyone a way in.</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[{ label: "Small", it: { name: "Art supplies set", price: 22, category: "Craft", retailer: "Hobbycraft" } },
                  { label: "Medium", it: { name: "Weekend spa voucher", price: 150, category: "Experiences", retailer: "Virgin Experience Days" } },
                  { label: "Dream", it: { name: "Espresso machine", price: 220, category: "Kitchen", retailer: "John Lewis" } }].map(({ label, it }) => (
                  <button key={label} onClick={() => { setItems((prev) => prev.some((x) => x.name === it.name) ? prev : [...prev, it]); setNudgeDismissed(true); }}
                    className="rounded-xl border border-amber-300 bg-white p-2 text-left text-[11px]">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-700">{label}</span>
                    <span className="font-semibold text-stone-800">{it.name}</span>
                    <span className="block text-stone-500">£{it.price}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setNudgeDismissed(true)} className="mt-2 text-[12px] font-semibold text-stone-500 underline">One wish is plenty</button>
            </div>
          )}
        </div>

        <p className="pt-2 text-[11px] font-bold uppercase tracking-widest text-amber-700">4 · Final details</p>
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 p-4">
          <span className="text-[13px] font-semibold text-stone-700">Keep it a surprise until the reveal</span>
          <input type="checkbox" checked={isSurprise} onChange={(e) => setIsSurprise(e.target.checked)} className="h-5 w-5 accent-amber-500" />
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Your name</span>
          <input value={organiserName} onChange={(e) => setOrganiserName(e.target.value)} placeholder="e.g. Sarah"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
          <span className="mt-1 block text-[11px] text-stone-500">Shown on the wish page, so contributors know who&apos;s organising.</span>
        </label>

        <label className="block">
          <span className="text-[12px] font-semibold text-stone-600">Register for launch <span className="font-normal text-stone-500">(optional)</span></span>
          <input type="email" inputMode="email" autoComplete="email" value={organiserEmail} onChange={(e) => setOrganiserEmail(e.target.value)} placeholder="you@email.com"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-[14px]" />
          <span className="mt-1 block text-[11px] leading-snug text-stone-500">
            We&apos;ll only use this to tell you when the real Kindled launches. Nothing is sent in the sandbox. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </span>
        </label>

        {items.length === 0 && (
          <p className="rounded-xl bg-stone-100 px-3.5 py-2.5 text-[12px] text-stone-600">
            No items yet. Add at least one so contributors can see what they&apos;re funding — or carry on for a simple cash goal.
          </p>
        )}
        {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}

        <button onClick={() => { void submit(); }} disabled={busy}
          className="w-full rounded-2xl cta-primary py-4 text-[15px] font-bold disabled:opacity-60">
          {busy ? "Creating…" : "Create wish & get the link"}
        </button>
        <p className="text-center text-[11px] text-stone-500">Sandbox: simulated money only. No payments are processed.</p>

        <ExampleWishes heading="Where your wish ends up" />
      </div>
    </main>
  );
}

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-ground text-stone-900">
      <DemoBanner />
      <Suspense fallback={null}>
        <CreatePot />
      </Suspense>
    </div>
  );
}
