/**
 * Server-side surprise redaction (v4.1 guardrail 6 / v3 P3.2 done properly).
 *
 * The API builds the viewer payload through THIS function, so a receiver opening
 * a surprise pot gets a response that structurally cannot contain amounts,
 * progress, contribution details, or sealed message content — enforced at the
 * server, verified by unit test, not hidden with CSS.
 */

import type { SandboxPot, ViewerRole } from "./types";

/** What a receiver may see of a surprise pot: warmth, never numbers. */
export interface ReceiverSurpriseView {
  kind: "receiver_surprise";
  title: string;
  recipientName: string;
  occasion: string;
  eventDate: string;
  status: SandboxPot["status"];
  /** Ambient signal only — deliberately vague. */
  activity: "quiet" | "warming" | "glowing";
  isChildPot: boolean;
}

export interface GuestView {
  kind: "guest";
  /** Unsealed only once the pot is revealed/stacked — the reveal experience's fuel. */
  unsealedMessages?: { displayName: string; text?: string; videoRef?: string }[];
  title: string;
  recipientName: string;
  occasion: string;
  eventDate: string;
  status: SandboxPot["status"];
  isSurprise: boolean;
  isChildPot: boolean;
  items: { id: string; name: string; image?: string; price: number; category: string; retailer: string }[];
  raised: number;
  goal: number;
  contributors: { displayName: string; amount: number }[];
  /** Sealed message CONTENT is never exposed to guests on surprise pots — count only. */
  messageCount: number;
}

export interface ManagerView extends Omit<GuestView, "kind"> {
  kind: "manager";
  managerKey: string;
  slug: string;
  organiserName: string;
  messages: SandboxPot["messages"];
  revealOutcome?: SandboxPot["revealOutcome"];
  simulatedCommission?: number;
}

export type PotView = ReceiverSurpriseView | GuestView | ManagerView;

const goalOf = (pot: SandboxPot) =>
  pot.items.filter((i) => i.approved).reduce((a, i) => a + i.price, 0);
const raisedOf = (pot: SandboxPot) =>
  pot.contributions.reduce((a, c) => a + c.amount, 0);

export function viewFor(pot: SandboxPot, role: ViewerRole, opts: { unseal?: boolean } = {}): PotView {
  if (role === "receiver" && pot.isSurprise && pot.status === "open") {
    const n = pot.contributions.length;
    return {
      kind: "receiver_surprise",
      title: pot.title,
      recipientName: pot.recipientName,
      occasion: pot.occasion,
      eventDate: pot.eventDate,
      status: pot.status,
      activity: n === 0 ? "quiet" : n < 4 ? "warming" : "glowing",
      isChildPot: pot.isChildPot,
    };
  }

  const base = {
    title: pot.title,
    recipientName: pot.recipientName,
    occasion: pot.occasion,
    eventDate: pot.eventDate,
    status: pot.status,
    isSurprise: pot.isSurprise,
    isChildPot: pot.isChildPot,
    items: pot.items
      .filter((i) => i.approved)
      .map(({ id, name, image, price, category, retailer }) => ({ id, name, ...(image ? { image } : {}), price, category, retailer })),
    raised: raisedOf(pot),
    goal: goalOf(pot),
    contributors: pot.contributions.map(({ displayName, amount }) => ({ displayName, amount })),
    messageCount: pot.messages.length,
    ...(pot.status !== "open"
      ? { unsealedMessages: pot.messages.map(({ displayName, text, videoRef }) => ({ displayName, ...(text ? { text } : {}), ...(videoRef ? { videoRef } : {}) })) }
      : {}),
  };

  if (role === "manager") {
    return {
      kind: "manager",
      ...base,
      managerKey: pot.managerKey,
      slug: pot.slug,
      organiserName: pot.organiserName,
      // Sealed until reveal on surprise pots — the organiser sees counts, not content.
      // `unseal` is set ONLY by the manager-key-authorised reveal ceremony itself.
      messages: pot.isSurprise && pot.status === "open" && !opts.unseal ? [] : pot.messages,
      ...(pot.revealOutcome ? { revealOutcome: pot.revealOutcome } : {}),
      ...(pot.simulatedCommission !== undefined ? { simulatedCommission: pot.simulatedCommission } : {}),
    };
  }

  return { kind: "guest", ...base };
}

/** The forbidden keys a receiver-surprise payload must never contain (tested). */
export const RECEIVER_FORBIDDEN_KEYS = [
  "raised", "goal", "amount", "contributions", "contributors", "price",
  "messages", "text", "videoRef", "managerKey", "simulatedCommission",
] as const;
