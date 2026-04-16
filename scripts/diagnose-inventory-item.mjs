import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/index.js";

const { Pool } = pg;

function usage() {
  console.log("Usage: node scripts/diagnose-inventory-item.mjs <sku-or-name-fragment>");
}

const term = process.argv.slice(2).join(" ").trim();
if (!term) {
  usage();
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  const items = await prisma.item.findMany({
    where: {
      OR: [
        { sku: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
      ],
    },
    take: 10,
    include: {
      inventory: true,
      stocks: { include: { rack: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Matches: ${items.length}`);
  for (const item of items) {
    const stockSum = (item.stocks || []).reduce((acc, s) => acc + Number(s.quantity || 0), 0);
    const invAvail = Number(item.inventory?.quantityAvailable || 0);
    const totalStockComputed = (item.stocks || []).length > 0 ? stockSum : invAvail;
    const minStockLevel = Number(item.minStockLevel || 0);
    const status =
      totalStockComputed === 0
        ? "OUT_OF_STOCK"
        : totalStockComputed <= minStockLevel
          ? "LOW_STOCK"
          : "IN_STOCK";
    console.log("----");
    console.log(`Item: ${item.name} | SKU: ${item.sku} | Category: ${item.category?.name || "N/A"}`);
    console.log(`CreatedAt: ${new Date(item.createdAt).toISOString()} | MinStockLevel: ${minStockLevel} | Status: ${status}`);
    const newerCount = await prisma.item.count({ where: { createdAt: { gt: item.createdAt } } });
    const pageSize = 10;
    const oneBasedIndex = newerCount + 1;
    const page = Math.floor((oneBasedIndex - 1) / pageSize) + 1;
    console.log(`Inventory list position: #${oneBasedIndex} (page ${page} @ ${pageSize}/page, sorted by createdAt desc)`);
    console.log(`Inventory.quantityAvailable: ${invAvail}`);
    console.log(`Stock rows: ${(item.stocks || []).length} | Stock sum: ${stockSum}`);
    console.log(`Inventory page totalStock (current logic): ${totalStockComputed}`);
    if (item.inventory?.id) {
      const batchCount = await prisma.inventoryBatch.count({ where: { inventoryId: item.inventory.id } });
      console.log(`Batch rows: ${batchCount}`);
      const sampleBatches = await prisma.inventoryBatch.findMany({
        where: { inventoryId: item.inventory.id },
        take: 3,
        orderBy: { purchaseDate: "desc" },
        include: { vendor: true },
      });
      for (const b of sampleBatches) {
        console.log(
          `  Batch: vendor=${b.vendor?.name || "Unknown"} qty=${Number(b.quantity)} remaining=${Number(b.remainingQty)} cost=${Number(b.costPerUnit)} date=${new Date(b.purchaseDate).toISOString()}`
        );
      }
    }
    if ((item.stocks || []).length > 0) {
      for (const s of item.stocks) {
        console.log(`  Rack ${s.rack?.rackNumber || "N/A"}: ${Number(s.quantity || 0)}`);
      }
    }
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
