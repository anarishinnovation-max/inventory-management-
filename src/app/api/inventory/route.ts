export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";

function computeInventoryStatus(params: {
  totalQty: number;
  incomingQty: number;
  reservedQty: number;
  minStockLevel: number;
}) {
  const { totalQty, incomingQty, reservedQty, minStockLevel } = params;
  const netAvailable = (totalQty + incomingQty) - reservedQty;

  if (netAvailable < 0) return "SHORTAGE";
  if (totalQty === 0 && incomingQty > 0) return "ORDERED";
  if (totalQty > 0 && totalQty < reservedQty) return "PARTIAL";
  if (totalQty > 0 && totalQty <= minStockLevel) return "LOW_STOCK";
  return totalQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
}

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        item: { include: { category: true } },
        batches: {
          include: { vendor: true },
          orderBy: { purchaseDate: 'desc' }
        }
      },
      orderBy: { item: { name: "asc" } },
    });

    const mapped = inventory.map((inv) => {
      const totalQty = Number(inv.quantityAvailable || 0);
      const incomingQty = Number(inv.incomingQty || 0);
      const reservedQty = Number(inv.quantityReserved || 0);
      const minStockLevel = Number(inv.item?.minStockLevel || 0);
      const status = computeInventoryStatus({
        totalQty,
        incomingQty,
        reservedQty,
        minStockLevel
      });
      return {
        ...inv,
        totalQty,
        incomingQty,
        reservedQty,
        status,
        netAvailable: (totalQty + incomingQty) - reservedQty
      };
    });

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // This could be for SCRAP
  try {
    const { itemId, quantity, reason } = await request.json();
    if (!itemId || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const updated = await InventoryService.scrapInventory(itemId, parseFloat(quantity), reason);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
