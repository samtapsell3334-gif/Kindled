import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/errors";
import { calculateFees } from "@/lib/fees";

// ─── Validation ─────────────────────────────────────────────────────────────

const openBankingSchema = z.object({
  potId: z.string().cuid({ message: "Invalid pot ID." }),
  /**
   * Gross contribution amount in GBP, as a decimal string.
   * Minimum is £0.15 — enough to cover the 5p processing cost and yield a non-zero net.
   */
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal with up to 2 decimal places.")
    .refine((v) => new Decimal(v).gte("0.15"), {
      message: "Minimum Open Banking contribution is £0.15.",
    }),
  giverId: z.string().cuid().optional(),
  videoMessageUrl: z.string().url().max(512).optional(),
});

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = openBankingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { potId, amount, giverId, videoMessageUrl } = parsed.data;

    // ── Validate pot exists and is still accepting contributions ─────────────
    const pot = await db.pot.findUnique({
      where: { id: potId },
      select: { id: true, title: true, status: true, targetAmount: true, currentBalance: true },
    });

    if (!pot) throw new AppError("Pot not found.", 404);
    if (pot.status === "FUNDED") {
      throw new AppError("This pot has already been fully funded.", 409);
    }

    // ── Optionally validate giver ────────────────────────────────────────────
    if (giverId) {
      const giver = await db.user.findUnique({ where: { id: giverId }, select: { id: true } });
      if (!giver) throw new AppError("Giver account not found.", 404);
    }

    // ── Fee calculation ──────────────────────────────────────────────────────
    const gross = new Decimal(amount);
    const fees = calculateFees(gross);

    const remaining = new Decimal(pot.targetAmount.toString()).sub(
      new Decimal(pot.currentBalance.toString()),
    );

    // ── Persist a PENDING contribution ──────────────────────────────────────
    // The webhook handler is the only authority that advances this to COMPLETED.
    const contribution = await db.contribution.create({
      data: {
        potId,
        giverId: giverId ?? null,
        amount: gross,
        paymentMethod: "OPEN_BANKING",
        status: "PENDING",
        videoUrl: videoMessageUrl ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(
      {
        data: {
          contributionId: contribution.id,
          initiatedAt: contribution.createdAt,
          pot: {
            id: pot.id,
            title: pot.title,
            remainingToTarget: remaining.toFixed(2),
          },
          feeBreakdown: {
            gross: fees.gross.toFixed(2),
            platformFee: fees.platformFee.toFixed(2),         // 0.5% of gross
            processingCost: fees.processingCost.toFixed(2),   // flat 5p A2A pass-through
            netToPot: fees.netToPot.toFixed(2),
          },
          // In production this resolves to a real Open Banking consent URL from the PSP.
          paymentRedirectUrl: `https://mock-ob-provider.kindling.dev/consent?ref=${contribution.id}`,
          status: "PENDING",
        },
      },
      { status: 202 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
