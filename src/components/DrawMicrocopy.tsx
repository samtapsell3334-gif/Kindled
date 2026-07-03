import Link from "next/link";
import { DRAW } from "@/content/claims";

/**
 * Prize-draw compliance line (v11.1 P1-11) — every draw mention carries this,
 * sourced from claims.ts, never hand-typed: "18+, UK residents only. Free
 * entry route — no purchase necessary." + the full-terms link.
 */
export function DrawMicrocopy({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      {DRAW.microcopy}{" "}
      <Link href={DRAW.termsHref} className="underline underline-offset-2">Full terms</Link>.
    </span>
  );
}
