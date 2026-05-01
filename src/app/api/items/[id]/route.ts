import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac-utils";
import { revalidatePath } from "next/cache";
import { createActivityLog } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("items:view");

    const { id } = await params;

    const item = await (prisma as any).item.findFirst({
      where: { id, companyId: session.companyId },
      include: {
        category: true,
        inventory: {
          include: {
            batches: {
              include: { vendor: true },
              orderBy: { purchaseDate: 'desc' },
              take: 5
            }
          }
        },
        dispatchItems: {
          include: {
            dispatchOrder: {
              include: { customer: true }
            }
          },
          orderBy: {
            dispatchOrder: { createdAt: 'desc' }
          },
          take: 5
        },
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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Managers can do full CRUD, Employees can do limited update
    // We'll check 'items:update' or 'items:update-limited'
    try {
      await requirePermission("items:update");
    } catch {
      await requirePermission("items:update-limited");
    }

    const { id } = await params;
    const body = await request.json();
    const { name, sku, categoryId, unit, minStockLevel, isCritical } = body;

    const existingItem = await (prisma as any).item.findFirst({ 
      where: { id, companyId: session.companyId } 
    });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (sku && sku !== existingItem.sku) {
        const skuCheck = await (prisma as any).item.findFirst({ 
          where: { sku, companyId: session.companyId } 
        });
        if (skuCheck) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
        }
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

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

    // Log update
    await createActivityLog({
      actionType: "UPDATE",
      entityType: "ITEM",
      entityId: id,
      performedBy: session.id,
      performedByName: session.username,
      oldValue: existingItem,
      newValue: updatedItem,
      companyId: session.companyId,
      ipAddress: ip,
      userAgent: userAgent
    });

    // Clear caches for related pages
    revalidatePath("/inventory");
    revalidatePath("/transactions");

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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("items:delete");

    const { id } = await params;

    const existingItem = await (prisma as any).item.findFirst({ 
      where: { id, companyId: session.companyId } 
    });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const stockCount = await (prisma as any).stock.count({
      where: { itemId: id, quantity: { gt: 0 } },
    });

    if (stockCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete item with existing stock records." 
      }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await (prisma as any).$transaction([
        (prisma as any).inventoryBatch.deleteMany({ where: { inventory: { itemId: id } } }),
        (prisma as any).inventory.deleteMany({ where: { itemId: id } }),
        (prisma as any).stock.deleteMany({ where: { itemId: id } }),
        (prisma as any).inventoryTransaction.deleteMany({ where: { itemId: id } }),
        (prisma as any).pOLineItem.deleteMany({ where: { itemId: id } }),
        (prisma as any).dispatchItem.deleteMany({ where: { itemId: id } }),
        (prisma as any).item.delete({ where: { id } })
    ]);

    // Log deletion
    await createActivityLog({
      actionType: "DELETE",
      entityType: "ITEM",
      entityId: id,
      performedBy: session.id,
      performedByName: session.username,
      oldValue: existingItem,
      companyId: session.companyId,
      ipAddress: ip,
      userAgent: userAgent
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Item delete error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
