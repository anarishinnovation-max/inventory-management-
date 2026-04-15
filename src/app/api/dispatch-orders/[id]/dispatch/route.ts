import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dispatchId } = await params;
    const order = await InventoryService.dispatchGoods(dispatchId);

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
