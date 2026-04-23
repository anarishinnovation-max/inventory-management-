import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        item: {
          include: {
            category: true
          }
        },
        batches: {
          include: {
            vendor: true
          }
        }
      }
    });

    // Create CSV header
    let csv = "SKU,Item Name,Category,Quantity Available,Incoming Qty,Reserved Qty,Min Stock Level,Status\n";

    // Add rows
    inventory.forEach(inv => {
      const row = [
        inv.item.sku,
        inv.item.name.replace(/,/g, ""), // Remove commas to prevent CSV breaking
        inv.item.category?.name || "N/A",
        inv.quantityAvailable,
        inv.incomingQty,
        inv.quantityReserved,
        inv.item.minStockLevel,
        inv.status
      ];
      csv += row.join(",") + "\n";
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=inventory_report_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
