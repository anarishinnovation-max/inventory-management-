import { InventoryService } from "@/lib/inventory-service";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await InventoryService.cancelDispatchOrder(id);
    return NextResponse.json({ message: "Order cancelled successfully", order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
