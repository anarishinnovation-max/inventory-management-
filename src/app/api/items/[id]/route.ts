import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.item.findUnique({
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

    // Transform for UI consistency if needed
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
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, sku, categoryId, unit, minStockLevel, isCritical } = body;

    // Check if item exists
    const existingItem = await prisma.item.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check for SKU uniqueness
    if (sku && sku !== existingItem.sku) {
        const skuCheck = await prisma.item.findUnique({ where: { sku } });
        if (skuCheck) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
        }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        sku: sku !== undefined ? sku : undefined,
        category: categoryId !== undefined ? { connect: { id: categoryId } } : undefined,
        unit: unit !== undefined ? unit : undefined,
        minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
        isCritical: isCritical !== undefined ? !!isCritical : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Item update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check for associated stock records
    const stockCount = await prisma.stock.count({
      where: { itemId: id, quantity: { gt: 0 } },
    });

    if (stockCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete item with existing stock records. Please clear stock first." 
      }, { status: 400 });
    }

    await prisma.$transaction([
        prisma.inventory.deleteMany({ where: { itemId: id } }),
        prisma.stock.deleteMany({ where: { itemId: id } }),
        prisma.inventoryTransaction.deleteMany({ where: { itemId: id } }),
        prisma.item.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Item delete error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
