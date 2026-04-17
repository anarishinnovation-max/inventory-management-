const { PrismaClient } = require("./src/generated/client");
const { InventoryService } = require("./src/lib/inventory-service");
const { alias } = require("./tsconfig.json").compilerOptions; // Not helpful for CJS

const prisma = new PrismaClient();

async function runVerification() {
  console.log("--- Verification Started ---");

  try {
    // 1. Fetch an existing SKU
    const existingItems = await prisma.item.findMany({ take: 1 });
    if (existingItems.length > 0) {
      const existingSku = existingItems[0].sku;
      const categoryId = existingItems[0].categoryId;
      console.log(`Testing Duplicate SKU: ${existingSku}`);
      try {
        await InventoryService.addItem({
          name: "Test Item",
          sku: existingSku,
          categoryId: categoryId,
          unit: "pcs"
        });
        console.error("FAIL: Duplicate SKU was allowed!");
      } catch (err) {
        if (err.message.includes(`SKU_EXISTS:${existingSku}`)) {
          console.log("SUCCESS: Duplicate SKU correctly blocked with message:", err.message);
        } else {
          console.error("FAIL: Unexpected error message:", err.message);
        }
      }
    }

    // 2. Create a Dispatch Order and check RESERVE log
    console.log("\nTesting Reservation & Audit...");
    const customer = await prisma.customer.findFirst();
    const item = await prisma.item.findFirst({ include: { inventory: true } });
    
    if (customer && item && item.inventory.quantityAvailable >= 1) {
      const order = await InventoryService.createDispatchOrder({
        customerId: customer.id,
        items: [{ itemId: item.id, quantity: 1, sellingPrice: 100 }],
        status: "pending"
      });
      console.log("Order Created:", order.id);

      const tx = await prisma.inventoryTransaction.findFirst({
        where: { referenceId: order.id, type: "RESERVE" },
        orderBy: { createdAt: "desc" }
      });
      if (tx) {
        console.log("SUCCESS: RESERVE transaction found in audit log.");
      } else {
        console.error("FAIL: RESERVE transaction NOT found!");
      }

      // 3. Test Cancellation
      console.log("\nTesting Cancellation...");
      const oldAvailable = (await prisma.inventory.findUnique({ where: { itemId: item.id } })).quantityAvailable;
      await InventoryService.cancelDispatchOrder(order.id);
      const newAvailable = (await prisma.inventory.findUnique({ where: { itemId: item.id } })).quantityAvailable;
      
      if (newAvailable === oldAvailable + 1) {
        console.log("SUCCESS: Stock restored after cancellation.");
      } else {
        console.error(`FAIL: Stock not restored. Old: ${oldAvailable}, New: ${newAvailable}`);
      }

      const releaseTx = await prisma.inventoryTransaction.findFirst({
        where: { referenceId: order.id, type: "RELEASE_RESERVE" },
        orderBy: { createdAt: "desc" }
      });
      if (releaseTx) {
        console.log("SUCCESS: RELEASE_RESERVE transaction found in audit log.");
      } else {
        console.error("FAIL: RELEASE_RESERVE transaction NOT found!");
      }
    } else {
       console.log("Skipping order tests: No customer or insufficient stock found.");
    }

  } catch (err) {
    console.error("Verification script crashed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n--- Verification Finished ---");
  }
}

runVerification();
