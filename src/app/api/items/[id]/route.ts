import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await (prisma as any).item.findFirst({
      where: { id },
      include: {
        category: true,
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

    const transformedItem = {
        ...item,
        stocks: (item as any).stocks.map((s: any) => ({
            id: s.id,
            quantity: s.quantity,
            rackId: s.rackId,
            rackNumber: s.rack?.rackNumber || "N/A"
        }))
    };

    return NextResponse.json(transformedItem);
  } catch (error: any) {
    console.error("Item fetch error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, categoryId, unit, minStockLevel, isCritical } = body;

    const existingItem = await (prisma as any).item.findFirst({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (sku && sku !== existingItem.sku) {
        const skuCheck = await (prisma as any).item.findFirst({ where: { sku } });
        if (skuCheck) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
        }
    }

    const updatedItem = await (prisma as any).item.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        sku: sku !== undefined ? sku : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        unit: unit !== undefined ? unit : undefined,
        minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
        isCritical: isCritical !== undefined ? !!isCritical : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Item update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stockCount = await (prisma as any).stock.count({
      where: { itemId: id, quantity: { gt: 0 } },
    });

    if (stockCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete item with existing stock records." 
      }, { status: 400 });
    }

    await (prisma as any).$transaction([
        (prisma as any).inventory.deleteMany({ where: { itemId: id } }),
        (prisma as any).stock.deleteMany({ where: { itemId: id } }),
        (prisma as any).inventoryTransaction.deleteMany({ where: { itemId: id } }),
        (prisma as any).item.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Item delete error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
