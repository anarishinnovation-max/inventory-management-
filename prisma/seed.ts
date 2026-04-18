import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Default Roles
  const roles = [
    { name: "owner", description: "Full system access" },
    { name: "admin", description: "Management and reporting access" },
    { name: "employee", description: "Standard inventory operations" },
  ];

  const roleMap: Record<string, any> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleMap[r.name] = role;
  }

  // 2. Create Owner User
  const owner = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
       roleId: roleMap["owner"].id
    },
    create: {
      username: "admin",
      password: hashedPassword,
      name: "System Admin",
      role: "owner",
      roleId: roleMap["owner"].id,
    },
  });

  // Create categories
  const categoryNames = ["B CLAMP TOOL HOLDER", "E CLAMP TOOL HOLDER", "CNC BORING BAR", "TOOL SPARES", "OD GROOVING TOOLS"];
  const categories: Record<string, string> = {};

  for (const cat of categoryNames) {
    const created = await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
    categories[cat] = created.id;
  }

  // Create vendors
  const vendorData = [
    { name: "SOHAM ENTERPRISES", contact: "9821457832", address: "DABUA PALI ROAD" },
    { name: "K K TOOLS", contact: "9852354731", address: "NIT FARIDABAD" },
    { name: "V V TOOLS", contact: "9873625588", address: "IMT FARIDABAD" },
    { name: "CNC TOOLS", contact: "9855225588", address: "COIMBATORE" },
    { name: "A K MAHCINE", contact: "8700889911", address: "PUNE" },
    { name: "YASH ENTERPRISES", contact: "9863785588", address: "NEW DELHI" },
  ];

  const vendors: Record<string, string> = {};
  for (const vendor of vendorData) {
    const created = await prisma.vendor.upsert({
      where: { name: vendor.name },
      update: {},
      create: {
        name: vendor.name,
        contact: vendor.contact,
        email: `${vendor.name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        preferredPaymentMode: "Cash",
      },
    });
    vendors[vendor.name] = created.id;
  }

  // Create customers
  const customerData = [
    { name: "CNC TOOLS", contact: "9855225588", address: "COIMBATORE" },
    { name: "A K MAHCINE", contact: "8700889911", address: "PUNE" },
    { name: "YASH ENTERPRISES", contact: "9863785588", address: "NEW DELHI" },
  ];

  const customers: Record<string, string> = {};
  for (const customer of customerData) {
    const created = await prisma.customer.create({
      data: {
        name: customer.name,
        contact: customer.contact,
        email: `${customer.name.toLowerCase().replace(/\s+/g, ".")}@customer.com`,
        address: customer.address,
      },
    });
    customers[customer.name] = created.id;
  }

  // Create items
  const items = [
    { name: "BTJNL 2525 M16", sku: "BTJNL-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BTJNR 2525 M16", sku: "BTJNR-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "ETJNL 2525 M16", sku: "ETJNL-2525-M16", category: "E CLAMP TOOL HOLDER" },
    { name: "ECLNL 2525 M12", sku: "ECLNL-2525-M12", category: "E CLAMP TOOL HOLDER" },
    { name: "ECLNR 2525 M12", sku: "ECLNR-2525-M12", category: "E CLAMP TOOL HOLDER" },
    { name: "EVJNL 2525 M16", sku: "EVJNL-2525-M16", category: "E CLAMP TOOL HOLDER" },
    { name: "BVQNL 2525 M16", sku: "BVQNL-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BVQNR 2525 M16", sku: "BVQNR-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BVJNR 2525 M16", sku: "BVJNR-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BVVNN 2525 M16", sku: "BVVNN-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BTENN 2525 M16", sku: "BTENN-2525-M16", category: "B CLAMP TOOL HOLDER" },
    { name: "BCLNL 2525 M12", sku: "BCLNL-2525-M12", category: "B CLAMP TOOL HOLDER" },
    { name: "S08H SCLCL 06", sku: "S08H-SCLCL-06", category: "CNC BORING BAR" },
    { name: "S16Q SCLCL 09", sku: "S16Q-SCLCL-09", category: "CNC BORING BAR" },
    { name: "TNMG B TOP CLAMF", sku: "TNMG-B-TOP-CLAMP", category: "TOOL SPARES" },
    { name: "TTEL 2525 2T15", sku: "TTEL-2525-2T15", category: "OD GROOVING TOOLS" },
    { name: "MGEHL 2525 2T15", sku: "MGEHL-2525-2T15", category: "OD GROOVING TOOLS" },
    { name: "MGEHR 2525 2T15", sku: "MGEHR-2525-2T15", category: "OD GROOVING TOOLS" },
  ];

  const itemsMap: Record<string, string> = {};
  for (const item of items) {
    const created = await prisma.item.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        name: item.name,
        sku: item.sku,
        categoryId: categories[item.category],
        unit: "PCS",
        minStockLevel: 50,
        isCritical: false,
      },
    });
    itemsMap[item.name] = created.id;
  }

  // Create racks based on the master data
  const rackNumbers = ["A1", "A5", "AB9", "AC1", "B5", "B8", "C1", "C9", "C8", "I5", "D6", "D2", "AC8", "AG2", "AN1", "AN5", "V5", "W1"];
  const racks: Record<string, string> = {};

  for (let i = 0; i < rackNumbers.length; i++) {
    const rackNo = rackNumbers[i];
    const created = await prisma.rack.upsert({
      where: { rackNumber: rackNo },
      update: {},
      create: {
        rackNumber: rackNo,
        zone: rackNo.charAt(0),
      },
    });
    racks[rackNo] = created.id;
  }

  // Create purchase orders with items (from Purchase Bill data)
  const purchaseOrdersData = [
    {
      vendor: "SOHAM ENTERPRISES",
      items: [
        { name: "BTJNL 2525 M16", quantity: 100, costPrice: 450 },
        { name: "BTJNR 2525 M16", quantity: 150, costPrice: 450 },
        { name: "ETJNL 2525 M16", quantity: 50, costPrice: 550 },
        { name: "ECLNL 2525 M12", quantity: 80, costPrice: 550 },
        { name: "ECLNR 2525 M12", quantity: 40, costPrice: 550 },
        { name: "EVJNL 2525 M16", quantity: 50, costPrice: 550 },
        { name: "BVQNL 2525 M16", quantity: 50, costPrice: 450 },
        { name: "BVQNR 2525 M16", quantity: 30, costPrice: 450 },
        { name: "BTENN 2525 M16", quantity: 30, costPrice: 450 },
      ],
    },
    {
      vendor: "K K TOOLS",
      items: [
        { name: "S08H SCLCL 06", quantity: 500, costPrice: 120 },
        { name: "BTJNL 2525 M16", quantity: 100, costPrice: 480 },
        { name: "BVQNL 2525 M16", quantity: 50, costPrice: 480 },
        { name: "BVVNN 2525 M16", quantity: 50, costPrice: 480 },
        { name: "ETJNL 2525 M16", quantity: 100, costPrice: 550 },
        { name: "BCLNL 2525 M12", quantity: 100, costPrice: 480 },
        { name: "S16Q SCLCL 09", quantity: 100, costPrice: 300 },
        { name: "BVJNR 2525 M16", quantity: 50, costPrice: 480 },
      ],
    },
    {
      vendor: "V V TOOLS",
      items: [
        { name: "TNMG B TOP CLAMF", quantity: 1000, costPrice: 22 },
        { name: "TTEL 2525 2T15", quantity: 50, costPrice: 400 },
        { name: "MGEHL 2525 2T15", quantity: 40, costPrice: 400 },
        { name: "MGEHR 2525 2T15", quantity: 30, costPrice: 400 },
        { name: "BTJNL 2525 M16", quantity: 100, costPrice: 450 },
        { name: "S08H SCLCL 06", quantity: 100, costPrice: 130 },
        { name: "S16Q SCLCL 09", quantity: 100, costPrice: 320 },
      ],
    },
  ];

  for (const po of purchaseOrdersData) {
    const createdPO = await prisma.purchaseOrder.create({
      data: {
        vendorId: vendors[po.vendor],
        status: "RECEIVED",
        paymentMode: "Cash",
        orderDate: new Date("2026-04-01"),
      },
    });

    for (const item of po.items) {
      await prisma.pOLineItem.create({
        data: {
          purchaseOrderId: createdPO.id,
          itemId: itemsMap[item.name],
          quantityOrdered: item.quantity,
          quantityReceived: item.quantity,
          costPrice: item.costPrice,
        },
      });

      // Create inventory and batch
      let inventory = await prisma.inventory.findUnique({
        where: { itemId: itemsMap[item.name] },
      });

      if (!inventory) {
        inventory = await prisma.inventory.create({
          data: {
            itemId: itemsMap[item.name],
            quantityAvailable: item.quantity,
          },
        });
      } else {
        await prisma.inventory.update({
          where: { itemId: itemsMap[item.name] },
          data: {
            quantityAvailable: { increment: item.quantity },
          },
        });
      }

      // Create batch
      await prisma.inventoryBatch.create({
        data: {
          inventoryId: inventory.id,
          vendorId: vendors[po.vendor],
          quantity: item.quantity,
          remainingQty: item.quantity,
          costPerUnit: item.costPrice,
          purchaseDate: new Date("2026-04-01"),
          purchaseOrderId: createdPO.id,
        },
      });
    }
  }

  // Create dispatch orders with items (from Sale Bill data)
  const dispatchOrdersData = [
    {
      customer: "CNC TOOLS",
      paymentMode: "Cash",
      items: [
        { name: "ETJNL 2525 M16", quantity: 49, sellingPrice: 700 },
        { name: "ECLNL 2525 M12", quantity: 60, sellingPrice: 700 },
        { name: "ECLNR 2525 M12", quantity: 30, sellingPrice: 700 },
        { name: "EVJNL 2525 M16", quantity: 40, sellingPrice: 700 },
        { name: "BVQNL 2525 M16", quantity: 30, sellingPrice: 600 },
        { name: "BCLNL 2525 M12", quantity: 80, sellingPrice: 600 },
        { name: "S16Q SCLCL 09", quantity: 80, sellingPrice: 600 },
        { name: "BVJNR 2525 M16", quantity: 40, sellingPrice: 600 },
      ],
    },
    {
      customer: "A K MAHCINE",
      paymentMode: "Cash",
      items: [
        { name: "S08H SCLCL 06", quantity: 200, sellingPrice: 150 },
        { name: "BTJNL 2525 M16", quantity: 80, sellingPrice: 580 },
        { name: "BVQNL 2525 M16", quantity: 50, sellingPrice: 580 },
        { name: "TNMG B TOP CLAMF", quantity: 500, sellingPrice: 30 },
        { name: "TTEL 2525 2T15", quantity: 30, sellingPrice: 700 },
        { name: "BTJNL 2525 M16", quantity: 20, sellingPrice: 700 },
        { name: "BTJNR 2525 M16", quantity: 30, sellingPrice: 700 },
        { name: "MGEHL 2525 2T15", quantity: 10, sellingPrice: 700 },
        { name: "MGEHR 2525 2T15", quantity: 10, sellingPrice: 700 },
      ],
    },
    {
      customer: "YASH ENTERPRISES",
      paymentMode: "Cash",
      items: [
        { name: "BTJNL 2525 M16", quantity: 100, sellingPrice: 600 },
        { name: "BTJNR 2525 M16", quantity: 100, sellingPrice: 600 },
        { name: "ECLNL 2525 M12", quantity: 50, sellingPrice: 700 },
        { name: "ECLNR 2525 M12", quantity: 50, sellingPrice: 700 },
        { name: "S08H SCLCL 06", quantity: 100, sellingPrice: 150 },
        { name: "TNMG B TOP CLAMF", quantity: 500, sellingPrice: 40 },
        { name: "MGEHL 2525 2T15", quantity: 50, sellingPrice: 600 },
        { name: "MGEHR 2525 2T15", quantity: 50, sellingPrice: 600 },
      ],
    },
  ];

  for (const order of dispatchOrdersData) {
    const createdOrder = await prisma.dispatchOrder.create({
      data: {
        customerId: customers[order.customer],
        status: "dispatched",
        orderDate: new Date("2026-04-05"),
      },
    });

    for (const item of order.items) {
      await prisma.dispatchItem.create({
        data: {
          dispatchOrderId: createdOrder.id,
          itemId: itemsMap[item.name],
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        },
      });

      // Decrement inventory
      await prisma.inventory.update({
        where: { itemId: itemsMap[item.name] },
        data: {
          quantityAvailable: { decrement: item.quantity },
        },
      });
    }
  }

  console.log("✅ Seed data created successfully with real inventory transactions!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

