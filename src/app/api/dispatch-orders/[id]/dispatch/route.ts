import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";
import { createActivityLog } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dispatchId } = await params;
    const body = await request.json().catch(() => ({}));
    const order = await InventoryService.dispatchGoods(dispatchId, {
      collectedBy: body.collectedBy,
      dispatchedBy: body.dispatchedBy,
      transportMode: body.transportMode
    });

    // Log Dispatch
    const session = await getSession();
    if (session) {
      await createActivityLog({
        actionType: "UPDATE",
        entityType: "DISPATCH_ORDER",
        entityId: dispatchId,
        performedBy: session.id,
        performedByName: session.username,
        companyId: session.companyId,
        newValue: {
          status: "dispatched",
          collectedBy: body.collectedBy,
          transportMode: body.transportMode
        }
      });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
