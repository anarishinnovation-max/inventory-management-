import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        items: {
          include: { item: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vendorId?: string;
      items?: Array<{ itemId: string; quantityOrdered: number | string; costPrice: number | string }>;
      paymentMode?: string;
      expectedDelivery?: string | null;
    };
    const { vendorId, items, paymentMode, expectedDelivery } = body; // items: { itemId, quantityOrdered, costPrice }[]
    const normalizedPaymentMode = typeof paymentMode === "string" && paymentMode.trim()
      ? paymentMode.trim()
      : "Cash";

    let normalizedExpectedDelivery: Date | null = null;
    if (expectedDelivery) {
      normalizedExpectedDelivery = new Date(expectedDelivery);
      if (Number.isNaN(normalizedExpectedDelivery.getTime())) {
        return NextResponse.json({ error: "Invalid expected delivery date/time" }, { status: 400 });
      }
    }

    if (!vendorId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          vendorId,
          paymentMode: normalizedPaymentMode,
          expectedDelivery: normalizedExpectedDelivery,
          status: "ORDERED", // Direct to ORDERED for simplicity
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              quantityOrdered: Number(item.quantityOrdered),
              costPrice: Number(item.costPrice),
            })),
          },
        },
      });

      // Increase incoming quantities for each item (incomingQty is used by inventory UI; quantityInTransit kept for backwards compatibility).
      for (const item of items) {
        const qty = Number(item.quantityOrdered);
        await tx.inventory.upsert({
          where: { itemId: item.itemId },
          create: {
            item: { connect: { id: item.itemId } },
            quantityAvailable: 0,
            incomingQty: qty,
            quantityInTransit: qty,
            quantityReserved: 0,
          },
          update: {
            incomingQty: { increment: qty },
            quantityInTransit: { increment: qty },
          },
        });
      }

      return po;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
