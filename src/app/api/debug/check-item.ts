import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku");

    if (!sku) {
      return NextResponse.json({ error: "SKU parameter required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { sku },
      include: {
        inventory: true,
        stocks: {
          include: {
            rack: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: item.id,
      name: item.name,
      sku: item.sku,
      minStockLevel: item.minStockLevel,
      inventory: item.inventory,
      stocks: item.stocks,
      totalStock: (item.stocks || []).reduce((acc, s) => acc + s.quantity, 0),
      incomingQty: item.inventory?.incomingQty ?? 0
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
