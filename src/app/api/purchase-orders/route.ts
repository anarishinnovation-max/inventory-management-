export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createActivityLog } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { purchaseOrderSchema } from "@/lib/schemas/orders";
import { logger } from "@/lib/structured-logger";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.role as any, "po:view", session.customPermissions)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to view purchase orders." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const orders = await prisma.purchaseOrder.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          status: true,
          paymentMode: true,
          createdAt: true,
          vendor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where: { companyId: session.companyId },
      include: {
        vendor: true,
        items: {
          include: { item: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: unknown) {
    logger.error("[api/purchase-orders] GET error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.role as any, "po:create", session.customPermissions)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to create purchase orders." }, { status: 403 });
    }

    const body = await request.json();
    const result = purchaseOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { vendorId, items, paymentMode, orderDate, expectedDelivery } = result.data;

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    if (orderDate && new Date(orderDate) < now) {
      return NextResponse.json({ error: "Order date cannot be in the past." }, { status: 400 });
    }

    if (expectedDelivery && new Date(expectedDelivery) < now) {
      return NextResponse.json({ error: "Expected delivery date cannot be in the past." }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          vendorId,
          paymentMode: paymentMode || "Cash",
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
          status: "ORDERED",
          companyId: session.companyId,
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              quantityOrdered: Number(item.quantityOrdered),
              costPrice: Number(item.costPrice),
            })),
          },
        },
      });

      for (const item of items) {
        const qty = Number(item.quantityOrdered);
        const existingInv = await tx.inventory.findUnique({
          where: { itemId: item.itemId }
        });

        if (existingInv) {
          // Verify companyId matches
          if (existingInv.companyId !== session.companyId) {
             throw new Error("Unauthorized inventory access");
          }
          await tx.inventory.update({
            where: { id: existingInv.id },
            data: {
              incomingQty: { increment: qty },
              quantityInTransit: { increment: qty },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              itemId: item.itemId,
              quantityAvailable: 0,
              incomingQty: qty,
              quantityInTransit: qty,
              quantityReserved: 0,
              companyId: session.companyId
            },
          });
        }
      }

      return po;
    });

    // Log the PO creation
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await createActivityLog({
      actionType: "CREATE",
      entityType: "PURCHASE_ORDER",
      entityId: order.id,
      performedBy: session.id,
      performedByName: session.username,
      newValue: {
        vendorId: order.vendorId,
        itemCount: items.length,
        status: order.status
      },
      companyId: session.companyId,
      ipAddress: ip,
      userAgent: userAgent
    });

    revalidatePath("/orders/purchase", "page");
    revalidatePath("/inventory", "page");
    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    logger.error("[api/purchase-orders] POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
