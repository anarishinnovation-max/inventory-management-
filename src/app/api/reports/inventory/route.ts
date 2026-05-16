import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await prisma.inventory.findMany({
      where: {
        item: {
          companyId: session.companyId
        }
      },
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
      const total = Number(inv.quantityAvailable || 0);
      const incoming = Number(inv.incomingQty || 0) + Number(inv.quantityInTransit || 0);
      const reserved = Number(inv.quantityReserved || 0);
      const netAvailable = (total + incoming) - reserved;
      const minStock = Number(inv.item.minStockLevel || 0);

      let status = "In Stock";
      if (total <= 0) {
        status = "Out of Stock";
      } else if (netAvailable < 0) {
        status = "Urgent Reorder";
      } else if (total <= minStock) {
        status = "Low Stock";
      } else if (incoming > 0) {
        status = "Ordered";
      }

      const row = [
        inv.item.sku,
        inv.item.name.replace(/,/g, ""), // Remove commas to prevent CSV breaking
        inv.item.category?.name || "N/A",
        inv.quantityAvailable,
        inv.incomingQty,
        inv.quantityReserved,
        inv.item.minStockLevel,
        status
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
