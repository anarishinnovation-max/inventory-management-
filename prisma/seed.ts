import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

// Inlined to reduce dependency on src/ during build
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL is not set in the environment.");
  process.exit(1);
}

// Log connection attempt (masked)
console.log(`Connecting to database: ${connectionString.split('@')[1] || 'URL masked'}`);

const isProduction = process.env.NODE_ENV === "production";
const poolConfig: any = {
  connectionString,
  max: 2, // Low limit for seeding
  idleTimeoutMillis: 30000,
};

if (isProduction || connectionString.includes("sslmode=")) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- DATE HELPERS ---
function getHistoricalDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * 5) - 1);
  date.setDate(Math.floor(Math.random() * 28) + 1);
  return date;
}
function getRecentDate() {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 3));
  return date;
}
function getFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 10) + 2);
  return date;
}

async function main() {
  console.log("🚀 INITIALIZING ULTIMATE BUSINESS SIMULATION (All Modules)...");

  // 0. Base Company
  await prisma.company.upsert({
    where: { id: "GLOBAL" },
    update: { name: "System Global Scope" },
    create: { id: "GLOBAL", name: "System Global Scope" },
  });

  const ssCuttings = await prisma.company.upsert({
    where: { id: "ss-cuttings-id" },
    update: { name: "SS Cuttings Tool" },
    create: { id: "ss-cuttings-id", name: "SS Cuttings Tool" },
  });
  const companyId = ssCuttings.id;

  // 1. Categories & Racks (with Zones)
  const categoriesList = ["B Clamp Tool Holder", "E Clamp Tool Holder", "CNC Boring Bar", "OD Grooving Tools", "Tool Spares B Clamp", "Carbide Inserts", "Milling Cutters", "Drilling Tools"];
  const categoryIds: string[] = [];
  for (const name of categoriesList) {
    const cat = await prisma.category.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    categoryIds.push(cat.id);
  }

  const racksList = [
    { num: "A1", zone: "MAIN HALL" }, { num: "A2", zone: "MAIN HALL" },
    { num: "B1", zone: "SHELF-B" }, { num: "B2", zone: "SHELF-B" },
    { num: "C1", zone: "BIN-C" }, { num: "AN1", zone: "SECURE" }
  ];
  const rackIds: string[] = [];
  for (const r of racksList) {
    const rack = await prisma.rack.upsert({
      where: { rackNumber_companyId: { rackNumber: r.num, companyId } },
      update: { zone: r.zone },
      create: { rackNumber: r.num, zone: r.zone, companyId },
    });
    rackIds.push(rack.id);
  }

  // 2. Vendors & Customers
  const vendors = ["SOHAM ENTERPRISES", "K K TOOLS", "V V TOOLS", "CNC TOOLS", "A K MACHINE", "YASH ENTERPRISES", "BHARAT PRECISION"];
  const vendorIds: string[] = [];
  for (const name of vendors) {
    const v = await prisma.vendor.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    vendorIds.push(v.id);
  }

  const customers = ["TATA MOTORS PUNE", "MAHINDRA & MAHINDRA", "BAJAJ AUTO LTD", "KIRLOSKAR ENGINES", "GODREJ PRECISION", "LARSEN & TOUBRO"];
  const customerIds: string[] = [];
  for (const name of customers) {
    const c = await prisma.customer.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    customerIds.push(c.id);
  }

  // 3. Users
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { companyId, name: "System Admin" },
    create: { username: "admin", password: hashedPassword, name: "System Admin", role: UserRole.OWNER, companyId }
  });
  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: { companyId, name: "Operations Manager" },
    create: { username: "manager", password: hashedPassword, name: "Operations Manager", role: UserRole.MANAGER, companyId }
  });

  // 4. Items (Generating 100+ for massive feel)
  console.log("📦 Generating 100+ Professional Industrial Items...");
  const itemIds: string[] = [];
  const itemPrices: Record<string, number> = {};
  for (let i = 1; i <= 100; i++) {
    const sku = `TOOL-${i.toString().padStart(3, '0')}`;
    const name = `${categoriesList[i % categoriesList.length]} Model-${i}`;
    const price = Math.floor(Math.random() * 2000) + 300;
    const isCritical = i % 10 === 0; // 10% items are critical

    const item = await prisma.item.upsert({
      where: { sku_companyId: { sku, companyId } },
      update: { isCritical, minStockLevel: 40 },
      create: { name, sku, unit: "PCS", categoryId: categoryIds[i % categoryIds.length], companyId, isCritical, minStockLevel: 40 }
    });
    itemIds.push(item.id);
    itemPrices[item.id] = price;

    await prisma.inventory.upsert({
      where: { itemId: item.id },
      update: {},
      create: { itemId: item.id, quantityAvailable: 0, companyId }
    });
  }

  // 5. TRANSACTIONAL ENGINE (500+ records across all types)
  console.log("⚡ Building Deep Transactional History (PO, SO, Batches, Activity)...");
  for (let i = 0; i < 500; i++) {
    const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
    const date = i < 450 ? getHistoricalDate() : getRecentDate();
    const isPurchase = Math.random() > 0.45;
    const qty = Math.floor(Math.random() * 60) + 10;
    const rackId = rackIds[Math.floor(Math.random() * rackIds.length)];

    if (isPurchase) {
      const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)];
      const status = i < 480 ? "COMPLETED" : "ORDERED"; // Most completed, some active
      
      const po = await prisma.purchaseOrder.create({
        data: {
          vendorId, status, companyId, createdAt: date,
          expectedDelivery: status === "ORDERED" ? getFutureDate() : null,
          items: { create: { itemId, quantityOrdered: qty, quantityReceived: status === "COMPLETED" ? qty : 0, costPrice: itemPrices[itemId] } }
        }
      });

      if (status === "COMPLETED") {
        const inv = await prisma.inventory.update({ where: { itemId }, data: { quantityAvailable: { increment: qty } } });
        await prisma.inventoryBatch.create({ data: { inventoryId: inv.id, vendorId, quantity: qty, remainingQty: qty, costPerUnit: itemPrices[itemId], purchaseDate: date, purchaseOrderId: po.id } });
        await prisma.inventoryTransaction.create({ data: { type: "PURCHASE", quantity: qty, itemId, vendorId, rackId, userId: admin.id, companyId, createdAt: date, referenceType: "PURCHASE_ORDER", referenceId: po.id } });
      } else {
        // Active Orders Card Logic
        await prisma.inventory.update({ where: { itemId }, data: { incomingQty: { increment: qty }, quantityInTransit: { increment: qty } } });
      }
    } else {
      // SALES
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const status = i < 480 ? "DISPATCHED" : "pending";

      const current = await prisma.inventory.findUnique({ where: { itemId } });
      if (current && current.quantityAvailable >= qty) {
        const so = await prisma.dispatchOrder.create({
          data: { customerId, status, companyId, createdAt: date, items: { create: { itemId, quantity: qty, sellingPrice: itemPrices[itemId] * 1.4 } } }
        });

        if (status === "DISPATCHED") {
          await prisma.inventory.update({ where: { itemId }, data: { quantityAvailable: { decrement: qty } } });
          await prisma.inventoryTransaction.create({ data: { type: "SALE", quantity: qty, itemId, customerId, rackId, userId: manager.id, companyId, createdAt: date, referenceType: "DISPATCH_ORDER", referenceId: so.id } });
        }
      }
    }

    // 6. ACTIVITY LOGS (Simulate user actions)
    if (i % 20 === 0) {
      await prisma.activityLog.create({
        data: {
          actionType: i % 3 === 0 ? "CREATE" : "UPDATE",
          entityType: i % 2 === 0 ? "ITEM" : "PURCHASE_ORDER",
          performedBy: admin.id,
          performedByName: admin.name,
          companyId,
          createdAt: date,
          newValue: { detail: `System automated activity log entry #${i}` }
        }
      });
    }
    if (i % 100 === 0) console.log(`Processed ${i} events...`);
  }

  console.log("💎 ULTIMATE SYSTEM SEED COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => { console.error("❌ SEED ERROR:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
