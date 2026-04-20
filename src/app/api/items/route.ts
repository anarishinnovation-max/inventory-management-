export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";

export async function GET() {
  try {
    const items = await (prisma as any).item.findMany({
      include: {
        category: true,
        inventory: {
          include: {
            batches: {
              include: {
                vendor: true
              },
              orderBy: { purchaseDate: 'desc' }
            }
          }
        },
        stocks: {
          include: {
            rack: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, sku, categoryId, unit, minStockLevel, isCritical } = data;
    
    if (!name || !sku || !categoryId || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await InventoryService.addItem({
      name,
      sku,
      categoryId,
      unit,
      minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
      isCritical: !!isCritical
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.message.startsWith("SKU_EXISTS:")) {
      return NextResponse.json({ error: error.message.split(":")[1] + " already exists in the registry." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
