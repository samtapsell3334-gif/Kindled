import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { ItemCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/errors";

// ─── Constants ─────────────────────────────────────────────────────────────

/** Items at or above this price trigger an IntentDataNode on pot creation (Day 1 signal). */
const HIGH_TICKET_THRESHOLD = new Decimal("200.00");

// ─── Validation ─────────────────────────────────────────────────────────────

const decimalAmountString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal with up to 2 decimal places.");

const potItemSchema = z.object({
  productName: z.string().min(1).max(255),
  category: z.nativeEnum(ItemCategory),
  price: decimalAmountString.refine((v) => new Decimal(v).gt("0"), {
    message: "Item price must be greater than £0.",
  }),
  externalUrl: z.string().url().max(2048).optional(),
  isSponsored: z.boolean().default(false),
  pinX: z.number().min(0).max(1).optional(),
  pinY: z.number().min(0).max(1).optional(),
});

const createPotSchema = z.object({
  creatorId: z.string().cuid({ message: "Invalid creator ID." }),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  targetAmount: decimalAmountString.refine((v) => new Decimal(v).gte("1.00"), {
    message: "Target must be at least £1.00.",
  }),
  eventDate: z.string().datetime({ offset: true }).optional(),
  items: z.array(potItemSchema).max(50, "A pot may have at most 50 items.").default([]),
});

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = createPotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { creatorId, title, description, targetAmount, eventDate, items } = parsed.data;

    const creator = await db.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!creator) throw new AppError("User not found.", 404);

    const targetDecimal = new Decimal(targetAmount);
    const now = new Date();

    // ── Identify high-ticket items up front so we can build IntentDataNode
    //    data without touching the DB inside the transaction callback.
    const highTicketIndexes = items.reduce<number[]>((acc, item, i) => {
      if (new Decimal(item.price).gte(HIGH_TICKET_THRESHOLD)) acc.push(i);
      return acc;
    }, []);

    // ── Single transaction: pot → items → intent nodes ──────────────────────
    const pot = await db.$transaction(async (tx) => {
      const createdPot = await tx.pot.create({
        data: {
          creatorId,
          title,
          description: description ?? null,
          targetAmount: targetDecimal,
          currentBalance: new Decimal("0"),
          status: "ACTIVE",
          eventDate: eventDate ? new Date(eventDate) : null,
        },
      });

      // Create all items and capture their generated IDs.
      const createdItems =
        items.length > 0
          ? await Promise.all(
              items.map((item) =>
                tx.potItem.create({
                  data: {
                    potId: createdPot.id,
                    productName: item.productName,
                    category: item.category,
                    price: new Decimal(item.price),
                    externalUrl: item.externalUrl ?? null,
                    isSponsored: item.isSponsored,
                    pinX: item.pinX ?? null,
                    pinY: item.pinY ?? null,
                  },
                  select: { id: true, price: true, category: true },
                }),
              ),
            )
          : [];

      // For every high-ticket item added at pot creation, emit a Day 1 intent signal.
      // hoursAfterPotCreation = 0 because items and pot are created simultaneously.
      if (highTicketIndexes.length > 0) {
        await tx.intentDataNode.createMany({
          data: highTicketIndexes.map((idx) => {
            const item = items[idx]!;
            const createdItem = createdItems[idx]!;
            return {
              userId: creatorId,
              potId: createdPot.id,
              potItemId: createdItem.id,
              category: item.category,
              priceAtCapture: new Decimal(item.price),
              hoursAfterPotCreation: 0,
              isExported: false,
              capturedAt: now,
            };
          }),
        });
      }

      return {
        id: createdPot.id,
        title: createdPot.title,
        targetAmount: createdPot.targetAmount,
        currentBalance: createdPot.currentBalance,
        status: createdPot.status,
        eventDate: createdPot.eventDate,
        createdAt: createdPot.createdAt,
        itemCount: createdItems.length,
        intentNodesCreated: highTicketIndexes.length,
      };
    });

    return NextResponse.json({ data: pot }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
