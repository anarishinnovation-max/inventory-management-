import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory-service";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ids, action } = (await request.json()) as { ids: string[]; action: "ORDERED" | "RECEIVED" | "CANCELLED" };

    if (!ids || !ids.length) {
      return NextResponse.json({ error: "No purchase orders selected" }, { status: 400 });
    }

    const results = [];

    if (action === "RECEIVED") {
      // Transition orders to RECEIVED/QC_PENDING by receiving remaining goods
      for (const poId of ids) {
        const po = await prisma.purchaseOrder.findFirst({
          where: { id: poId, companyId: session.companyId },
          include: { items: true },
        });

        if (!po) continue;

        const itemsToReceive = po.items
          .map((item) => ({
            itemId: item.itemId,
            receivedQty: Number(item.quantityOrdered) - Number(item.quantityReceived),
          }))
          .filter((item) => item.receivedQty > 0);

        if (itemsToReceive.length > 0) {
          const updatedPo = await InventoryService.receiveGoods(poId, itemsToReceive, session.id);
          results.push(updatedPo);
        } else {
          // If already fully received, just make sure status is QC_PENDING
          const updatedPo = await prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: "QC_PENDING" },
          });
          results.push(updatedPo);
        }
        revalidatePath(`/orders/purchase/${poId}`, "page");
      }
    } else if (action === "CANCELLED") {
      // Cancel selected orders and release incoming quantities
      await prisma.$transaction(async (tx) => {
        for (const poId of ids) {
          const po = await tx.purchaseOrder.findFirst({
            where: { id: poId, companyId: session.companyId },
            include: { items: true },
          });

          if (!po || po.status === "CANCELLED") continue;

          await tx.purchaseOrder.update({
            where: { id: poId },
            data: { status: "CANCELLED" },
          });

          for (const item of po.items) {
            const remainingQty = Number(item.quantityOrdered) - Number(item.quantityReceived);
            if (remainingQty > 0) {
              const existingInv = await tx.inventory.findUnique({
                where: { itemId: item.itemId },
              });
              if (existingInv) {
                await tx.inventory.update({
                  where: { id: existingInv.id },
                  data: {
                    incomingQty: { decrement: remainingQty },
                    quantityInTransit: { decrement: remainingQty },
                  },
                });
              }
            }
          }
          results.push({ id: poId, status: "CANCELLED" });
        }
      });
    } else if (action === "ORDERED") {
      // Simply update status to ORDERED
      for (const poId of ids) {
        const updatedPo = await prisma.purchaseOrder.update({
          where: { id: poId, companyId: session.companyId },
          data: { status: "ORDERED" },
        });
        results.push(updatedPo);
        revalidatePath(`/orders/purchase/${poId}`, "page");
      }
    } else {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    revalidatePath("/orders/purchase", "page");
    revalidatePath("/orders/supply-inwards", "page");
    revalidatePath("/inventory", "page");
    revalidateTag("inventory", "default");

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error("[PO BULK UPDATE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
