import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, reason } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    await InventoryService.bulkScrapInventory(ids, session.companyId, reason, session.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[BULK_SCRAP_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
