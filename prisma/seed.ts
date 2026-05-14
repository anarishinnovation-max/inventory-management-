import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { UserRole } from "../src/lib/types";

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set in the environment.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database (Multi-Tenant: SS Cuttings Tool & Aniket Industries)...");

  // 0. Create Global System Company (for Super Admin logs)
  await prisma.company.upsert({
    where: { id: "GLOBAL" },
    update: { name: "System Global Scope" },
    create: {
      id: "GLOBAL",
      name: "System Global Scope",
    },
  });

  // 1. Create Companies
  const ssCuttings = await prisma.company.upsert({
    where: { id: "ss-cuttings-id" },
    update: { name: "SS Cuttings Tool" },
    create: {
      id: "ss-cuttings-id",
      name: "SS Cuttings Tool",
    },
  });

  const aniketIndustries = await prisma.company.upsert({
    where: { id: "aniket-industries-id" },
    update: { name: "Aniket Industries" },
    create: {
      id: "aniket-industries-id",
      name: "Aniket Industries",
    },
  });

  const charuIndustries = await prisma.company.upsert({
    where: { id: "charu-industries-id" },
    update: { name: "Charu Industries" },
    create: {
      id: "charu-industries-id",
      name: "Charu Industries",
    },
  });

  const ssCompanyId = ssCuttings.id;
  const aniketCompanyId = aniketIndustries.id;
  const charuCompanyId = charuIndustries.id;

  // 2. Create Categories for SS Cuttings
  const categories = ["Inserts", "Tool Holders", "Drills", "Milling", "Spare Parts"];
  const categoryMap: Record<string, string> = {};

  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name_companyId: { name, companyId: ssCompanyId } },
      update: {},
      create: { name, companyId: ssCompanyId },
    });
    categoryMap[name] = cat.id;
  }

  // 3. Create Racks for SS Cuttings
  const racks = ["A1", "A2", "B1", "B2", "C1"];
  const rackMap: Record<string, string> = {};

  for (const rackNumber of racks) {
    const r = await prisma.rack.upsert({
      where: { rackNumber_companyId: { rackNumber, companyId: ssCompanyId } },
      update: {},
      create: { rackNumber, companyId: ssCompanyId },
    });
    rackMap[rackNumber] = r.id;
  }

  // 4. Create Vendors for SS Cuttings
  const vendorsData = ["SANDVIK", "KENNAMETAL", "WIDIA", "LOCAL_SUPPLIER"];
  const vendorMap: Record<string, string> = {};

  for (const name of vendorsData) {
    const v = await prisma.vendor.upsert({
      where: { name_companyId: { name, companyId: ssCompanyId } },
      update: {},
      create: { name, companyId: ssCompanyId },
    });
    vendorMap[name] = v.id;
  }

  // 5. Create Items for SS Cuttings
  const itemsData = [
    { name: "ETJNL 2525 M16", sku: "ETJNL-2525", category: "Tool Holders" },
    { name: "ECLNL 2525 M12", sku: "ECLNL-2525", category: "Tool Holders" },
    { name: "TNMG 160408 PM", sku: "TNMG-160408", category: "Inserts" },
  ];

  for (const item of itemsData) {
    const createdItem = await prisma.item.upsert({
      where: { sku_companyId: { sku: item.sku, companyId: ssCompanyId } },
      update: { name: item.name },
      create: {
        name: item.name,
        sku: item.sku,
        unit: "PCS",
        categoryId: categoryMap[item.category],
        companyId: ssCompanyId,
      },
    });

    // Initialize Inventory for each item
    await prisma.inventory.upsert({
      where: { itemId: createdItem.id },
      update: { companyId: ssCompanyId },
      create: {
        itemId: createdItem.id,
        quantityAvailable: 100,
        companyId: ssCompanyId,
      }
    });
  }

  // 6. Create Users
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // SS Cuttings Users
  const ssUsers = [
    { username: "ss_admin", name: "SS Admin", role: UserRole.OWNER },
    { username: "ss_manager", name: "SS Manager", role: UserRole.MANAGER },
    { username: "ss_employee", name: "SS Employee", role: UserRole.EMPLOYEE },
    { username: "admin", name: "System Admin", role: UserRole.OWNER },
  ];

  for (const u of ssUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashedPassword, role: u.role, companyId: ssCompanyId },
      create: {
        username: u.username,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        companyId: ssCompanyId
      }
    });
  }

  // Aniket Industries Users
  const aniketUsers = [
    { username: "aniket", name: "Aniket Gupta", role: UserRole.OWNER },
    { username: "aniket_manager", name: "Aniket Manager", role: UserRole.MANAGER },
    { username: "aniket_employee", name: "Aniket Employee", role: UserRole.EMPLOYEE },
  ];

  for (const u of aniketUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashedPassword, role: u.role, companyId: aniketCompanyId },
      create: {
        username: u.username,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        companyId: aniketCompanyId
      }
    });
  }

  // Charu Industries Users
  const charuUsers = [
    { username: "charu_admin", name: "Charu Admin", role: UserRole.OWNER },
  ];

  for (const u of charuUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashedPassword, role: u.role, companyId: charuCompanyId },
      create: {
        username: u.username,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        companyId: charuCompanyId
      }
    });
  }

  console.log("✅ Seed database (Multi-Company) completed successfully!");
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
