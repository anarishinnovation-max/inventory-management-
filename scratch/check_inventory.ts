import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const inv = await (prisma as any).inventory.findMany({ include: { item: true } });
  console.log("\n=== INVENTORY SNAPSHOT ===");
  for (const i of inv) {
    console.log(`${i.item.sku}: available=${i.quantityAvailable}, inTransit=${i.quantityInTransit}`);
  }

  const po = await (prisma as any).purchaseOrder.findUnique({
    where: { id: "a28a6fbf-bbfb-48ab-be24-233a8a957b01" },
    include: { items: { include: { item: true } } }
  });
  if (po) {
    console.log(`\n=== PO STATUS: ${po.status} ===`);
    for (const li of po.items) {
      console.log(`  ${li.item.sku}: ordered=${li.quantityOrdered}, received=${li.quantityReceived}`);
    }
  }
  await prisma.$disconnect();
  await pool.end();
}
main().catch(console.error);
