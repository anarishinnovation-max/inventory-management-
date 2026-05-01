import "dotenv/config";
import prisma from "../src/lib/prisma";

async function syncReservations() {
  console.log("Starting Inventory Reservation Sync...");

  // 1. Reset all quantityReserved to 0 first
  await prisma.inventory.updateMany({
    data: { quantityReserved: 0 }
  });

  // 2. Fetch all pending orders
  const pendingOrders = await prisma.dispatchOrder.findMany({
    where: { status: "pending" },
    include: { items: true }
  });

  console.log(`Found ${pendingOrders.length} pending orders to sync.`);

  // 3. Sum up quantities per item
  const reservations: Record<string, number> = {};
  for (const order of pendingOrders) {
    for (const item of order.items) {
      reservations[item.itemId] = (reservations[item.itemId] || 0) + item.quantity;
    }
  }

  // 4. Update the inventory table
  for (const [itemId, qty] of Object.entries(reservations)) {
    await prisma.inventory.update({
      where: { itemId },
      data: { quantityReserved: qty }
    });
    console.log(`Synced Item ID ${itemId}: Reserved ${qty} units.`);
  }

  console.log("Sync Complete!");
}

syncReservations()
  .catch(e => console.error(e))
  .finally(() => process.exit());
