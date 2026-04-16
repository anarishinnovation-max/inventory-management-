import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inventory = await prisma.inventory.findUnique({
      where: { itemId: id },
      include: {
        batches: {
          include: { vendor: true },
          orderBy: { purchaseDate: "desc" },
        },
      },
    });

    if (!inventory) {
      return NextResponse.json([]);
    }

    const breakdown = inventory.batches.map((batch: any) => ({
      vendor: batch.vendor?.name || "Unknown",
      quantity: batch.quantity,
      remainingQty: batch.remainingQty,
      costPerUnit: batch.costPerUnit,
      purchaseDate: batch.purchaseDate,
      purchaseOrderId: batch.purchaseOrderId,
    }));

    return NextResponse.json(breakdown);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
