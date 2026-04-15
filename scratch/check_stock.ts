import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check stocks table for BVJNR
  const stocks = await (prisma as any).stock.findMany({
    include: { item: true, rack: true }
  });
  console.log("\n=== STOCK TABLE (Per Rack) ===");
  for (const s of stocks) {
    console.log(`  ${s.item.sku} | Rack ${s.rack?.rackNumber} | qty=${s.quantity}`);
  }

  // Get first rack 
  const firstRack = await (prisma as any).rack.findFirst({ orderBy: { rackNumber: 'asc' } });
  console.log("\nFirst rack:", firstRack);

  await prisma.$disconnect();
  await pool.end();
}
main().catch(console.error);
