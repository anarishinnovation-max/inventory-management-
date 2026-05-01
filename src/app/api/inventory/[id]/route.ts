import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function computeInventoryStatus(params: {
  totalQty: number;
  incomingQty: number;
  minStockLevel: number;
}) {
  const { totalQty, incomingQty, minStockLevel } = params;
  
  if (totalQty <= 0 && incomingQty > 0) return "ON_ORDER";
  if (totalQty <= 0) return "OUT_OF_STOCK";
  if (totalQty <= minStockLevel) return "LOW_STOCK";
  return "IN_STOCK";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        inventory: {
          include: {
            batches: {
              include: { 
                vendor: true,
                receivedBy: {
                  select: { name: true }
                }
              },
              orderBy: { purchaseDate: "desc" },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Fetch incoming Purchase Orders
    const openLines = await prisma.pOLineItem.findMany({
      where: {
        itemId,
        purchaseOrder: {
          status: { notIn: ["DELIVERED", "RECEIVED"] },
        },
      },
      include: {
        purchaseOrder: {
          include: { vendor: true },
        },
      },
      orderBy: { purchaseOrder: { createdAt: "desc" } },
    });

    const incomingPurchaseOrders = openLines
      .map((line) => {
        const remaining = Math.max(0, Number(line.quantityOrdered) - Number(line.quantityReceived));
        if (remaining <= 0) return null;
        return {
          poId: line.purchaseOrderId,
          vendor: line.purchaseOrder.vendor?.name || "Unknown",
          quantity: remaining,
          status: line.purchaseOrder.status,
          expectedDelivery: line.purchaseOrder.expectedDelivery,
          costPrice: Number(line.costPrice || 0),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // Fetch linked Customer Orders
    const linkedDispatchItems = await prisma.dispatchItem.findMany({
      where: {
        itemId,
        dispatchOrder: {
          status: { notIn: ["dispatched", "cancelled"] }
        }
      },
      include: {
        dispatchOrder: {
          include: { customer: true }
        }
      },
      orderBy: { dispatchOrder: { createdAt: "desc" } }
    });

    const linkedCustomerOrders = linkedDispatchItems.map(item => ({
      orderId: item.dispatchOrderId,
      customer: item.dispatchOrder.customer.name,
      quantity: item.quantity,
      status: item.dispatchOrder.status,
      orderDate: item.dispatchOrder.orderDate,
      price: Number(item.sellingPrice || 0)
    }));

    // Fetch full selling history (dispatched orders)
    const sellingHistoryRaw = await prisma.dispatchItem.findMany({
      where: {
        itemId,
        dispatchOrder: {
          status: "dispatched"
        }
      },
      include: {
        dispatchOrder: {
          include: { customer: true }
        }
      },
      orderBy: { dispatchOrder: { createdAt: "desc" } },
      take: 20
    });

    const sellingHistory = sellingHistoryRaw.map(di => ({
      id: di.id,
      customer: di.dispatchOrder.customer.name,
      quantity: di.quantity,
      price: di.sellingPrice,
      date: di.dispatchOrder.createdAt
    }));

    const totalQty = Number(item.inventory?.quantityAvailable || 0);
    const incomingQty = Number(item.inventory?.incomingQty || 0);
    const reservedQty = Number(item.inventory?.quantityReserved || 0);
    const minStockLevel = Number(item.minStockLevel || 0);
    
    const status = computeInventoryStatus({ 
      totalQty, 
      incomingQty, 
      minStockLevel 
    });

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        category: item.category,
      },
      inventory: item.inventory,
      totalQty,
      incomingQty,
      totalVisibility: totalQty + incomingQty,
      status,
      incomingPurchaseOrders,
      linkedCustomerOrders,
      sellingHistory,
      purchaseHistory: (item.inventory as any)?.batches.map((b: any) => ({
        vendor: b.vendor?.name || "Unknown",
        quantity: b.quantity,
        remainingQty: b.remainingQty,
        costPerUnit: b.costPerUnit,
        date: b.purchaseDate,
        receivedBy: b.receivedBy?.name || "System"
      })) || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
