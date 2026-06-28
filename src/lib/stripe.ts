/**
 * Stripe Connect (Express) — platform service layer.
 *
 * All functions in this file are server-side only. Never import this module
 * from a "use client" component or any file in the NEXT_PUBLIC_ surface.
 *
 * Required environment variables (server-side):
 *   STRIPE_SECRET_KEY         — Platform secret key from Stripe Dashboard
 *   STRIPE_WEBHOOK_SECRET     — Signing secret for webhook endpoint verification
 *
 * Client-side (safe to expose):
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *
 * Architecture:
 *   - Hosts (pot creators) onboard via Stripe Express → receive a connected account ID.
 *   - Contributions route through the platform and split via `application_fee_amount`.
 *   - Idempotency keys prevent duplicate charges on retried requests.
 */

import Stripe from "stripe";

// ─── Singleton client ─────────────────────────────────────────────────────────

if (!process.env.STRIPE_SECRET_KEY) {
  // Warn at module load time in dev; hard-fail at runtime in production.
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is required in production.");
  }
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — Stripe calls will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
  appInfo: {
    name: "Kindled",
    version: "1.0.0",
  },
});

// ─── Fee constants ────────────────────────────────────────────────────────────

/** Platform application fee rate applied to each contribution (0.5%). */
const PLATFORM_FEE_RATE = 0.005;

/**
 * Calculates the application_fee_amount (in pence) to deduct from a
 * contribution before it settles on the connected account.
 *
 * We use the platform fee rate from fees.ts as the source of truth, but
 * express the result in Stripe's minor unit (pence) for the API call.
 */
export function calcApplicationFee(grossPence: number): number {
  return Math.round(grossPence * PLATFORM_FEE_RATE);
}

// ─── Connect: host onboarding ────────────────────────────────────────────────

/**
 * Creates a Stripe Express connected account for a host.
 * Call once during host onboarding; persist the returned `accountId` on User.
 *
 * @param email - Pre-fill the Express onboarding form with the host's email.
 * @returns The new Stripe connected account ID (e.g. "acct_...").
 */
export async function createConnectedAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        // Funds are held until the pot is marked FUNDED, then released manually.
        schedule: { interval: "manual" },
      },
    },
  });
  return account.id;
}

/**
 * Generates a Stripe Express onboarding link.
 * Redirect the host to this URL to complete identity verification.
 *
 * @param accountId - The connected account ID returned by createConnectedAccount.
 * @param returnUrl - Where Stripe redirects the host after onboarding completes.
 * @param refreshUrl - Where Stripe redirects if the link expires before use.
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Checks whether a connected account has completed onboarding and can receive payouts.
 */
export async function isAccountReady(accountId: string): Promise<boolean> {
  const account = await stripe.accounts.retrieve(accountId);
  return (
    account.charges_enabled === true &&
    account.payouts_enabled === true &&
    account.details_submitted === true
  );
}

// ─── Contributions: PaymentIntent ─────────────────────────────────────────────

interface CreateContributionIntentParams {
  /** Gross contribution amount in pence (minor units). */
  amountPence: number;
  /** Stripe connected account ID of the host (pot creator). */
  connectedAccountId: string;
  /** Used to generate the idempotency key — prevents duplicate charges. */
  potId: string;
  giverId: string;
  /** Stripe customer ID of the giver, if available (enables saved cards). */
  stripeCustomerId?: string;
  /** Human-readable description shown on the giver's bank statement. */
  statementDescriptor?: string;
}

/**
 * Creates a PaymentIntent on the connected (host) account with an
 * application fee routed to the platform account.
 *
 * Returns the client_secret — pass this to Stripe.js on the client to
 * confirm the payment without the secret key ever touching the browser.
 */
export async function createContributionIntent(
  params: CreateContributionIntentParams,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const {
    amountPence,
    connectedAccountId,
    potId,
    giverId,
    stripeCustomerId,
    statementDescriptor = "Kindled Gift",
  } = params;

  const applicationFeeAmount = calcApplicationFee(amountPence);

  const intent = await stripe.paymentIntents.create(
    {
      amount: amountPence,
      currency: "gbp",
      application_fee_amount: applicationFeeAmount,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
      statement_descriptor_suffix: statementDescriptor.slice(0, 22),
      metadata: { potId, giverId },
      automatic_payment_methods: { enabled: true },
    },
    {
      // Route intent through the connected account
      stripeAccount: connectedAccountId,
      // Idempotency key: prevents double-charge on client retries
      idempotencyKey: `pi:${potId}:${giverId}:${amountPence}`,
    },
  );

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client_secret for the PaymentIntent.");
  }

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

/**
 * Triggers an instant payout to the host's bank account once the pot is FUNDED.
 * Only call this after verifying the pot status is FUNDED and the connected
 * account has `payouts_enabled: true`.
 *
 * @param amountPence - Net amount to pay out after fees (in pence).
 * @param connectedAccountId - Host's Stripe Express account.
 * @param potId - Included in payout metadata for reconciliation.
 */
export async function payoutToHost(
  amountPence: number,
  connectedAccountId: string,
  potId: string,
): Promise<string> {
  const payout = await stripe.payouts.create(
    {
      amount: amountPence,
      currency: "gbp",
      method: "instant",
      metadata: { potId },
    },
    {
      stripeAccount: connectedAccountId,
      idempotencyKey: `payout:${potId}`,
    },
  );
  return payout.id;
}

// ─── Webhook verification ─────────────────────────────────────────────────────

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * Call this at the top of every webhook route handler.
 *
 * @throws {Stripe.errors.StripeSignatureVerificationError} on tampered payloads.
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
