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
      companyId: session.companyId,
      type: "SALE",
    };

    if (itemId) {
      where.itemId = itemId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        item: true,
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for UI
    const result = transactions.map((tx) => ({
      id: tx.id,
      date: tx.createdAt,
      itemName: tx.item.name,
      itemSku: tx.item.sku,
      quantity: Math.abs(tx.quantity),
      customerName: tx.customer?.name || "Unknown",
      invoiceId: tx.referenceId || "N/A",
      type: tx.type,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Supply Outwards API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
