import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

/** Custom 404 — warm, on-brand, and it sends people somewhere useful. */
export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 text-center"
      style={{ background: "radial-gradient(ellipse 90% 60% at 50% 30%, #1a0800 0%, #0a0400 55%, #050200 100%)" }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl" style={{ boxShadow: "0 12px 40px rgba(251,146,60,0.4)" }}>
        <Flame className="h-8 w-8 text-stone-900" strokeWidth={1.75} />
      </div>
      <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.25em] text-amber-400/80">404</p>
      <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-2 text-[34px] font-bold leading-tight text-white md:text-[44px]">
        This ember drifted off
      </h1>
      <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-white/50">
        The page you&apos;re after doesn&apos;t exist — but the pots are very much still burning.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-[14px] font-bold text-stone-900 transition-transform hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <Link
          href="/pots/demo"
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-[14px] font-medium text-white/75 transition-colors hover:bg-white/10"
        >
          See a live pot
        </Link>
      </div>
    </div>
  );
}
