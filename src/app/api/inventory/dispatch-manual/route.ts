import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, rackId, quantity, customerId, remarks } = body;

    if (!itemId || !rackId || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await InventoryService.dispatchManual({
      itemId,
      rackId,
      quantity,
      customerId,
      remarks,
      userId: session.id
    });

    return NextResponse.json({ 
      success: true, 
      message: "Manual dispatch completed successfully",
      transaction: result 
    });
  } catch (error: any) {
    console.error("[MANUAL_DISPATCH_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
