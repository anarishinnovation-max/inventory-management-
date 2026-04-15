import pool from "@/lib/db";
import { TransactionType } from "@/lib/types";

interface TransactionParams {
  itemId: string;
  rackId: string;
  userId: string;
  type: TransactionType;
  quantity: number;
  customerId?: string;
  vendorId?: string;
  remarks?: string;
}

/**
 * Processes a stock transaction and updates inventory levels atomically using pg.Pool.
 * Ensures that stock cannot go negative for OUTWARD transactions.
 */
export async function processTransaction(params: TransactionParams) {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // 1. Get current stock for this item/rack with an exclusive lock
    const stockQuery = await client.query(`
      SELECT quantity FROM "Stock"
      WHERE "itemId" = $1 AND "rackId" = $2
      FOR UPDATE
    `, [params.itemId, params.rackId]);

    const currentQty = stockQuery.rows.length > 0 ? stockQuery.rows[0].quantity : 0;
    let newQty = currentQty;

    // 2. Calculate new quantity based on transaction type
    switch (params.type) {
      case TransactionType.INWARD:
      case TransactionType.RETURN:
        newQty += params.quantity;
        break;
      case TransactionType.OUTWARD:
        if (currentQty < params.quantity) {
          throw new Error("Insufficient stock in the specified rack location.");
        }
        newQty -= params.quantity;
        break;
      case TransactionType.ADJUSTMENT:
        newQty += params.quantity;
        if (newQty < 0) throw new Error("Stock cannot be adjusted below zero.");
        break;
    }

    // 3. Update or Create stock record
    await client.query(`
      INSERT INTO "Stock" ("itemId", "rackId", quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT ("itemId", "rackId")
      DO UPDATE SET quantity = EXCLUDED.quantity, "updatedAt" = CURRENT_TIMESTAMP
    `, [params.itemId, params.rackId, newQty]);

    // 4. Create transaction log entry
    const logQuery = await client.query(`
      INSERT INTO "Transaction" ("itemId", "rackId", "userId", type, quantity, "customerId", "vendorId", remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      params.itemId, 
      params.rackId, 
      params.userId, 
      params.type, 
      params.quantity, 
      params.customerId || null, 
      params.vendorId || null, 
      params.remarks || null
    ]);

    await client.query("COMMIT");
    return logQuery.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
