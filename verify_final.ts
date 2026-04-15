import pool from "./src/lib/db";

async function verifyStock() {
  try {
    const transactions = await pool.query(`
      SELECT t.type, t.quantity, i.name as "itemName", r."rackName"
      FROM "Transaction" t
      JOIN "Item" i ON t."itemId" = i.id
      JOIN "Rack" r ON t."rackId" = r.id
      WHERE t.type = 'ADJUSTMENT'
      ORDER BY t."createdAt" DESC
      LIMIT 5
    `);
    console.log("Recent ADJUSTMENT transactions:", JSON.stringify(transactions.rows, null, 2));

    const stock = await pool.query(`
      SELECT i.name, r."rackName", s.quantity
      FROM "Stock" s
      JOIN "Item" i ON s."itemId" = i.id
      JOIN "Rack" r ON s."rackId" = r.id
      WHERE s.quantity > 0
      LIMIT 10
    `);
    console.log("Current Stock Levels:", JSON.stringify(stock.rows, null, 2));

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

verifyStock();
