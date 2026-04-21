import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

// Configuration
const connectionString = process.env.DATABASE_URL;
const DRY_RUN = process.env.DRY_RUN === 'true' || true; // DEFAULT TO DRY RUN FOR SAFETY

if (!connectionString) {
  console.error("❌ DATABASE_URL not found in environment variables.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function mergeProductionData() {
  console.log(`🚀 Starting Production Data Merge (${DRY_RUN ? 'DRY RUN' : 'FOR REAL'})`);
  const client = await pool.connect();

  try {
    if (!DRY_RUN) await client.query('BEGIN');

    // 1. Deduplicate Users (Renaming)
    console.log("\n👤 Deduplicating Users...");
    const userDuplicates = await client.query(`
      SELECT username, COUNT(*) 
      FROM "User" 
      GROUP BY username 
      HAVING COUNT(*) > 1
    `);

    for (const row of userDuplicates.rows) {
      const { username } = row;
      const users = await client.query(`
        SELECT u.id, u.username, t.subdomain 
        FROM "User" u
        LEFT JOIN "Tenant" t ON u."tenantId" = t.id
        WHERE u.username = $1
        ORDER BY u."createdAt" ASC
      `, [username]);

      // Keep the first user as 'username', rename others
      for (let i = 1; i < users.rows.length; i++) {
        const user = users.rows[i];
        const newUsername = `${user.username}_${user.subdomain || i}`;
        console.log(`   🔸 Renaming User: ${user.username} (ID: ${user.id}) -> ${newUsername}`);
        if (!DRY_RUN) {
          await client.query('UPDATE "User" SET username = $1 WHERE id = $2', [newUsername, user.id]);
        }
      }
    }

    // 2. Merge Categories
    await mergeModel(client, 'Category', 'name', ['Item'], 'categoryId');

    // 3. Merge Racks
    await mergeModel(client, 'Rack', 'rackNumber', ['Stock', 'InventoryTransaction'], 'rackId');

    // 4. Merge Vendors
    await mergeModel(client, 'Vendor', 'name', ['PurchaseOrder', 'InventoryTransaction', 'InventoryBatch'], 'vendorId');

    // 5. Merge Customers
    await mergeModel(client, 'Customer', 'name', ['DispatchOrder', 'InventoryTransaction'], 'customerId');

    // 6. Deduplicate Item SKUs
    console.log("\n📦 Deduplicating Item SKUs...");
    const skuDuplicates = await client.query(`
      SELECT sku, COUNT(*) 
      FROM "Item" 
      GROUP BY sku 
      HAVING COUNT(*) > 1
    `);

    for (const row of skuDuplicates.rows) {
      const { sku } = row;
      const items = await client.query(`
        SELECT i.id, i.sku, t.subdomain 
        FROM "Item" i
        LEFT JOIN "Tenant" t ON i."tenantId" = t.id
        WHERE i.sku = $1
        ORDER BY i."createdAt" ASC
      `, [sku]);

      for (let i = 1; i < items.rows.length; i++) {
        const item = items.rows[i];
        const newSku = `${item.sku}_${item.subdomain || i}`;
        console.log(`   🔸 Renaming Item SKU: ${item.sku} (ID: ${item.id}) -> ${newSku}`);
        if (!DRY_RUN) {
          await client.query('UPDATE "Item" SET sku = $1 WHERE id = $2', [newSku, item.id]);
        }
      }
    }

    if (!DRY_RUN) {
      await client.query('COMMIT');
      console.log("\n✅ Merging completed successfully!");
    } else {
      console.log("\n👀 DRY RUN COMPLETED. No changes were saved. Run with DRY_RUN=false to apply.");
    }

  } catch (error) {
    if (!DRY_RUN) await client.query('ROLLBACK');
    console.error("\n❌ Error during merging:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Generic function to merge duplicate records and re-link relations
 */
async function mergeModel(client: any, table: string, uniqueField: string, dependentTables: string[], foreignKey: string) {
  console.log(`\n🔄 Merging ${table}s based on ${uniqueField}...`);
  const duplicates = await client.query(`
    SELECT "${uniqueField}", COUNT(*) 
    FROM "${table}" 
    GROUP BY "${uniqueField}" 
    HAVING COUNT(*) > 1
  `);

  for (const row of duplicates.rows) {
    const value = row[uniqueField];
    const records = await client.query(`
      SELECT id, "${uniqueField}" 
      FROM "${table}" 
      WHERE "${uniqueField}" = $1
      ORDER BY "id" ASC
    `, [value]);

    const masterId = records.rows[0].id;
    const duplicateIds = records.rows.slice(1).map((r: any) => r.id);

    console.log(`   🔹 Found ${records.rows.length} duplicates for ${table} "${value}". Merging into Master ID: ${masterId}`);

    for (const depTable of dependentTables) {
      console.log(`      🔗 Re-linking ${depTable} records...`);
      if (!DRY_RUN) {
        await client.query(`
          UPDATE "${depTable}" 
          SET "${foreignKey}" = $1 
          WHERE "${foreignKey}" = ANY($2)
        `, [masterId, duplicateIds]);
      }
    }

    console.log(`      🗑️ Deleting ${duplicateIds.length} duplicate ${table} records...`);
    if (!DRY_RUN) {
      await client.query(`
        DELETE FROM "${table}" 
        WHERE id = ANY($1)
      `, [duplicateIds]);
    }
  }
}

mergeProductionData();
