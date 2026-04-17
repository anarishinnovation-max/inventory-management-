import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function computeInventoryStatus(params: {
  totalQty: number;
  incomingQty: number;
  reservedQty: number;
  minStockLevel: number;
}) {
  const { totalQty, incomingQty, reservedQty, minStockLevel } = params;
  
  // Net availability = (Physical + Incoming) - Reserved
  const netAvailable = (totalQty + incomingQty) - reservedQty;
  
  if (netAvailable < 0) return "SHORTAGE";
  if (totalQty === 0 && incomingQty > 0) return "ORDERED";
  if (totalQty > 0 && totalQty < reservedQty) return "PARTIAL";
  if (totalQty > 0 && totalQty <= minStockLevel) return "LOW_STOCK";
  return totalQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
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
              include: { vendor: true },
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
      orderDate: item.dispatchOrder.orderDate
    }));

    const totalQty = Number(item.inventory?.quantityAvailable || 0);
    const incomingQty = Number(item.inventory?.incomingQty || 0);
    const reservedQty = Number(item.inventory?.quantityReserved || 0);
    const minStockLevel = Number(item.minStockLevel || 0);
    
    const status = computeInventoryStatus({ 
      totalQty, 
      incomingQty, 
      reservedQty, 
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
      reservedQty,
      netAvailable: (totalQty + incomingQty) - reservedQty,
      status,
      incomingPurchaseOrders,
      linkedCustomerOrders
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
