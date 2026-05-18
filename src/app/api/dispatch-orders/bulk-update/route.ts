import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ids, action } = (await request.json()) as { ids: string[]; action: "CANCELLED" | "PICKING" | "PACKED" };

    if (!ids || !ids.length) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    const results = [];

    if (action === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        for (const orderId of ids) {
          const order = await tx.dispatchOrder.findFirst({
            where: { id: orderId, companyId: session.companyId },
            include: { items: true },
          });

          if (!order || order.status === "cancelled") continue;

          // If the order was pending, picking, or packed, we must release reservations
          if (["pending", "picking", "packed"].includes(order.status)) {
            for (const item of order.items) {
              const existingInv = await tx.inventory.findUnique({
                where: { itemId: item.itemId },
              });
              if (existingInv) {
                await tx.inventory.update({
                  where: { id: existingInv.id },
                  data: {
                    quantityReserved: {
                      decrement: Math.min(Number(existingInv.quantityReserved || 0), Number(item.quantity)),
                    },
                  },
                });
              }
            }
          }

          const updatedOrder = await tx.dispatchOrder.update({
            where: { id: orderId },
            data: { status: "cancelled" },
          });
          results.push(updatedOrder);
        }
      });
    } else if (action === "PICKING") {
      for (const orderId of ids) {
        const updatedOrder = await prisma.dispatchOrder.update({
          where: { id: orderId, companyId: session.companyId },
          data: { status: "picking" },
        });
        results.push(updatedOrder);
      }
    } else if (action === "PACKED") {
      for (const orderId of ids) {
        const updatedOrder = await prisma.dispatchOrder.update({
          where: { id: orderId, companyId: session.companyId },
          data: { status: "packed" },
        });
        results.push(updatedOrder);
      }
    } else {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    revalidatePath("/orders/dispatch", "page");
    revalidatePath("/orders/supply-outwards", "page");
    revalidatePath("/inventory", "page");
    revalidateTag("inventory", "default");

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error("[DISPATCH BULK UPDATE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
