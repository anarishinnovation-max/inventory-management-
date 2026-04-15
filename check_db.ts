import pool from "./src/lib/db";

async function checkItems() {
  try {
    const result = await pool.query('SELECT name, sku FROM "Item"');
    console.log("Current Items:", JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

checkItems();
