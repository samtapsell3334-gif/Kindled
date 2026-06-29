"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Check, Clock, Undo2, Gift, X, Sparkles } from "lucide-react";
import {
  claim, release, confirmPurchase, effectiveStatus, guardMessage, canClaim,
  type ClaimableItem,
} from "@/lib/claim-engine";
import { BrandedImage } from "@/components/lux/BrandedImage";
import { VH_BOUNCE } from "@/lib/motion";
import { AFFILIATE_DISCLOSURE } from "@/lib/catalog-service";

export interface VHCatalogItem {
  id: string; name: string; image: string; price: number;
  tag: string; category: string; hearts: number; brand?: string;
}

const ME = { id: "me", name: "You" };

/** Seed two items so the Reserved + Gifted states are visible from the off. */
function seedClaims(items: VHCatalogItem[]): Record<string, ClaimableItem> {
  const now = Date.now();
  const out: Record<string, ClaimableItem> = {};
  if (items[1]) out[items[1].id] = { id: items[1].id, claimStatus: "PENDING", claimedByUserId: "u_jordan", claimedByName: "Jordan", reservedUntil: now + 18 * 60 * 1000 };
  if (items[3]) out[items[3].id] = { id: items[3].id, claimStatus: "CLAIMED", claimedByUserId: "u_priya", claimedByName: "Aunt Priya", claimedAt: now - 3_600_000 };
  return out;
}

function Countdown({ until }: { until: number }) {
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, until - Date.now());
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return <span className="tabular-nums">{m}:{String(s).padStart(2, "0")}</span>;
}

