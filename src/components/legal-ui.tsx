import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

/** Shared chrome + typography for the legal/policy pages. British English throughout. */
export function LegalShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-stone-800">
      <header className="border-b border-stone-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Flame className="h-3.5 w-3.5 text-stone-900" strokeWidth={2.5} />
            </span>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-[18px] font-bold text-stone-900">
              Kindled
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-14">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-[34px] font-bold leading-tight text-stone-900 md:text-[42px]">
          {title}
        </h1>
        {intro && <p className="mt-3 text-[16px] leading-relaxed text-stone-500">{intro}</p>}
        <p className="mt-3 text-[13px] text-stone-400">Last updated: {updated}</p>
        <div className="mt-10 space-y-2">{children}</div>
      </main>

      <footer className="border-t border-stone-100">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[13px] text-stone-400">
          <p>© {new Date().getFullYear()} Kindled. Made with love in the UK.</p>
          <nav className="flex gap-5">
            <Link href="/privacy" className="hover:text-stone-700">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-700">Terms</Link>
            <Link href="/contact" className="hover:text-stone-700">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 pt-8 text-[20px] font-bold text-stone-900">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-stone-600">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-stone-600 marker:text-amber-500">{children}</ul>;
}

/** Highlighted note for items the founder/legal team must confirm before launch. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-900">
      <span className="font-bold">[TODO — founder/legal to confirm]</span> {children}
    </p>
  );
}
