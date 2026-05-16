export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";

import { getSession } from "@/lib/auth";
import { createActivityLog } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { dispatchOrderSchema } from "@/lib/schemas/orders";
import { logger } from "@/lib/structured-logger";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(session.role as any, "dispatch:view", session.customPermissions)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to view dispatch orders." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const orders = await prisma.dispatchOrder.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          status: true,
          paymentMode: true,
          createdAt: true,
          customer: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const orders = await prisma.dispatchOrder.findMany({
      where: { companyId: session.companyId },
      include: {
        customer: true,
        items: {
          include: { item: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role as any, "dispatch:create", session.customPermissions)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to create dispatch orders." }, { status: 403 });
    }

    const body = await request.json();
    const result = dispatchOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { customerId, items, paymentMode, status, expectedDelivery, orderDate, collectedBy, dispatchedBy, transportMode } = result.data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expectedDelivery) {
      const deliveryDate = new Date(expectedDelivery);
      if (deliveryDate < today) {
        return NextResponse.json({ error: "Delivery date cannot be in the past" }, { status: 400 });
      }
    }

    if (orderDate) {
      const oDate = new Date(orderDate);
      if (oDate < today) {
        return NextResponse.json({ error: "Order date cannot be in the past" }, { status: 400 });
      }
    }

    const order = await InventoryService.createDispatchOrder({
      customerId,
      companyId: session.companyId,
      paymentMode: paymentMode || "Cash",
      status: status || "pending",
      expectedDelivery: expectedDelivery ?? undefined,
      orderDate: orderDate ?? undefined,
      collectedBy: collectedBy ?? undefined,
      dispatchedBy: dispatchedBy ?? undefined,
      transportMode: transportMode ?? undefined,
      items: items.map((item: any) => ({
        itemId: item.itemId,
        quantity: parseFloat(item.quantity),
        sellingPrice: parseFloat(item.sellingPrice),
      })),
    });
    
    // Log the Dispatch Order creation
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await createActivityLog({
      actionType: "CREATE",
      entityType: "DISPATCH_ORDER",
      entityId: order.id,
      performedBy: session.id,
      performedByName: session.username,
      newValue: {
        customerId: order.customerId,
        itemCount: items.length,
        status: order.status
      },
      companyId: session.companyId,
      ipAddress: ip,
      userAgent: userAgent
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    logger.error("[api/dispatch-orders] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
