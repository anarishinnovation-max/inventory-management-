import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processTransaction } from "@/lib/transactions";
import { TransactionType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, rackId, quantity, customerId, remarks } = await request.json();

    if (!itemId || !rackId || !quantity) {
      return NextResponse.json(
        { error: "Insufficient details for dispatch" },
        { status: 400 }
      );
    }

    const result = await processTransaction({
      itemId,
      rackId,
      userId: session.id,
      type: TransactionType.OUTWARD,
      quantity: Math.abs(quantity),
      customerId,
      remarks: remarks || "Customer dispatch fulfillment",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Dispatch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process dispatch" },
      { status: 400 }
    );
  }
}
