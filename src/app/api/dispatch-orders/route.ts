import { InventoryService } from "@/lib/inventory-service";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const { customerId, items, paymentMode, status } = await request.json(); // items: { itemId, quantity, sellingPrice }[]

    if (!customerId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await InventoryService.createDispatchOrder({
      customerId,
      paymentMode: paymentMode || "Cash",
      status: status || "pending",
      items: items.map((item: any) => ({
        itemId: item.itemId,
        quantity: parseFloat(item.quantity),
        sellingPrice: parseFloat(item.sellingPrice),
      })),
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
