import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  // Create Owner User
  const owner = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "System Admin",
      role: "owner",
    },
  });

  // Create some default categories
  const categories = ["Electronics", "Furniture", "Raw Materials", "Finished Goods"];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }

  // Create a default Vendor
  await prisma.vendor.create({
    data: {
      name: "Global Supplies Corp",
      contact: "John Doe",
      email: "john@globalsupplies.com",
    },
  });

  // Create default Racks
  const racks = [
    { rackNumber: "A-01", zone: "A" },
    { rackNumber: "A-02", zone: "A" },
    { rackNumber: "B-01", zone: "B" },
    { rackNumber: "C-01", zone: "C" },
  ];

  for (const rack of racks) {
    await prisma.rack.upsert({
      where: { rackNumber: rack.rackNumber },
      update: {},
      create: rack,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
