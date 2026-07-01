/**
 * DemoBanner (v4.1 guardrail 2) — persistent, unobtrusive strip on every sandbox
 * surface. Server component; renders whenever DEMO_MODE is on (default: on).
 */
export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "0") return null;
  return (
    <div role="note" className="sticky top-0 z-[80] bg-stone-900 px-3 py-1.5 text-center">
      <p className="text-[11px] font-medium text-amber-300/90">
        Demonstration environment · No payments are processed · No goods are supplied
      </p>
    </div>
  );
}
