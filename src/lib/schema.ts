/**
 * TypeScript type layer for Kindled.
 *
 * These types mirror the Prisma schema (`prisma/schema.prisma`) but are
 * decoupled from Prisma's generated client so they can be used in:
 *   - API response shapes
 *   - Service function signatures
 *   - UI component props
 *   - Unit tests
 *
 * Monetary values in the Prisma layer are `Decimal`. At the API boundary
 * (serialised JSON) they become `number` (pounds, 2 dp). That conversion
 * happens in the route handler; these types reflect the API-boundary form.
 *
 * "Fire" is the product name. Code always uses "Pot" to match Prisma models.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/** Role of a user within a pot. "host" = creator / receiver; "giver" = contributor. */
export type UserRole = "host" | "giver";

/**
 * Pot lifecycle status.
 * ACTIVE → HALFWAY → FUNDED. STALLED is set only by a background job.
 * Transitions are governed by resolveTransition() in src/lib/pot-transitions.ts.
 */
export type FireStatus = "ACTIVE" | "HALFWAY" | "FUNDED" | "STALLED";

/** UX and AdTech segmentation mode for a pot. */
export type GiftingMode = "LIVE_FEED" | "UNDER_THE_TREE" | "WRAPPED_UP";

/** Payment method used by a contributor. */
export type PaymentMethod = "OPEN_BANKING" | "CASHBACK" | "CARD";

/** Lifecycle status of a single contribution / payment intent. */
export type TransactionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";

/** Category of a wishlist item — used for AdTech segmentation. */
export type ItemCategory =
  | "ELECTRONICS"
  | "FASHION"
  | "HOME_GARDEN"
  | "SPORTS_OUTDOORS"
  | "BEAUTY_HEALTH"
  | "TOYS_GAMES"
  | "TRAVEL"
  | "EXPERIENCES"
  | "FOOD_DRINK"
  | "OTHER";

// ─── Core domain types ────────────────────────────────────────────────────────

/**
 * User — both hosts (pot creators) and givers (contributors).
 * stripeAccountId is the Stripe Connect Express account ID for hosts.
 * stripeCustomerId is the Stripe customer ID for givers (card payments).
 */
export interface User {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatarUrl: string | null;
  isRegistered: boolean;
  /** Cashback wallet balance in pounds, to 2 dp. */
  cashbackWalletBalance: number;
  /** Stripe Connect Express account ID. Null until host completes onboarding. */
  stripeAccountId: string | null;
  /** Stripe customer ID. Null until giver makes a card payment. */
  stripeCustomerId: string | null;
  createdAt: string; // ISO 8601
}

/**
 * Fire (product name) / Pot (code name).
 * Monetary fields are in pounds to 2 dp at the API boundary.
 */
export interface Fire {
  id: string;
  /** User ID of the pot creator — the person who will receive the gift. */
  hostId: string;
  title: string;
  description: string | null;
  /** Total funding goal in pounds. */
  targetAmount: number;
  /** Current accumulated balance in pounds. */
  currentBalance: number;
  status: FireStatus;
  mode: GiftingMode;
  /** Whether this pot persists across multiple gifting cycles. */
  continuous: boolean;
  /** ISO 8601 date of the next reveal milestone. Null for LIVE_FEED pots. */
  eventDate: string | null;
  /** CDN URL of the AI-generated reveal video. Null until generated. */
  revealVideoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction — a single contribution to a Fire.
 * Wraps a Stripe PaymentIntent for card/Open Banking payments.
 */
export interface Transaction {
  id: string;
  /** The Fire this contribution belongs to. */
  fireId: string;
  /** The contributing user. Null for anonymous contributions. */
  giverId: string | null;
  /** Contribution amount in pounds, to 2 dp. */
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  /** Stripe PaymentIntent ID. Set once the intent is created. */
  stripeIntentId: string | null;
  /** Optional message to display in the reveal ceremony. */
  message: string | null;
  /** Optional video tribute URL. */
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * IntentLog — a high-intent purchase signal emitted when a user adds a
 * wishlist item priced ≥ £200 within 24 h of pot creation.
 * Powers programmatic ad targeting and CPM yield optimisation.
 */
export interface IntentLog {
  id: string;
  fireId: string;
  userId: string;
  /** The specific wishlist item that triggered the signal. */
  potItemId: string;
  category: ItemCategory;
  /** Price captured at signal time — item price may change later. */
  priceAtCapture: number;
  /** Hours elapsed between pot creation and item being added. */
  hoursAfterPotCreation: number;
  /** Whether this node has been exported to the downstream ad platform. */
  isExported: boolean;
  exportedAt: string | null;
  capturedAt: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

/** Returned by GET /api/pots/:id. Applies the privacy boundary for surprise pots. */
export interface FireApiResponse {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  /** Zero for the receiver of a surprise pot before eventDate. */
  currentBalance: number;
  status: FireStatus;
  mode: GiftingMode;
  /** True when the caller is the receiver and eventDate has not passed. */
  isLocked: boolean;
  eventDate: string | null;
  /** Zero for locked pots. */
  contributorCount: number;
  hostId: string;
}

/** Returned by POST /api/pots/create. */
export interface CreateFireResponse {
  id: string;
  title: string;
  targetAmount: number;
  status: FireStatus;
  eventDate: string | null;
  createdAt: string;
  itemCount: number;
}

/** Returned by POST /api/contributions/create. */
export interface CreateTransactionResponse {
  transactionId: string;
  /** Stripe PaymentIntent client secret — pass to Stripe.js to confirm payment. */
  clientSecret: string;
}

// ─── Request body shapes ──────────────────────────────────────────────────────

export interface CreateFireInput {
  hostId: string;
  title: string;
  description?: string;
  /** Target amount in pounds (e.g. 250.00). */
  targetAmount: string;
  /** ISO 8601 datetime with timezone offset. */
  eventDate?: string;
  items?: CreateFireItemInput[];
}

export interface CreateFireItemInput {
  productName: string;
  category: ItemCategory;
  /** Price in pounds (e.g. "299.99"). */
  price: string;
  externalUrl?: string;
}

export interface CreateTransactionInput {
  fireId: string;
  giverId?: string;
  /** Amount in pounds (e.g. "25.00"). */
  amount: string;
  paymentMethod: PaymentMethod;
  message?: string;
}

// ─── Utility types ────────────────────────────────────────────────────────────

/** Generic API envelope used by all routes. */
export type ApiEnvelope<T> =
  | { data: T; error?: never }
  | { data?: never; error: string; issues?: Record<string, string[]> };
