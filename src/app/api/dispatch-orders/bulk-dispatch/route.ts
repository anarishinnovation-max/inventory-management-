export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InventoryService } from "@/lib/inventory-service";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderIds } = await request.json();

    if (!orderIds || !orderIds.length) {
      return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    // Process each order dispatch
    // We do this in a loop, but each dispatchGoods handles its own transaction internally
    // If we want it to be "one go", we could wrap it in another transaction, 
    // but dispatchGoods already uses a transaction.
    
    const results = [];
    for (const orderId of orderIds) {
      const result = await InventoryService.dispatchGoods(orderId);
      results.push(result);
    }

    return NextResponse.json({ message: `Successfully dispatched ${results.length} orders`, results });
  } catch (error: any) {
    console.error("Bulk dispatch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
