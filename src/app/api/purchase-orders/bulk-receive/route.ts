import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { selections } = (await request.json()) as { 
      selections: Array<{ poId: string, itemId: string, receivedQty: number }> 
    };

    if (!selections || !selections.length) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    // Group by PO ID for InventoryService compatibility
    const grouped = selections.reduce((acc, curr) => {
      if (!acc[curr.poId]) acc[curr.poId] = [];
      acc[curr.poId].push({ itemId: curr.itemId, receivedQty: curr.receivedQty });
      return acc;
    }, {} as Record<string, Array<{ itemId: string, receivedQty: number }>>);

    const results = [];
    for (const [poId, items] of Object.entries(grouped)) {
      const updatedPo = await InventoryService.receiveGoods(poId, items, session.id);
      results.push(updatedPo);
      revalidatePath(`/orders/purchase/${poId}`, "page");
    }

    revalidatePath("/orders/supply-inwards", "page");
    revalidatePath("/orders/purchase", "page");
    revalidatePath("/inventory", "page");
    revalidateTag("inventory", "default");

    return NextResponse.json({ success: true, count: selections.length });
  } catch (error: any) {
    console.error("[BULK RECEIVE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
