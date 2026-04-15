import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { item: { include: { category: true } } },
      orderBy: { item: { name: "asc" } },
    });
    return NextResponse.json(inventory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // This could be for SCRAP
  try {
    const { itemId, quantity, reason } = await request.json();
    if (!itemId || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const updated = await InventoryService.scrapInventory(itemId, parseFloat(quantity), reason);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
