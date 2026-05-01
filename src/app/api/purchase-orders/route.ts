export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createActivityLog } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      vendorId?: string;
      items?: Array<{ itemId: string; quantityOrdered: number | string; costPrice: number | string }>;
      paymentMode?: string;
      orderDate?: string;
      expectedDelivery?: string | null;
    };
    const { vendorId, items, paymentMode, orderDate, expectedDelivery } = body;

    if (!vendorId || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    if (orderDate && new Date(orderDate) < now) {
      return NextResponse.json({ error: "Order date cannot be in the past." }, { status: 400 });
    }

    if (expectedDelivery && new Date(expectedDelivery) < now) {
      return NextResponse.json({ error: "Expected delivery date cannot be in the past." }, { status: 400 });
    }

    if (items.some(item => Number(item.costPrice) <= 0 || Number(item.quantityOrdered) <= 0)) {
      return NextResponse.json({ error: "Quantity and cost price must be greater than zero for all items." }, { status: 400 });
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
      performedBy: session.userId,
      performedByName: session.name,
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
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
