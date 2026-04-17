import prisma from "../src/lib/prisma";

async function backfill() {
  console.log("🚀 Starting Transaction Backfill...");

  try {
    // 1. Backfill Purchases from InventoryBatches
    const batches = await prisma.inventoryBatch.findMany({
      include: {
        inventory: true,
        vendor: true,
      },
    });

    console.log(`📦 Found ${batches.length} batches to index as PURCHASES.`);
    for (const batch of batches) {
      await prisma.inventoryTransaction.create({
        data: {
          itemId: batch.inventory.itemId,
          vendorId: batch.vendorId,
          type: "PURCHASE",
          quantity: batch.quantity,
          referenceType: "PO_MIGRATED",
          referenceId: batch.purchaseOrderId || "SEED",
          createdAt: batch.purchaseDate,
        },
      });
    }

    // 2. Backfill Sales from DispatchOrders
    const dispatches = await prisma.dispatchOrder.findMany({
      where: { status: "dispatched" },
      include: {
        items: true,
        customer: true,
      },
    });

    console.log(`🚚 Found ${dispatches.length} completed dispatch orders to index as SALES.`);
    for (const order of dispatches) {
      for (const item of order.items) {
        // Find a rack to associate (greedy find first rack with some stock for this item)
        const stock = await prisma.stock.findFirst({
          where: { itemId: item.itemId },
        });

        await prisma.inventoryTransaction.create({
          data: {
            itemId: item.itemId,
            customerId: order.customerId,
            rackId: stock?.rackId,
            type: "SALE",
            quantity: -item.quantity,
            referenceType: "DISPATCH_MIGRATED",
            referenceId: order.id,
            createdAt: order.orderDate,
          },
        });
      }
    }

    console.log("✅ Backfill Complete!");
  } catch (error) {
    console.error("❌ Backfill Failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

backfill();
