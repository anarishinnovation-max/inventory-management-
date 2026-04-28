export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac-utils";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requirePermission("items:view");

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const items = await prisma.item.findMany({
        where: {
          companyId: session.companyId
        },
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          minStockLevel: true,
          inventory: {
            select: {
              quantityAvailable: true
            }
          }
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(items);
    }

    const items = await prisma.item.findMany({
      where: {
        companyId: session.companyId
      },
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

import { createActivityLog } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requirePermission("items:create");

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const data = await request.json();
    const { name, sku, categoryId, unit, minStockLevel, isCritical, rackId } = data;
    
    if (!name || !sku || !categoryId || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await InventoryService.addItem({
      name,
      sku,
      categoryId,
      unit,
      companyId: session.companyId,
      minStockLevel: minStockLevel !== undefined ? parseFloat(minStockLevel) : undefined,
      isCritical: !!isCritical,
      rackId
    });

    // Log action
    await createActivityLog({
      actionType: "CREATE",
      entityType: "ITEM",
      entityId: item.id,
      performedBy: session.userId,
      performedByName: session.name,
      newValue: item,
      companyId: session.companyId,
      ipAddress: ip,
      userAgent: userAgent
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.message.startsWith("SKU_EXISTS:")) {
      return NextResponse.json({ error: error.message.split(":")[1] + " already exists in the registry." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
