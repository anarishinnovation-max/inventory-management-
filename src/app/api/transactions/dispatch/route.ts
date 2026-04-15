import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory-service";

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

    const result = await InventoryService.dispatchManual({
      itemId,
      rackId,
      userId: session.id,
      quantity: Math.abs(parseFloat(quantity)),
      customerId,
      remarks: remarks || "Manual physical stock dispatch",
    });

    return NextResponse.json({
        success: true,
        transactionId: result.id,
        message: "Manual dispatch processed and logged."
    });
  } catch (error: any) {
    console.error("Manual Dispatch API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process manual dispatch" },
      { status: 400 }
    );
  }
}
