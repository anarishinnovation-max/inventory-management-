import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: itemId } = await params;
    const body = await request.json();
    const { rackId, quantity, remarks } = body;

    if (!rackId || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await client.query("BEGIN");

    // 1. Get current stock to calculate adjustment quantity for the transaction log
    const stockQuery = await client.query(`
      SELECT quantity FROM "Stock" WHERE "itemId" = $1 AND "rackId" = $2
    `, [itemId, rackId]);

    const oldQuantity = stockQuery.rows.length > 0 ? stockQuery.rows[0].quantity : 0;
    const adjustmentQty = quantity - oldQuantity;

    // 2. Upsert Stock
    if (stockQuery.rows.length > 0) {
      await client.query(`
        UPDATE "Stock" 
        SET quantity = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "itemId" = $2 AND "rackId" = $3
      `, [quantity, itemId, rackId]);
    } else {
      await client.query(`
        INSERT INTO "Stock" ("itemId", "rackId", quantity)
        VALUES ($1, $2, $3)
      `, [itemId, rackId, quantity]);
    }

    // 3. Create Transaction Log
    await client.query(`
      INSERT INTO "Transaction" ("itemId", "rackId", "userId", type, quantity, remarks)
      VALUES ($1, $2, $3, 'ADJUSTMENT', $4, $5)
    `, [itemId, rackId, session.id, adjustmentQty, remarks || "Manual Stock Adjustment"]);

    await client.query("COMMIT");

    return NextResponse.json({ message: "Stock updated successfully", newQuantity: quantity });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Stock update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
