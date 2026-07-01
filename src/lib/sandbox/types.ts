/**
 * Sandbox MVP (v4.1) — entity types. Simulated money only: amounts are whole
 * pounds as integers. No real card data ever touches these types (enforced in
 * the store + tests).
 */

export type PotStatus = "open" | "revealed" | "stacked";
export type ItemSource = "catalogue" | "manual" | "kid_circled";
export type ViewerRole = "receiver" | "guest" | "manager";
export type RevealOutcome = "gift_card" | "product" | "stack";

export interface SandboxItem {
  id: string;
  name: string;
  image?: string;
  /** Whole pounds — simulated. */
  price: number;
  /** Structured intent data (the point of the exercise). */
  category: string;
  retailer: string;
  priceBand: "under25" | "25to100" | "100to500" | "over500";
  source: ItemSource;
  /** Child-circled items need parent approval before appearing on the pot. */
  approved: boolean;
}

export interface SandboxMessage {
  id: string;
  contributionId: string;
  displayName: string;
  text?: string;
  /** Object URL / blob ref — never the media bytes. */
  videoRef?: string;
  consent: boolean;
  createdAt: number;
}

export interface SandboxContribution {
  id: string;
  potId: string;
  displayName: string;
  /** Whole pounds — simulated. */
  amount: number;
  ref?: string;
  createdAt: number;
}

export interface SandboxPot {
  id: string;
  /** Unguessable public share slug. */
  slug: string;
  /** Unguessable private manager key (second secret URL). */
  managerKey: string;
  title: string;
  recipientName: string;
  occasion: string;
  eventDate: string; // ISO date
  isSurprise: boolean;
  isChildPot: boolean;
  starChartEnabled: boolean;
  organiserName: string;
  /** Optional, stored for launch contact — nothing is sent in sandbox. */
  organiserEmail?: string;
  status: PotStatus;
  stackedFrom?: string;
  items: SandboxItem[];
  contributions: SandboxContribution[];
  messages: SandboxMessage[];
  revealOutcome?: RevealOutcome;
  /** Simulated commission recorded on gift-card conversion (pounds, 2dp). */
  simulatedCommission?: number;
  createdAt: number;
  seeded?: boolean;
}

export interface SandboxEvent {
  id: string;
  event: string;
  potId?: string;
  ref?: string;
  props?: Record<string, string | number | boolean>;
  ts: number;
}
