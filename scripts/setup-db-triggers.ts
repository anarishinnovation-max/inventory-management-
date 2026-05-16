import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting database trigger setup for Inventory Parity...");

  try {
    // 1. Create the sync function
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fn_sync_inventory_available()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Recalculate total available quantity from all racks for this item
        UPDATE "Inventory"
        SET "quantityAvailable" = COALESCE((
          SELECT SUM(quantity)
          FROM "Stock"
          WHERE "itemId" = COALESCE(NEW."itemId", OLD."itemId")
        ), 0),
        "updatedAt" = NOW()
        WHERE "itemId" = COALESCE(NEW."itemId", OLD."itemId");
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("✅ Function 'fn_sync_inventory_available' created/updated.");

    // 2. Drop existing trigger if it exists to avoid duplication
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trg_stock_inventory_sync ON "Stock";
    `);

    // 3. Create the trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trg_stock_inventory_sync
      AFTER INSERT OR UPDATE OR DELETE ON "Stock"
      FOR EACH ROW
      EXECUTE FUNCTION fn_sync_inventory_available();
    `);

    console.log("✅ Trigger 'trg_stock_inventory_sync' created successfully.");

    // 4. Initial Sync (optional but recommended to fix any existing drift)
    console.log("🔄 Running initial reconciliation sync...");
    await prisma.$executeRawUnsafe(`
      UPDATE "Inventory" inv
      SET "quantityAvailable" = COALESCE((
        SELECT SUM(s.quantity)
        FROM "Stock" s
        WHERE s."itemId" = inv."itemId"
      ), 0);
    `);
    
    console.log("✨ Database-level parity triggers are now active!");

  } catch (error) {
    console.error("❌ Error setting up triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
