import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;
    const { rackId, quantity, remarks } = await request.json();

    if (!rackId || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await InventoryService.updateStock(
        itemId, 
        rackId, 
        parseFloat(quantity), 
        session.id,
        remarks
    );

    return NextResponse.json({ 
        message: "Stock updated successfully", 
        newQuantity: result.newQuantity 
    });
  } catch (error: any) {
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
