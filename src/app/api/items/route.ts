import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, category, unit, minStockLevel, isCritical } = body;

    if (!name || !sku || !category || !unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for unique SKU
    const existing = await pool.query(`SELECT 1 FROM "Item" WHERE sku = $1 LIMIT 1`, [sku]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      INSERT INTO "Item" (name, sku, category, unit, "minStockLevel", "isCritical")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, sku, category, unit, parseInt(minStockLevel), isCritical]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Item creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
