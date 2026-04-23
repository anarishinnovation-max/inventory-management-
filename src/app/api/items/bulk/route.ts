import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    await InventoryService.bulkDeleteItems(ids);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[BULK_DELETE_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
