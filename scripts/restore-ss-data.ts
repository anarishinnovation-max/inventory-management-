import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

// CONFIGURATION
const SOURCE_URL = "postgres://dcdacf0eb3c643e41841da80d14f3074ceaaf138884b4013a42a00ee617c3864:sk_CtFnWtZGMbiXsfEPsc7E3@db.prisma.io:5432/postgres?sslmode=require";
const TARGET_URL = process.env.DATABASE_URL;
const TARGET_COMPANY_ID = "ss-cuttings-id";

if (!TARGET_URL) {
    console.error("❌ Local DATABASE_URL not found in .env");
    process.exit(1);
}

const sourcePool = new Pool({ connectionString: SOURCE_URL });
const targetPool = new Pool({ connectionString: TARGET_URL });

async function restoreSSData() {
    console.log("🚀 Restoring SS Cuttings Profiles (Items) from Production...");
    
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();

    try {
        await targetClient.query('BEGIN');

        // 0. Ensure Company exists
        console.log(`\n🏢 Ensuring Company "${TARGET_COMPANY_ID}" exists...`);
        await targetClient.query(
            'INSERT INTO "Company" (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2',
            [TARGET_COMPANY_ID, "SS Cuttings Tool"]
        );

        // 1. Wipe Local Tables (In correct order)
        console.log("🧹 Wiping local tables for fresh restore...");
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
        for (const user of users.rows) {
            // Map old role to UserRole enum
            let role = "EMPLOYEE";
            if (user.role?.toUpperCase() === "OWNER" || user.username === "admin") role = "OWNER";
            else if (user.role?.toUpperCase() === "MANAGER") role = "MANAGER";

            await targetClient.query(
                'INSERT INTO "User" (id, username, password, name, role, "companyId", "emailAlerts", "twoFactorEnabled", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [user.id, user.username, user.password, user.name || "User", role, TARGET_COMPANY_ID, user.emailAlerts || false, user.twoFactorEnabled || false, user.createdAt]
            );
        }

        // 3. Sync Categories
        console.log("\n📂 Syncing Categories...");
        const categories = await sourceClient.query('SELECT * FROM "Category"');
        const categoryMap = new Map();
        for (const cat of categories.rows) {
            await targetClient.query(
                'INSERT INTO "Category" (id, name, "companyId") VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                [cat.id, cat.name, TARGET_COMPANY_ID]
            );
            categoryMap.set(cat.id, cat.id);
        }

        // 4. Sync Racks
        console.log("\n🏗️ Syncing Racks...");
        const racks = await sourceClient.query('SELECT * FROM "Rack"');
        const rackMap = new Map();
        for (const rack of racks.rows) {
            await targetClient.query(
                'INSERT INTO "Rack" (id, "rackNumber", zone, "companyId") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [rack.id, rack.rackNumber, rack.zone, TARGET_COMPANY_ID]
            );
            rackMap.set(rack.id, rack.id);
        }

        // 5. Sync Vendors
        console.log("\n🤝 Syncing Vendors...");
        const vendors = await sourceClient.query('SELECT * FROM "Vendor"');
        for (const v of vendors.rows) {
            await targetClient.query(
                'INSERT INTO "Vendor" (id, name, contact, email, "preferredPaymentMode", "companyId") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [v.id, v.name, v.contact, v.email, v.preferredPaymentMode, TARGET_COMPANY_ID]
            );
        }

        // 6. Sync Customers
        console.log("\n👥 Syncing Customers...");
        const customers = await sourceClient.query('SELECT * FROM "Customer"');
        for (const c of customers.rows) {
            await targetClient.query(
                'INSERT INTO "Customer" (id, name, email, contact, address, "companyId") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [c.id, c.name, c.email, c.contact, c.address, TARGET_COMPANY_ID]
            );
        }

        // 7. Sync Items
        console.log("\n📦 Syncing Items...");
        const items = await sourceClient.query('SELECT * FROM "Item"');
        for (const item of items.rows) {
            await targetClient.query(
                'INSERT INTO "Item" (id, name, sku, "categoryId", unit, "minStockLevel", "isCritical", "companyId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [item.id, item.name, item.sku, item.categoryId, item.unit, item.minStockLevel || 0, item.isCritical || false, TARGET_COMPANY_ID, item.createdAt]
            );
        }

        // 8. Sync Inventory
        console.log("\n🧪 Syncing Inventory...");
        const invs = await sourceClient.query('SELECT * FROM "Inventory"');
        for (const inv of invs.rows) {
            await targetClient.query(
                'INSERT INTO "Inventory" (id, "itemId", "quantityAvailable", "incomingQty", "quantityReserved", "quantityInTransit", "companyId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [inv.id, inv.itemId, inv.quantityAvailable, inv.incomingQty, inv.quantityReserved, inv.quantityInTransit, TARGET_COMPANY_ID, inv.updatedAt || new Date()]
            );
        }

        // 9. Sync Stocks
        console.log("\n🏗️ Syncing Stocks...");
        const stocks = await sourceClient.query('SELECT * FROM "Stock"');
        for (const s of stocks.rows) {
            await targetClient.query(
                'INSERT INTO "Stock" (id, "itemId", "rackId", quantity, "companyId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
                [s.id, s.itemId, s.rackId, s.quantity, TARGET_COMPANY_ID, s.updatedAt || new Date()]
            );
        }

        // 10. Sync Purchase Orders
        console.log("\n📜 Syncing Purchase Orders...");
        const pos = await sourceClient.query('SELECT * FROM "PurchaseOrder"');
        for (const po of pos.rows) {
            await targetClient.query(
                'INSERT INTO "PurchaseOrder" (id, "vendorId", status, "orderDate", "expectedDelivery", "paymentMode", "companyId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [po.id, po.vendorId, po.status, po.orderDate, po.expectedDelivery, po.paymentMode, TARGET_COMPANY_ID, po.createdAt || new Date()]
            );
        }
        const poLines = await sourceClient.query('SELECT * FROM "POLineItem"');
        for (const pol of poLines.rows) {
            await targetClient.query(
                'INSERT INTO "POLineItem" (id, "purchaseOrderId", "itemId", "quantityOrdered", "quantityReceived", "costPrice") VALUES ($1, $2, $3, $4, $5, $6)',
                [pol.id, pol.purchaseOrderId, pol.itemId, pol.quantityOrdered, pol.quantityReceived, pol.costPrice]
            );
        }

        // 11. Sync Dispatch Orders
        console.log("\n🚚 Syncing Dispatch Orders...");
        const dos = await sourceClient.query('SELECT * FROM "DispatchOrder"');
        for (const doRec of dos.rows) {
            await targetClient.query(
                'INSERT INTO "DispatchOrder" (id, "customerId", status, "orderDate", "expectedDelivery", "paymentMode", "companyId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [doRec.id, doRec.customerId, doRec.status, doRec.orderDate, doRec.expectedDelivery, doRec.paymentMode, TARGET_COMPANY_ID, doRec.createdAt || new Date()]
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
            await targetClient.query(
                'INSERT INTO "InventoryBatch" (id, "inventoryId", "vendorId", quantity, "remainingQty", "costPerUnit", "purchaseDate", "purchaseOrderId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [b.id, b.inventoryId, b.vendorId, b.quantity, b.remainingQty, b.costPerUnit, b.purchaseDate, b.purchaseOrderId, b.createdAt || new Date()]
            );
        }

        // 13. Sync Inventory Transactions
        console.log("\n💸 Syncing Transactions...");
        const txs = await sourceClient.query('SELECT * FROM "InventoryTransaction"');
        for (const tx of txs.rows) {
            await targetClient.query(
                'INSERT INTO "InventoryTransaction" (id, type, "itemId", quantity, "rackId", "vendorId", "customerId", "userId", "companyId", "createdAt", "referenceType", "referenceId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                [tx.id, tx.type, tx.itemId, tx.quantity, tx.rackId, tx.vendorId, tx.customerId, tx.userId, TARGET_COMPANY_ID, tx.createdAt || new Date(), tx.referenceType, tx.referenceId]
            );
        }

        await targetClient.query('COMMIT');
        console.log("\n✅ Data Restore COMPLETED successfully!");
        console.log(`🎉 All ${items.rows.length} items and related data are now back in "SS Cuttings Tool".`);

    } catch (error) {
        await targetClient.query('ROLLBACK');
        console.error("\n❌ Restore FAILED:", error);
    } finally {
        sourceClient.release();
        targetClient.release();
        await sourcePool.end();
        await targetPool.end();
    }
}

restoreSSData();
