import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database (Single Tenant)...");

  // 1. Create Categories
  const categories = ["Inserts", "Tool Holders", "Drills", "Milling", "Spare Parts"];
  const categoryMap: Record<string, string> = {};

  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap[name] = cat.id;
  }

  // 2. Create Racks
  const racks = ["A1", "A2", "B1", "B2", "C1"];
  const rackMap: Record<string, string> = {};

  for (const rackNumber of racks) {
    const r = await prisma.rack.upsert({
      where: { rackNumber },
      update: {},
      create: { rackNumber },
    });
    rackMap[rackNumber] = r.id;
  }

  // 3. Create Vendors
  const vendorsData = ["SANDVIK", "KENNAMETAL", "WIDIA", "LOCAL_SUPPLIER"];
  const vendorMap: Record<string, string> = {};

  for (const name of vendorsData) {
    const v = await prisma.vendor.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    vendorMap[name] = v.id;
  }

  // 4. Create Items
  const itemsData = [
    { name: "ETJNL 2525 M16", sku: "ETJNL-2525", category: "Tool Holders" },
    { name: "ECLNL 2525 M12", sku: "ECLNL-2525", category: "Tool Holders" },
    { name: "TNMG 160408 PM", sku: "TNMG-160408", category: "Inserts" },
  ];

  for (const item of itemsData) {
    const createdItem = await prisma.item.upsert({
      where: { sku: item.sku },
      update: { name: item.name },
      create: {
        name: item.name,
        sku: item.sku,
        unit: "PCS",
        categoryId: categoryMap[item.category],
      },
    });

    // Initialize Inventory for each item
    await prisma.inventory.upsert({
      where: { itemId: createdItem.id },
      update: {},
      create: {
        itemId: createdItem.id,
        quantityAvailable: 100,
      }
    });
  }

  // 5. Create Roles and Users
  const roles = ["ADMIN", "MANAGER", "STAFF"];
  const hashedPassword = await bcrypt.hash("admin123", 10);

  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    if (roleName === "ADMIN") {
      await prisma.user.upsert({
          where: { username: "admin" },
          update: { password: hashedPassword },
          create: {
              username: "admin",
              password: hashedPassword,
              name: "System Admin",
              roleId: role.id,
              role: "admin"
          }
      });
    }
  }

  console.log("✅ Seed database completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
