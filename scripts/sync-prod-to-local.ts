import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

// CONFIGURATION
const SOURCE_URL = "postgres://dcdacf0eb3c643e41841da80d14f3074ceaaf138884b4013a42a00ee617c3864:sk_CtFnWtZGMbiXsfEPsc7E3@db.prisma.io:5432/postgres?sslmode=require";
const TARGET_URL = process.env.DATABASE_URL;

if (!TARGET_URL) {
    console.error("❌ Local DATABASE_URL not found in .env");
    process.exit(1);
}

const sourcePool = new Pool({ connectionString: SOURCE_URL });
const targetPool = new Pool({ connectionString: TARGET_URL });

async function syncProdToLocal() {
    console.log("🚀 Starting Production -> Local Data Sync");
    console.log("⚠️  This will wipe your local database and replace it with production data.");

    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();

    try {
        await targetClient.query('BEGIN');

        // 1. Wipe Local Tables (In correct order)
        console.log("\n🧹 Wiping local tables...");
        const tablesToWipe = [
            'InventoryTransaction', 'InventoryBatch', 'Inventory',
            'Stock', 'POLineItem', 'PurchaseOrder', 'DispatchItem', 'DispatchOrder',
            'Item', 'Category', 'Rack', 'Vendor', 'Customer', 'User'
        ];
        for (const table of tablesToWipe) {
            await targetClient.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        }

        // 2. Sync Users
        console.log("\n👤 Syncing Users...");
        const users = await sourceClient.query('SELECT * FROM "User"');
        const usernameMap = new Map();
        for (const user of users.rows) {
            let uname = user.username;
            if (usernameMap.has(uname)) uname = `${uname}_${user.id.slice(0, 4)}`;
            usernameMap.set(uname, true);

            await targetClient.query(
                'INSERT INTO "User" (id, username, password, name, role, "role_id", "emailAlerts", "twoFactorEnabled", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [user.id, uname, user.password, user.name || user.fullName || "User", user.role, user.roleId || user.role_id, user.emailAlerts || false, user.twoFactorEnabled || false, user.createdAt]
            );
        }

        // 3. Sync & Merge Categories
        const categoryMap = await syncAndMerge(sourceClient, targetClient, 'Category', 'name', ['id', 'name']);

        // 4. Sync & Merge Racks
        const rackMap = await syncAndMerge(sourceClient, targetClient, 'Rack', 'rackNumber', ['id', 'rackNumber', 'zone']);

        // 5. Sync & Merge Vendors
        const vendorMap = await syncAndMerge(sourceClient, targetClient, 'Vendor', 'name', ['id', 'name', 'contact', 'email', 'preferredPaymentMode']);

        // 6. Sync & Merge Customers
        const customerMap = await syncAndMerge(sourceClient, targetClient, 'Customer', 'name', ['id', 'name', 'email', 'contact', 'address']);

        // 7. Sync Items
        console.log("\n📦 Syncing Items...");
        const items = await sourceClient.query('SELECT * FROM "Item"');
        const skuMap = new Map();
        for (const item of items.rows) {
            let sku = item.sku;
            if (skuMap.has(sku)) sku = `${sku}_${item.id.slice(0, 4)}`;
            skuMap.set(sku, true);

            const categoryId = categoryMap.get(item.categoryId) || item.categoryId;

            await targetClient.query(
                'INSERT INTO "Item" (id, name, sku, "categoryId", unit, "minStockLevel", "isCritical", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [item.id, item.name, sku, categoryId, item.unit, item.minStockLevel, item.isCritical || false, item.createdAt]
            );
        }

        // 8. Sync Inventory
        console.log("\n🧪 Syncing Inventory...");
        const invs = await sourceClient.query('SELECT * FROM "Inventory"');
        for (const inv of invs.rows) {
            await targetClient.query(
                'INSERT INTO "Inventory" (id, "itemId", "quantityAvailable", "incomingQty", "quantityReserved", "quantityInTransit", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [inv.id, inv.itemId, inv.quantityAvailable, inv.incomingQty, inv.quantityReserved, inv.quantityInTransit, inv.updatedAt || new Date()]
            );
        }

        // 9. Sync Stocks
        console.log("\n🏗️ Syncing Stocks...");
        const stocks = await sourceClient.query('SELECT * FROM "Stock"');
        for (const s of stocks.rows) {
            const rackId = rackMap.get(s.rackId) || s.rackId;
            await targetClient.query(
                'INSERT INTO "Stock" (id, "itemId", "rackId", quantity, "updatedAt") VALUES ($1, $2, $3, $4, $5)',
                [s.id, s.itemId, rackId, s.quantity, s.updatedAt || new Date()]
            );
        }

        // 10. Sync Purchase Orders & Items
        console.log("\n📜 Syncing Purchase Orders...");
        const pos = await sourceClient.query('SELECT * FROM "PurchaseOrder"');
        for (const po of pos.rows) {
            const vId = vendorMap.get(po.vendorId) || po.vendorId;
            await targetClient.query(
                'INSERT INTO "PurchaseOrder" (id, "vendorId", status, "orderDate", "expectedDelivery", "paymentMode", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [po.id, vId, po.status, po.orderDate, po.expectedDelivery, po.paymentMode, po.createdAt || new Date()]
            );
        }
        const poLines = await sourceClient.query('SELECT * FROM "POLineItem"');
        for (const pol of poLines.rows) {
            await targetClient.query(
                'INSERT INTO "POLineItem" (id, "purchaseOrderId", "itemId", "quantityOrdered", "quantityReceived", "costPrice") VALUES ($1, $2, $3, $4, $5, $6)',
                [pol.id, pol.purchaseOrderId, pol.itemId, pol.quantityOrdered, pol.quantityReceived, pol.costPrice]
            );
        }

        // 11. Sync Dispatch Orders & Items
        console.log("\n🚚 Syncing Dispatch Orders...");
        const dos = await sourceClient.query('SELECT * FROM "DispatchOrder"');
        for (const doRec of dos.rows) {
            const cId = customerMap.get(doRec.customerId) || doRec.customerId;
            await targetClient.query(
                'INSERT INTO "DispatchOrder" (id, "customerId", status, "orderDate", "expectedDelivery", "paymentMode", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [doRec.id, cId, doRec.status, doRec.orderDate, doRec.expectedDelivery, doRec.paymentMode, doRec.createdAt || new Date()]
            );
        }
        const doItems = await sourceClient.query('SELECT * FROM "DispatchItem"');
        for (const doi of doItems.rows) {
            await targetClient.query(
                'INSERT INTO "DispatchItem" (id, "dispatchOrderId", "itemId", quantity, "sellingPrice") VALUES ($1, $2, $3, $4, $5)',
                [doi.id, doi.dispatchOrderId, doi.itemId, doi.quantity, doi.sellingPrice]
            );
        }

        // 12. Sync Inventory Batches
        console.log("\n📦 Syncing Batches...");
        const batches = await sourceClient.query('SELECT * FROM "InventoryBatch"');
        for (const b of batches.rows) {
            const vId = vendorMap.get(b.vendorId) || b.vendorId;
            await targetClient.query(
                'INSERT INTO "InventoryBatch" (id, "inventoryId", "vendorId", quantity, "remainingQty", "costPerUnit", "purchaseDate", "purchaseOrderId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [b.id, b.inventoryId, vId, b.quantity, b.remainingQty, b.costPerUnit, b.purchaseDate, b.purchaseOrderId, b.createdAt || new Date()]
            );
        }

        // 13. Sync Inventory Transactions
        console.log("\n💸 Syncing Transactions...");
        const txs = await sourceClient.query('SELECT * FROM "InventoryTransaction"');
        for (const tx of txs.rows) {
            const rId = rackMap.get(tx.rackId) || tx.rackId;
            const vId = vendorMap.get(tx.vendorId) || tx.vendorId;
            const cId = customerMap.get(tx.customerId) || tx.customerId;

            await targetClient.query(
                'INSERT INTO "InventoryTransaction" (id, type, "itemId", quantity, "rackId", "vendorId", "customerId", "userId", "createdAt", "referenceType", "referenceId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                [tx.id, tx.type, tx.itemId, tx.quantity, rId, vId, cId, tx.userId, tx.createdAt || new Date(), tx.referenceType, tx.referenceId]
            );
        }

        await targetClient.query('COMMIT');
        console.log("\n✅ Sync COMPLETED successfully! Your local DB is now a copy of production.");

    } catch (error) {
        await targetClient.query('ROLLBACK');
        console.error("\n❌ Sync FAILED:", error);
    } finally {
        sourceClient.release();
        targetClient.release();
        await sourcePool.end();
        await targetPool.end();
    }
}

async function syncAndMerge(sourceClient: any, targetClient: any, table: string, uniqueField: string, columns: string[]) {
    console.log(`\n🔄 Syncing & Merging ${table}s...`);
    const records = await sourceClient.query(`SELECT * FROM "${table}"`);
    const masterMap = new Map();
    const idMap = new Map();

    for (const record of records.rows) {
        const val = record[uniqueField];
        if (masterMap.has(val)) {
            idMap.set(record.id, masterMap.get(val));
            console.log(`   🔸 Merging duplicate ${table} "${val}" (ID: ${record.id} -> ${masterMap.get(val)})`);
        } else {
            masterMap.set(val, record.id);
            idMap.set(record.id, record.id);
            
            const colNames = columns.map(c => `"${c}"`).join(", ");
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
            const values = columns.map(c => record[c]);

            await targetClient.query(`INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`, values);
        }
    }
    return idMap;
}

syncProdToLocal();
