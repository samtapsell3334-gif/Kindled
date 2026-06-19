// ─── Core gifting mode ────────────────────────────────────────────────────────

export type GiftingMode = "LIVE_FEED" | "UNDER_THE_TREE" | "WRAPPED_UP";

// ─── API response shape ───────────────────────────────────────────────────────

/**
 * Returned by GET /api/pots/[id].
 *
 * Privacy boundary — server-applied before responding:
 *
 *   UNDER_THE_TREE | WRAPPED_UP + caller is owner + today < eventDate
 *     → currentBalance: 0, contributorNames: [], isLocked: true
 *
 *   UNDER_THE_TREE | WRAPPED_UP + caller is contributor
 *     → real currentBalance, real contributor list, isLocked: false
 *
 *   LIVE_FEED (any caller) | on/after eventDate
 *     → always real currentBalance, isLocked: false
 */
export interface PotApiResponse {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentBalance: number;
  status: "ACTIVE" | "HALFWAY" | "FUNDED" | "STALLED";
  mode: GiftingMode;
  isLocked: boolean;
  eventDate: string | null;
  contributorCount: number;
  creatorId: string;
}

// ─── Client card data ─────────────────────────────────────────────────────────

export interface VideoTribute {
  id: string;
  contributorName: string;
  /** Text message — shown as a slide-in card when videoUrl is absent */
  message: string;
  videoUrl?: string;
  recordedAt: string;
}

export interface PotCardData {
  id: string;
  title: string;
  raised: number;
  goal: number;
  event: { label: string; date: string; isoDate: string };
  contributors: number;
  accentGradient: string;
  mode: GiftingMode;
  /**
   * true  → caller is the RECEIVER of a surprise pot before its eventDate.
   *         Dashboard hides progress; shows seasonal locked card instead.
   * false → LIVE_FEED pot, or a CONTRIBUTOR accessing a surprise pot via shared link.
   *         Dashboard always shows real progress (+ urgent B2B banner if mode ≠ LIVE_FEED).
   */
  isLocked: boolean;
  /** Name shown in the contributor urgency banner */
  recipientName: string;
  /** Booster draw entries earned when this pot is fully funded */
  boosterEntries: number;
  tributes: VideoTribute[];
}
