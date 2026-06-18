import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/errors";
import { verifyWebhookSignature } from "@/lib/webhook";
import { resolveTransition } from "@/lib/pot-transitions";
import { calculateFees } from "@/lib/fees";

// ─── Validation ─────────────────────────────────────────────────────────────

const webhookPayloadSchema = z.object({
  event: z.enum(["payment.completed", "payment.failed", "payment.processing"]),
  contributionId: z.string().cuid(),
  /**
   * Gross amount confirmed by the payment provider.
   * Must match our origination record exactly — any delta is rejected.
   */
  confirmedAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "confirmedAmount must be a valid decimal."),
  providerRef: z.string().max(128).optional(),
});

// ─── Config ─────────────────────────────────────────────────────────────────

// Prevent Next.js from auto-parsing the body — we need raw bytes for HMAC.
export const dynamic = "force-dynamic";

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify webhook authenticity before touching any data ──────────────
    const rawBody = await req.text();
    const signature = req.headers.get("x-kindling-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    // ── 2. Validate payload shape ────────────────────────────────────────────
    let parsed: z.SafeParseReturnType<typeof webhookPayloadSchema._input, z.infer<typeof webhookPayloadSchema>>;
    try {
      parsed = webhookPayloadSchema.safeParse(JSON.parse(rawBody) as unknown);
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
    }

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { event, contributionId, confirmedAmount } = parsed.data;

    // ── 3. Load contribution with its pot ───────────────────────────────────
    const contribution = await db.contribution.findUnique({
      where: { id: contributionId },
      select: {
        id: true,
        status: true,
        amount: true,
        pot: {
          select: {
            id: true,
            currentBalance: true,
            targetAmount: true,
            status: true,
          },
        },
      },
    });

    if (!contribution) throw new AppError("Contribution not found.", 404);

    // ── 4. Idempotency — reject replays of already-settled events ───────────
    if (
      contribution.status === "COMPLETED" ||
      contribution.status === "FAILED" ||
      contribution.status === "REFUNDED"
    ) {
      return NextResponse.json(
        { message: "Contribution already settled.", status: contribution.status },
        { status: 200 },
      );
    }

    // ── 5. Intermediate processing signal ───────────────────────────────────
    if (event === "payment.processing") {
      await db.contribution.update({
        where: { id: contributionId },
        data: { status: "PROCESSING" },
      });
      return NextResponse.json(
        { message: "Contribution marked as processing.", contributionId },
        { status: 200 },
      );
    }

    // ── 6. Failure path ─────────────────────────────────────────────────────
    if (event === "payment.failed") {
      await db.contribution.update({
        where: { id: contributionId },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { message: "Contribution marked as failed.", contributionId },
        { status: 200 },
      );
    }

    // ── 7. Success path ─────────────────────────────────────────────────────

    // Verify the provider-confirmed gross matches what we originated.
    // Any discrepancy is treated as a suspicious event and rejected.
    const confirmed = new Decimal(confirmedAmount);
    if (!confirmed.equals(contribution.amount)) {
      throw new AppError(
        `Amount mismatch: expected £${contribution.amount.toFixed(2)}, received £${confirmed.toFixed(2)}.`,
        409,
      );
    }

    const fees = calculateFees(confirmed);
    const { pot } = contribution;
    const previousBalance = new Decimal(pot.currentBalance.toString());
    const newBalance = previousBalance.add(fees.netToPot);

    const { nextStatus, event: milestoneEvent } = resolveTransition({
      targetAmount: new Decimal(pot.targetAmount.toString()),
      previousBalance,
      newBalance,
      currentStatus: pot.status,
    });

    // ── 8. Atomic settlement ─────────────────────────────────────────────────
    // Contribution status and pot balance are written in a single transaction.
    // A partial write here would leave the ledger inconsistent.
    await db.$transaction([
      db.contribution.update({
        where: { id: contributionId },
        data: { status: "COMPLETED" },
      }),
      db.pot.update({
        where: { id: pot.id },
        data: {
          currentBalance: newBalance,
          status: nextStatus,
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Contribution settled.",
        contributionId,
        potId: pot.id,
        ledger: {
          previousBalance: previousBalance.toFixed(2),
          netCredited: fees.netToPot.toFixed(2),
          newBalance: newBalance.toFixed(2),
        },
        potStatus: nextStatus,
        // Emitted when the pot crosses the 50% or 100% threshold —
        // the client can use this to trigger Bridge-the-Gap or Ignite Reveal UI.
        ...(milestoneEvent && { milestoneEvent }),
      },
      { status: 200 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
