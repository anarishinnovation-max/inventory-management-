import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const query = `
      SELECT 
        i.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'quantity', s.quantity,
              'rackId', r.id,
              'rackName', r."rackName",
              'shelf', r.shelf,
              'bin', r.bin
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as stocks
      FROM "Item" i
      LEFT JOIN "Stock" s ON i.id = s."itemId"
      LEFT JOIN "Rack" r ON s."rackId" = r.id
      WHERE i.id = $1
      GROUP BY i.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Item fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, sku, category, unit, minStockLevel, isCritical } = body;

    // Check if item exists
    const checkResult = await pool.query(`SELECT 1 FROM "Item" WHERE id = $1`, [id]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check for SKU uniqueness (excluding current item)
    const skuCheck = await pool.query(`
      SELECT 1 FROM "Item" WHERE sku = $1 AND id != $2
    `, [sku, id]);

    if (skuCheck.rows.length > 0) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const result = await pool.query(`
      UPDATE "Item"
      SET 
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        category = COALESCE($3, category),
        unit = COALESCE($4, unit),
        "minStockLevel" = COALESCE($5, "minStockLevel"),
        "isCritical" = COALESCE($6, "isCritical"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, sku, category, unit, minStockLevel, isCritical, id]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Item update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check for associated stock records
    const stockCheck = await pool.query(`
      SELECT 1 FROM "Stock" WHERE "itemId" = $1 LIMIT 1
    `, [id]);

    if (stockCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete item with existing stock records. Please clear stock first." 
      }, { status: 400 });
    }

    const result = await pool.query(`
      DELETE FROM "Item" WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Item delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
