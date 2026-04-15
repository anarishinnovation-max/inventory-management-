import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT * FROM "Rack" ORDER BY "rackName" ASC, shelf ASC, bin ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Rack fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
