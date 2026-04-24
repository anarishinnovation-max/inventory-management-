export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      dispatchOrder: {
        companyId: session.companyId,
        status: "dispatched",
      },
    };

    if (itemId) {
      where.itemId = itemId;
    }

    if (customerId) {
      where.dispatchOrder.customerId = customerId;
    }

    if (startDate || endDate) {
      where.dispatchOrder.createdAt = {};
      if (startDate) {
        where.dispatchOrder.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.dispatchOrder.createdAt.lte = new Date(endDate);
      }
    }

    const items = await prisma.dispatchItem.findMany({
      where,
      include: {
        item: true,
        dispatchOrder: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        dispatchOrder: {
          createdAt: "desc",
        },
      },
    });

    // Transform data for UI
    const result = items.map((di) => ({
      id: di.id,
      date: di.dispatchOrder.createdAt,
      itemName: di.item.name,
      itemSku: di.item.sku,
      quantity: di.quantity,
      customerName: di.dispatchOrder.customer.name,
      invoiceId: di.dispatchOrder.id,
      sellingPrice: di.sellingPrice,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Supply Outwards API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