export function VibrantCatalogue({ items }: { items: VHCatalogItem[] }) {
  const [claims, setClaims] = useState<Record<string, ClaimableItem>>(() => seedClaims(items));
  const [cat, setCat] = useState("All");
  const [modalItem, setModalItem] = useState<VHCatalogItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const getClaim = useCallback((id: string): ClaimableItem => claims[id] ?? { id, claimStatus: "AVAILABLE" }, [claims]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const shown = useMemo(() => (cat === "All" ? items : items.filter((i) => i.category === cat)), [items, cat]);

  const tryOpen = (item: VHCatalogItem) => {
    if (canClaim(getClaim(item.id))) setModalItem(item);
    else setToast(guardMessage(getClaim(item.id)));
  };
  const doClaim = (item: VHCatalogItem) => {
    const r = claim(getClaim(item.id), ME.id, ME.name);
    if (r.ok) { setClaims((c) => ({ ...c, [item.id]: r.item })); setModalItem(null); }
    else setToast(r.reason ?? null);
  };
  const doRelease = (id: string) => { const r = release(getClaim(id), ME.id); if (r.ok) setClaims((c) => ({ ...c, [id]: r.item })); };
  const doConfirm = (id: string) => { const r = confirmPurchase(getClaim(id), ME.id); if (r.ok) { setClaims((c) => ({ ...c, [id]: r.item })); setToast("Gifted — it's off the list. The pot updates without spoiling the surprise."); } };

  return (
    <div className="vh vh-paper min-h-screen pb-32">
      {/* Header */}
      <div className="relative z-[1] px-6 pb-3 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff6b6b]">The Kindled Edit</p>
        <h2 className="font-editorial mt-1 text-[40px] font-semibold leading-[0.95] text-[#0f172a]">Find the one.</h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#0f172a]/55">Swipe through. Claim what you&apos;re gifting so nobody doubles up.</p>
      </div>

      {/* Category chips */}
      <div className="relative z-[1] flex gap-2 overflow-x-auto px-6 py-3 scrollbar-none">
        {categories.map((c) => (
          <motion.button key={c} whileTap={{ scale: 0.92 }} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${cat === c ? "bg-[#0f172a] text-[#fdf6e3]" : "bg-[#fffdf7] text-[#0f172a]/60 vh-lift"}`}>
            {c}
          </motion.button>
        ))}
      </div>

      {/* Carousel */}
      <div className="relative z-[1] flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-5 pt-3 scrollbar-none">
        {shown.map((item, i) => {
          const cl = getClaim(item.id);
          const status = effectiveStatus(cl);
          const mine = cl.claimedByUserId === ME.id;
          return (
            <motion.article key={item.id}
              initial={{ opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...VH_BOUNCE, delay: Math.min(i * 0.04, 0.3) }}
              className="relative w-[78vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[28px] bg-[#fffdf7] vh-lift-lg">
              {/* Image */}
              <div className="relative">
                <div className={`overflow-hidden ${status === "CLAIMED" ? "opacity-40 grayscale" : ""}`} style={{ height: 280 }}>
                  <BrandedImage src={item.image} alt={item.name} name={item.name} variant="sand" className="h-full w-full object-cover" />
                </div>
                {/* Hearts */}
                <div className="absolute left-3.5 top-3.5 flex items-center gap-1 rounded-full bg-[#fffdf7]/90 px-2.5 py-1 backdrop-blur-sm vh-lift">
                  <Heart className="h-3 w-3 fill-[#ff6b6b] text-[#ff6b6b]" />
                  <span className="text-[11px] font-bold tabular-nums text-[#0f172a]">{item.hearts.toLocaleString()}</span>
                </div>
                {/* Tag */}
                <span className="absolute right-3.5 top-3.5 rounded-full bg-[#f59e0b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white vh-lift">{item.tag}</span>

                {/* Reserved ribbon + countdown */}
                {status === "PENDING" && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#0f172a]/85 to-transparent px-4 pb-3 pt-8">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#ff6b6b] px-2.5 py-1 text-[11px] font-bold text-white">
                      <Clock className="h-3 w-3" /> Reserved {mine ? "by you" : `· ${cl.claimedByName}`}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-[#fffdf7]/95 px-2.5 py-1 text-[12px] font-bold text-[#0f172a]">
                      <Clock className="h-3 w-3 text-[#ff6b6b]" /><Countdown until={cl.reservedUntil ?? 0} />
                    </span>
                  </div>
                )}
                {/* Gifted overlay */}
                {status === "CLAIMED" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0f172a]/55 backdrop-blur-[1px]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f59e0b]"><Gift className="h-6 w-6 text-white" /></div>
                    <p className="font-editorial text-[20px] font-semibold text-white">Gifted</p>
                    <p className="text-[12px] font-medium text-white/85">by {cl.claimedByName}</p>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                {item.brand && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f172a]/40">{item.brand}</p>}
                <p className="font-editorial text-[19px] font-semibold leading-tight text-[#0f172a]">{item.name}</p>
                <p className="mt-1.5 text-[22px] font-bold tabular-nums text-[#0f172a]">£{item.price.toLocaleString()}</p>

                {/* Claim actions */}
                <div className="mt-4">
                  {status === "AVAILABLE" && (
                    <motion.button whileTap={{ scale: 0.94 }} transition={VH_BOUNCE} onClick={() => tryOpen(item)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b6b] py-3.5 text-[14px] font-bold text-white vh-lift">
                      <Gift className="h-4 w-4" /> Claim this gift
                    </motion.button>
                  )}
                  {status === "PENDING" && mine && (
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.94 }} transition={VH_BOUNCE} onClick={() => doConfirm(item.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f59e0b] py-3.5 text-[14px] font-bold text-white vh-lift">
                        <Check className="h-4 w-4" /> I&apos;ve ordered this
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => doRelease(item.id)} aria-label="Release reservation"
                        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-[#fdf6e3] text-[#0f172a]/60 vh-lift">
                        <Undo2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}
                  {status === "PENDING" && !mine && (
                    <button onClick={() => setToast(guardMessage(cl))}
                      className="w-full cursor-not-allowed rounded-2xl bg-[#fdf6e3] py-3.5 text-[13px] font-semibold text-[#0f172a]/45">
                      Reserved by {cl.claimedByName}
                    </button>
                  )}
                  {status === "CLAIMED" && (
                    <button onClick={() => setToast(guardMessage(cl))}
                      className="w-full cursor-not-allowed rounded-2xl bg-[#fdf6e3] py-3.5 text-[13px] font-semibold text-[#0f172a]/45">
                      Already gifted
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <p className="relative z-[1] px-6 pt-2 text-[11px] text-[#0f172a]/40">{AFFILIATE_DISCLOSURE}</p>

      {/* Claim modal */}
      <AnimatePresence>
        {modalItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0f172a]/45 backdrop-blur-sm sm:items-center" onClick={() => setModalItem(null)}>
            <motion.div initial={{ y: 60, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={VH_BOUNCE} onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-t-[32px] bg-[#fffdf7] vh-lift-lg sm:rounded-[32px]">
              <button onClick={() => setModalItem(null)} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#fdf6e3] text-[#0f172a]/50"><X className="h-4 w-4" /></button>
              <div className="overflow-hidden" style={{ height: 200 }}>
                <BrandedImage src={modalItem.image} alt={modalItem.name} name={modalItem.name} variant="sand" className="h-full w-full object-cover" />
              </div>
              <div className="p-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6b6b]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#ff6b6b]"><Sparkles className="h-3 w-3" /> Planning to gift this?</span>
                <p className="font-editorial mt-3 text-[24px] font-semibold leading-tight text-[#0f172a]">{modalItem.name}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#0f172a]/55">We&apos;ll hold it for you for <span className="font-bold text-[#0f172a]">30 minutes</span> so nobody else buys it while you check out. Change your mind? Release it any time.</p>
                <motion.button whileTap={{ scale: 0.94 }} transition={VH_BOUNCE} onClick={() => doClaim(modalItem)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b6b] py-4 text-[15px] font-bold text-white vh-lift">
                  <Gift className="h-4 w-4" /> Claim this gift
                </motion.button>
                <button onClick={() => setModalItem(null)} className="mt-2 w-full py-2 text-[13px] font-semibold text-[#0f172a]/45">Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast — guard messages */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={VH_BOUNCE}
            className="fixed inset-x-4 bottom-6 z-[85] mx-auto max-w-sm rounded-2xl bg-[#0f172a] px-4 py-3.5 text-center text-[13px] font-semibold text-[#fdf6e3] vh-lift-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
