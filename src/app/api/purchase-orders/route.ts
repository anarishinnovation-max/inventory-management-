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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { vendorId, items } = await request.json(); // items: { itemId, quantityOrdered, costPrice }[]

    if (!vendorId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          vendorId,
          status: "ORDERED", // Direct to ORDERED for simplicity
          items: {
            create: items.map((item: any) => ({
              itemId: item.itemId,
              quantityOrdered: parseFloat(item.quantityOrdered),
              costPrice: parseFloat(item.costPrice),
            })),
          },
        },
      });

      // Increase quantityInTransit for each item
      for (const item of items) {
        await tx.inventory.update({
          where: { itemId: item.itemId },
          data: {
            quantityInTransit: { increment: parseFloat(item.quantityOrdered) },
          },
        });
      }

      return po;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
