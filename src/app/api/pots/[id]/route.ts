import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/errors";
import type { PotApiResponse } from "@/types/pots";

// ─── Query param schema ───────────────────────────────────────────────────────

const querySchema = z.object({
  /**
   * ID of the calling user.
   * Production: sourced from the verified session token.
   * Development: passed as a query param for simulation.
   */
  viewerId: z.string().cuid().optional(),
});

// ─── Privacy boundary ─────────────────────────────────────────────────────────

/**
 * Determines whether a caller should receive the locked (redacted) view.
 *
 * Locking applies to UNDER_THE_TREE and WRAPPED_UP modes when:
 *   - The caller IS the pot owner (receiver of the gift), AND
 *   - The current date is strictly before the eventDate.
 *
 * Contributors (anyone who is not the owner) ALWAYS receive the real balance,
 * regardless of mode, so they know exactly how much is still needed.
 */
function resolveLock(
  pot: { creatorId: string; mode: string; eventDate: Date | null },
  viewerId: string | undefined,
): { isLocked: boolean; obscure: boolean } {
  const isSurpriseMode = pot.mode === "UNDER_THE_TREE" || pot.mode === "WRAPPED_UP";
  if (!isSurpriseMode) return { isLocked: false, obscure: false };

  const isOwner = viewerId !== undefined && viewerId === pot.creatorId;
  const beforeReveal = pot.eventDate !== null && new Date() < pot.eventDate;

  if (isOwner && beforeReveal) return { isLocked: true, obscure: true };
  return { isLocked: false, obscure: false };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) throw new AppError("Missing pot ID.", 400);

    const rawQuery = Object.fromEntries(req.nextUrl.searchParams);
    const queryParsed = querySchema.safeParse(rawQuery);
    if (!queryParsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters.", issues: queryParsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { viewerId } = queryParsed.data;

    const pot = await db.pot.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        targetAmount: true,
        currentBalance: true,
        status: true,
        mode: true,
        eventDate: true,
        creatorId: true,
        _count: {
          select: { contributions: { where: { status: "COMPLETED" } } },
        },
      },
    });

    if (!pot) throw new AppError("Pot not found.", 404);

    const { isLocked, obscure } = resolveLock(
      { creatorId: pot.creatorId, mode: pot.mode, eventDate: pot.eventDate },
      viewerId,
    );

    const response: PotApiResponse = {
      id: pot.id,
      title: pot.title,
      description: pot.description,
      targetAmount: Number(pot.targetAmount),
      // Zero out the balance for the receiver before the reveal date
      currentBalance: obscure ? 0 : Number(pot.currentBalance),
      status: pot.status,
      mode: pot.mode,
      isLocked,
      eventDate: pot.eventDate?.toISOString() ?? null,
      // Hide the true contributor count from the receiver while locked
      contributorCount: obscure ? 0 : pot._count.contributions,
      creatorId: pot.creatorId,
    };

    return NextResponse.json({ data: response });
  } catch (err) {
    return handleApiError(err);
  }
}
