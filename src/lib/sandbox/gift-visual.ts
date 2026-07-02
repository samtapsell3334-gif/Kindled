/**
 * The Finished Wish layer (v9 WS-2): maps a server-redacted PotView to the
 * props of the MaterialisingGift visual. Pure and unit-tested — the receiver
 * ambient mapping is the surprise boundary for the visual layer, so it must
 * structurally carry no amount or percentage data (see gift-visual.test.ts).
 */

import type { PotView } from "./redact";

export type GiftVisual =
  | { mode: "ambient"; activity: "quiet" | "warming" | "glowing" }
  | { mode: "progress"; pct: number }
  | { mode: "complete" };

export function giftVisualFor(view: PotView): GiftVisual {
  if (view.kind === "receiver_surprise") {
    return { mode: "ambient", activity: view.activity };
  }
  if (view.status !== "open") return { mode: "complete" };
  const pct = view.goal > 0 ? Math.min(100, Math.round((view.raised / view.goal) * 100)) : 0;
  return pct >= 100 ? { mode: "complete" } : { mode: "progress", pct };
}
