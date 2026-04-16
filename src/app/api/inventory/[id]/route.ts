import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function computeInventoryStatus(params: {
  totalQty: number;
  incomingQty: number;
  minStockLevel: number;
}) {
  const { totalQty, incomingQty, minStockLevel } = params;
  if (totalQty === 0 && incomingQty > 0) return "ORDERED";
  if (totalQty > 0 && totalQty <= minStockLevel) return "LOW_STOCK";
  return totalQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        inventory: {
          include: {
            batches: {
              include: { vendor: true },
              orderBy: { purchaseDate: "desc" },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const openLines = await prisma.pOLineItem.findMany({
      where: {
        itemId,
        purchaseOrder: {
          status: { notIn: ["DELIVERED", "RECEIVED"] },
        },
      },
      include: {
        purchaseOrder: {
          include: { vendor: true },
        },
      },
      orderBy: { purchaseOrder: { createdAt: "desc" } },
    });

    const incomingPurchaseOrders = openLines
      .map((line) => {
        const remaining = Math.max(0, Number(line.quantityOrdered) - Number(line.quantityReceived));
        if (remaining <= 0) return null;
        return {
          poId: line.purchaseOrderId,
          vendor: line.purchaseOrder.vendor?.name || "Unknown",
          quantity: remaining,
          status: line.purchaseOrder.status,
          expectedDelivery: line.purchaseOrder.expectedDelivery,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const totalQty = Number(item.inventory?.quantityAvailable || 0);
    const incomingQty = Number(item.inventory?.incomingQty || 0);
    const minStockLevel = Number(item.minStockLevel || 0);
    const status = computeInventoryStatus({ totalQty, incomingQty, minStockLevel });

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        category: item.category,
      },
      inventory: item.inventory,
      totalQty,
      incomingQty,
      status,
      incomingPurchaseOrders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
