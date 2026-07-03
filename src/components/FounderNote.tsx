/**
 * A founder's note (v16.4) — the one section on the entire site that must
 * be in Sam's own words. Do NOT fill this in with AI-drafted personal
 * narrative: no invented backstory, no invented motivation, nothing
 * presented as his voice that isn't actually his. See TODO-FOUNDER.md.
 *
 * TO EDIT: replace the placeholder text below (marked PLACEHOLDER) with a
 * short first-person note — why you built Kindled, what personal
 * experience with gift-giving, family, or a specific moment motivated it.
 * 2-4 sentences is plenty. Once real copy is in, the "Draft" badge and the
 * dashed border below can come out too (both exist only to make sure this
 * never accidentally ships looking finished before it actually is).
 */

const PLACEHOLDER_NOTE =
  "[Sam — write this yourself: 2-4 sentences on why you built Kindled. " +
  "What's the real story? A specific Christmas or birthday that went wrong, " +
  "a moment with your own kids, family, or friends that made you think " +
  "\"there has to be a better way\"? Keep it short and specific — a real " +
  "detail beats a general statement every time.]";

export function FounderNote() {
  return (
    <section className="bg-[#fdf9f5] py-20 px-5">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-white p-8 md:p-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold uppercase tracking-wide text-stone-600">
              Sam
            </div>
            <div>
              <p className="text-[13px] font-bold text-stone-800">A note from the founder</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Draft — awaiting Sam&apos;s words</p>
            </div>
          </div>
          <p className="text-[15px] italic leading-relaxed text-stone-500">
            {PLACEHOLDER_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}
