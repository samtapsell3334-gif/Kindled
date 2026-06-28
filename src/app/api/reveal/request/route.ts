import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requestRevealVideo } from "@/lib/ai-reveal";
import { handleApiError, AppError } from "@/lib/errors";

// Typed shim — revealTask model exists in schema.prisma but Prisma client
// won't include it until `prisma migrate dev` is run against a real database.
interface PotWithReveal {
  id: string; title: string; status: string; currentBalance: unknown;
  revealVideoUrl: string | null;
  items: { productName: string; category: string }[];
  _count: { contributions: number };
}
interface RevealTaskRow { id: string }
const dbExt = db as unknown as {
  pot: { findUnique(a: unknown): Promise<PotWithReveal | null> };
  revealTask: { findFirst(a: unknown): Promise<RevealTaskRow | null> };
};

const bodySchema = z.object({
  potId: z.string().cuid(),
});

/**
 * POST /api/reveal/request
 *
 * Triggers AI video generation for a fully-funded pot.
 * Call this once when a pot's status transitions to FUNDED and the
 * receiver opens the reveal ceremony.
 *
 * Idempotent: if a COMPLETED task already exists for this pot, returns
 * the existing videoUrl immediately without re-submitting to the provider.
 *
 * Body: { potId: string }
 * Response: { data: { taskId, videoUrl | null } }
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { potId } = parsed.data;

    const pot = await dbExt.pot.findUnique({
      where: { id: potId },
      select: {
        id: true,
        title: true,
        status: true,
        currentBalance: true,
        // Added by schema migration — present at runtime once `prisma migrate dev` has run
        revealVideoUrl: true,
        items: {
          take: 1,
          orderBy: { price: "desc" },
          select: { productName: true, category: true },
        },
        _count: {
          select: { contributions: { where: { status: "COMPLETED" } } },
        },
      },
    });

    if (!pot) throw new AppError("Pot not found.", 404);

    // Return the pre-existing URL if already generated.
    if (pot.revealVideoUrl) {
      return NextResponse.json({ data: { taskId: null, videoUrl: pot.revealVideoUrl } });
    }

    // Check for an in-progress task — don't submit a duplicate.
    const existingTask = await dbExt.revealTask.findFirst({
      where: { potId, status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (existingTask) {
      return NextResponse.json({ data: { taskId: existingTask.id, videoUrl: null } });
    }

    const revealInput: Parameters<typeof requestRevealVideo>[0] = {
      potId: pot.id,
      title: pot.title,
      amountRaised: Number(pot.currentBalance),
      contributorCount: pot._count.contributions,
      ...(pot.items[0] ? { primaryItem: pot.items[0].productName, category: pot.items[0].category } : {}),
    };
    const result = await requestRevealVideo(revealInput);

    return NextResponse.json({ data: { taskId: result.taskId, videoUrl: null } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
