import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: poId } = await params;
  try {
    const { items } = await request.json();
    const session = await getSession();

    if (!items || !items.length) {
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    const updatedPo = await InventoryService.receiveGoods(poId, items, session?.id);
    
    revalidatePath("/inventory", "page");
    revalidatePath("/orders/purchase", "page");
    revalidatePath("/orders/supply-inwards", "page");
    revalidatePath(`/orders/purchase/${poId}`, "page");
    revalidateTag("inventory", "default");

    return NextResponse.json(updatedPo);
  } catch (error: any) {
    console.error(`[PO RECEIVE ERROR] ID: ${poId}`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
