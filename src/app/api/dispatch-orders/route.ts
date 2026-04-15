import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.dispatchOrder.findMany({
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { customerId, items } = await request.json(); // items: { itemId, quantity, sellingPrice }[]

    if (!customerId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Check stock availability for all items
      for (const item of items) {
        const inv = await tx.inventory.findUnique({
          where: { itemId: item.itemId },
        });

        if (!inv || inv.quantityAvailable < parseFloat(item.quantity)) {
          throw new Error(`Insufficient stock for item SKU: ${item.itemId}`);
        }
      }

      // 2. Create the Dispatch Order
      const dispatch = await tx.dispatchOrder.create({
        data: {
          customerId,
          status: "pending",
          items: {
            create: items.map((item: any) => ({
              itemId: item.itemId,
              quantity: parseFloat(item.quantity),
              sellingPrice: parseFloat(item.sellingPrice),
            })),
          },
        },
      });

      // 3. Mark quantities as Reserved
      for (const item of items) {
        await tx.inventory.update({
          where: { itemId: item.itemId },
          data: {
            quantityReserved: { increment: parseFloat(item.quantity) },
          },
        });
      }

      return dispatch;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
