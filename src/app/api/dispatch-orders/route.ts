export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";

import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const orders = await prisma.dispatchOrder.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          status: true,
          paymentMode: true,
          createdAt: true,
          customer: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const orders = await prisma.dispatchOrder.findMany({
      where: { companyId: session.companyId },
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, items, paymentMode, status, expectedDelivery, orderDate, collectedBy, dispatchedBy, transportMode } = await request.json(); // items: { itemId, quantity, sellingPrice }[]

    if (!customerId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expectedDelivery) {
      const deliveryDate = new Date(expectedDelivery);
      if (deliveryDate < today) {
        return NextResponse.json({ error: "Delivery date cannot be in the past" }, { status: 400 });
      }
    }

    if (orderDate) {
      const oDate = new Date(orderDate);
      if (oDate < today) {
        return NextResponse.json({ error: "Order date cannot be in the past" }, { status: 400 });
      }
    }

    const order = await InventoryService.createDispatchOrder({
      customerId,
      companyId: session.companyId,
      paymentMode: paymentMode || "Cash",
      status: status || "pending",
      expectedDelivery: expectedDelivery,
      orderDate: orderDate,
      collectedBy: collectedBy,
      dispatchedBy: dispatchedBy,
      transportMode: transportMode,
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
