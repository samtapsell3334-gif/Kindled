import type { Metadata } from "next";
import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";
import { FilmPlayer } from "@/components/FilmPlayer";
import { CUSTOMER_FILM, CUSTOMER_TRANSCRIPT } from "@/data/customer-film";

export const metadata: Metadata = {
  title: "How Kindled works · 60 seconds — Kindled",
  description:
    "Watch the 60-second film: one pot, one link, everyone chips in — sealed until the reveal on the big day.",
};

/**
 * The customer film (v6 WS-V4): self-hosted code-played film, captions on by
 * default, no third-party cookies, transcript below for accessibility + SEO.
 */
export default function FilmPage() {
  return (
    <div className="min-h-screen bg-[#fdf9f5] text-stone-900">
      <header className="border-b border-stone-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Flame className="h-3.5 w-3.5 text-stone-900" strokeWidth={2.5} />
            </span>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-bold">Kindled</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[30px] font-bold leading-tight md:text-[38px]">
          How Kindled works, in 60 seconds
        </h1>
        <p className="mt-2 text-[15px] text-stone-500">Captions are on by default — it works with the sound off.</p>

        <div className="mt-6">
          <FilmPlayer film={CUSTOMER_FILM} />
        </div>

        <section className="mt-10">
          <h2 className="text-[16px] font-bold text-stone-800">Transcript</h2>
          <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-stone-600">
            {CUSTOMER_TRANSCRIPT.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#waitlist" className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-[14px] font-bold text-stone-900">
            Reserve your spot
          </Link>
          <Link href="/pots/demo" className="rounded-2xl border border-stone-300 px-6 py-3.5 text-[14px] font-semibold text-stone-700">
            See a live pot
          </Link>
        </div>
      </main>
    </div>
  );
}
