import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting data injection from transaction sheet...");

  // 1a. Upsert Racks (Simplified to just rackNumber)
  const racks = [
    { rackNumber: "1" },
    { rackNumber: "2" },
    { rackNumber: "3" },
    { rackNumber: "4" },
    { rackNumber: "5" },
    { rackNumber: "6" },
    { rackNumber: "7" },
    { rackNumber: "8" },
    { rackNumber: "9" },
    { rackNumber: "10" }
  ];

  for (const r of racks) {
    await (prisma as any).rack.upsert({
      where: { rackNumber: r.rackNumber },
      update: {},
      create: r
    });
  }
  console.log("Default Rack Numbers upserted.");

  // 1. Upsert Categories
  const categoryNames = [
    "B CLAMP TOOL HOLDER",
    "E CLAMP TOOL HOLDER",
    "CNC BORING BAR",
    "TOOL SPARES B CLAMP",
    "OD GROOVING TOOLS"
  ];

  const categoriesMap: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    categoriesMap[name] = cat.id;
  }
  console.log("Categories upserted.");

  // 2. Upsert Vendors
  const vendors = [
    { name: "SOHAM ENTERPRISES", email: "contact@soham.com", contact: "9821457832" },
    { name: "K K TOOLS", email: "info@kktools.com", contact: "9852354731" },
    { name: "V V TOOLS", email: "support@vvtools.com", contact: "9873625588" }
  ];

  const vendorsMap: Record<string, string> = {};
  for (const v of vendors) {
    const vendor = await prisma.vendor.create({
        data: v
    });
    vendorsMap[v.name] = vendor.id;
  }
  console.log("Vendors upserted.");

  // 3. Upsert Customers
  const customers = [
    { name: "CNC TOOLS", contact: "9855225588", address: "COIMBATORE" },
    { name: "A K MAHCINE", contact: "8700889911", address: "PUNE" },
    { name: "YASH ENTERPRISES", contact: "9863785588", address: "NEW DELHI" }
  ];

  const customersMap: Record<string, string> = {};
  for (const c of customers) {
    const customer = await prisma.customer.create({
        data: c
    });
    customersMap[c.name] = customer.id;
  }
  console.log("Customers upserted.");

  // 4. Upsert Items
  const items = [
    { name: "BTJNL 2525 M16", sku: "BTJNL 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "BTJNR 2525 M16", sku: "BTJNR 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "ETJNL 2525 M16", sku: "ETJNL 2525 M16", category: "E CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "ECLNL 2525 M12", sku: "ECLNL 2525 M12", category: "E CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "ECLNR 2525 M12", sku: "ECLNR 2525 M12", category: "E CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "EVJNL 2525 M16", sku: "EVJNL 2525 M16", category: "E CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "BVQNL 2525 M16", sku: "BVQNL 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "BVQNR 2525 M16", sku: "BVQNR 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "BTENN 2525 M16", sku: "BTENN 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "S08H SCLCL 06", sku: "S08H SCLCL 06", category: "CNC BORING BAR", unit: "PCS" },
    { name: "BVVNN 2525 M16", sku: "BVVNN 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "BCLNL 2525 M12", sku: "BCLNL 2525 M12", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "S16Q SCLCL 09", sku: "S16Q SCLCL 09", category: "CNC BORING BAR", unit: "PCS" },
    { name: "BVJNR 2525 M16", sku: "BVJNR 2525 M16", category: "B CLAMP TOOL HOLDER", unit: "PCS" },
    { name: "TNMG B TOP CLAMF", sku: "TNMG B TOP CLAMF", category: "TOOL SPARES B CLAMP", unit: "PCS" },
    { name: "TTEL 2525 2T15", sku: "TTEL 2525 2T15", category: "OD GROOVING TOOLS", unit: "PCS" },
    { name: "MGEHL 2525 2T15", sku: "MGEHL 2525 2T15", category: "OD GROOVING TOOLS", unit: "PCS" },
    { name: "MGEHR 2525 2T15", sku: "MGEHR 2525 2T15", category: "OD GROOVING TOOLS", unit: "PCS" },
  ];

  const itemsMap: Record<string, string> = {};
  for (const item of items) {
    const created = await prisma.item.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        category: { connect: { id: categoriesMap[item.category] } }
      }
    });

    await (prisma as any).inventory.upsert({
        where: { itemId: created.id },
        update: {},
        create: {
           itemId: created.id,
           quantityAvailable: 0
        }
    });

    itemsMap[item.name] = created.id;
  }
  console.log("Items and Inventory initialized.");

  // 5. Generate Historical Transactions (Purchase Bills)
  const purchaseBills = [
    { vendor: "SOHAM ENTERPRISES", item: "BTJNL 2525 M16", qty: 100, price: 450 },
    { vendor: "SOHAM ENTERPRISES", item: "BTJNR 2525 M16", qty: 150, price: 450 },
    { vendor: "K K TOOLS", item: "S08H SCLCL 06", qty: 500, price: 120 },
    { vendor: "V V TOOLS", item: "TNMG B TOP CLAMF", qty: 1000, price: 22 },
  ];

  for (const bill of purchaseBills) {
    const itemId = itemsMap[bill.item];
    const vendorId = vendorsMap[bill.vendor];

    const po = await prisma.purchaseOrder.create({
      data: {
        vendorId,
        status: "RECEIVED",
        items: {
          create: {
            itemId,
            quantityOrdered: bill.qty,
            quantityReceived: bill.qty,
            costPrice: bill.price
          }
        }
      }
    });

    await (prisma as any).inventoryTransaction.create({
      data: {
        itemId,
        vendorId,
        type: "PURCHASE",
        quantity: bill.qty,
        referenceType: "PO",
        referenceId: po.id
      }
    });

    await (prisma as any).inventory.update({
      where: { itemId },
      data: { quantityAvailable: { increment: bill.qty } }
    });
  }
  console.log("Historical Purchase Transactions generated.");

  // 6. Generate Historical Transactions (Sale Bills)
  const saleBills = [
    { customer: "CNC TOOLS", item: "ETJNL 2525 M16", qty: 49, price: 700 }, 
    { customer: "A K MAHCINE", item: "BTJNL 2525 M16", qty: 20, price: 700 },
  ];

  // Allocation stock to item for sale simulation
  await (prisma as any).inventory.update({
      where: { itemId: itemsMap["ETJNL 2525 M16"] },
      data: { quantityAvailable: 100 }
  });

  for (const bill of saleBills) {
    const itemId = itemsMap[bill.item];
    const customerId = customersMap[bill.customer];

    const dispatchOrder = await (prisma as any).dispatchOrder.create({
      data: {
        customerId,
        status: "DISPATCHED",
        items: {
          create: {
            itemId,
            quantity: bill.qty,
            sellingPrice: bill.price
          }
        }
      }
    });

    await (prisma as any).inventoryTransaction.create({
      data: {
        itemId,
        customerId,
        type: "SALE",
        quantity: -bill.qty,
        referenceType: "DISPATCH",
        referenceId: dispatchOrder.id
      }
    });

    await (prisma as any).inventory.update({
      where: { itemId },
      data: { quantityAvailable: { decrement: bill.qty } }
    });
  }
  console.log("Historical Sale Transactions generated.");

  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
