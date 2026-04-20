import { PrismaClient } from "../src/generated/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for multi-tenancy...");

  // 1. Create Default Tenant
  const defaultTenant = await (prisma as any).tenant.upsert({
    where: { subdomain: "admin" },
    update: {},
    create: {
      name: "Admin Workspace",
      subdomain: "admin",
      isActive: true,
    },
  });

  console.log(`Using Tenant: ${defaultTenant.name} (${defaultTenant.id})`);

  // 2. Create Categories
  const categories = ["Inserts", "Tool Holders", "Drills", "Milling", "Spare Parts"];
  const categoryMap: Record<string, string> = {};

  for (const name of categories) {
    const cat = await (prisma as any).category.upsert({
      where: { tenantId_name: { tenantId: defaultTenant.id, name } },
      update: {},
      create: { name, tenantId: defaultTenant.id },
    });
    categoryMap[name] = cat.id;
  }

  // 3. Create Racks
  const racks = ["A1", "A2", "B1", "B2", "C1"];
  const rackMap: Record<string, string> = {};

  for (const rackNumber of racks) {
    const r = await (prisma as any).rack.upsert({
      where: { tenantId_rackNumber: { tenantId: defaultTenant.id, rackNumber } },
      update: {},
      create: { rackNumber, tenantId: defaultTenant.id },
    });
    rackMap[rackNumber] = r.id;
  }

  // 4. Create Vendors
  const vendorsData = ["SANDVIK", "KENNAMETAL", "WIDIA", "LOCAL_SUPPLIER"];
  const vendorMap: Record<string, string> = {};

  for (const name of vendorsData) {
    const v = await (prisma as any).vendor.upsert({
      where: { tenantId_name: { tenantId: defaultTenant.id, name } },
      update: {},
      create: { name, tenantId: defaultTenant.id },
    });
    vendorMap[name] = v.id;
  }

  // 5. Create Items
  const itemsData = [
    { name: "ETJNL 2525 M16", sku: "ETJNL-2525", category: "Tool Holders" },
    { name: "ECLNL 2525 M12", sku: "ECLNL-2525", category: "Tool Holders" },
    { name: "TNMG 160408 PM", sku: "TNMG-160408", category: "Inserts" },
  ];

  const itemMap: Record<string, string> = {};

  for (const item of itemsData) {
    const createdItem = await (prisma as any).item.upsert({
      where: { tenantId_sku: { tenantId: defaultTenant.id, sku: item.sku } },
      update: { name: item.name },
      create: {
        tenantId: defaultTenant.id,
        name: item.name,
        sku: item.sku,
        unit: "PCS",
        categoryId: categoryMap[item.category],
      },
    });
    itemMap[item.name] = createdItem.id;

    // Initialize Inventory for each item
    await (prisma as any).inventory.upsert({
      where: { itemId: createdItem.id },
      update: {},
      create: {
        tenantId: defaultTenant.id,
        itemId: createdItem.id,
        quantityAvailable: 100,
      }
    });
  }

  // 6. Create Roles and Users
  const roles = ["ADMIN", "MANAGER", "STAFF"];
  for (const roleName of roles) {
    const role = await (prisma as any).role.upsert({
      where: { tenantId_name: { tenantId: defaultTenant.id, name: roleName } },
      update: {},
      create: { name: roleName, tenantId: defaultTenant.id },
    });

    if (roleName === "ADMIN") {
      await (prisma as any).user.upsert({
          where: { username: "admin" },
          update: {},
          create: {
              tenantId: defaultTenant.id,
              username: "admin",
              password: "password123", // In real apps, this should be hashed
              name: "System Admin",
              roleId: role.id
          }
      });
    }
  }

  console.log("✅ Seed database for multi-tenancy completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
