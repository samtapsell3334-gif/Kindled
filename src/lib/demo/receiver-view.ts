/**
 * Demo receiver-view redaction (P3.2) — prop-level, not CSS.
 *
 * The demo's recipient view previously received full DemoPot objects and simply
 * chose not to render `raised`/`contributors`. This mapper makes the boundary
 * structural: the receiver components accept ONLY `ReceiverPot`, which cannot
 * carry progress amounts, contributor counts, tribute content or draw entries.
 * The goal figure stays — the recipient wrote their own wishlist, so targets
 * are theirs by definition; what must never reach their DOM is progress.
 * Unit-tested in src/lib/__tests__/receiver-view.test.ts.
 */

export interface ReceiverPot {
  id: string;
  title: string;
  image?: string;
  goal: number;
  eventLabel: string;
  eventIso: string;
  stackNote?: string;
  isClaimed?: boolean;
  claimedBy?: string;
}

/** The fields the mapper reads; everything else on the source is discarded. */
interface ReceiverSource extends Omit<ReceiverPot, "image" | "stackNote" | "isClaimed" | "claimedBy"> {
  image?: string;
  stackNote?: string;
  isClaimed?: boolean;
  claimedBy?: string;
  isChecklist?: boolean;
}

export function toReceiverPots<T extends ReceiverSource>(pots: T[]): ReceiverPot[] {
  return pots
    .filter((p) => !p.isChecklist) // "Parent's pick" checklist items never reach the recipient
    .map((p) => ({
      id: p.id,
      title: p.title,
      goal: p.goal,
      eventLabel: p.eventLabel,
      eventIso: p.eventIso,
      ...(p.image ? { image: p.image } : {}),
      ...(p.stackNote ? { stackNote: p.stackNote } : {}),
      ...(p.isClaimed ? { isClaimed: true } : {}),
      ...(p.claimedBy ? { claimedBy: p.claimedBy } : {}),
    }));
}
