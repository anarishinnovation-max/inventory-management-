export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const orders = await prisma.purchaseOrder.findMany({
        select: {
          id: true,
          status: true,
          paymentMode: true,
          createdAt: true,
          vendor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

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
    const { vendorId, items, paymentMode, expectedDelivery } = body;

    if (!vendorId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await (prisma as any).$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.create({
        data: {
          vendorId,
          paymentMode: paymentMode || "Cash",
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          status: "ORDERED",
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              quantityOrdered: Number(item.quantityOrdered),
              costPrice: Number(item.costPrice),
            })),
          },
        },
      });

      for (const item of items) {
        const qty = Number(item.quantityOrdered);
        const existingInv = await tx.inventory.findFirst({
          where: { itemId: item.itemId }
        });

        if (existingInv) {
          await tx.inventory.update({
            where: { id: existingInv.id },
            data: {
              incomingQty: { increment: qty },
              quantityInTransit: { increment: qty },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              item: { connect: { id: item.itemId } },
              quantityAvailable: 0,
              incomingQty: qty,
              quantityInTransit: qty,
              quantityReserved: 0,
            },
          });
        }
      }

      return po;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
