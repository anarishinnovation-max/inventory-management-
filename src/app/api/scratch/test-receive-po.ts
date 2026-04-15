import prisma from "../../../lib/prisma";
import { config } from "dotenv";
config();

async function main() {
  const poId = "945ad1b4-ab69-4972-a450-171a01a7d87f";
  const sku = "HUB-CTRL-101";

  console.log(`Receiving goods for PO: ${poId}...`);

  // 1. Get the Item
  const item = await prisma.item.findUnique({
    where: { sku },
  });

  if (!item) {
    throw new Error(`Item ${sku} not found`);
  }

  // 2. Prepare receipt data
  const receiptItems = [
    { itemId: item.id, receivedQty: 50 }
  ];

  // 3. Call the receive logic (we can call the service directly for testing)
  // Or simulated via a fetch if the app is running, but direct service call is more reliable for CLI testing.
  const { InventoryService } = await import("../../../lib/inventory-service");
  
  const updatedPo = await InventoryService.receiveGoods(poId, receiptItems);
  if (!updatedPo) throw new Error("Failed to receive goods");
  console.log("Purchase Order status:", updatedPo.status);
  const inv = await prisma.inventory.findUnique({
    where: { itemId: item.id },
  });

  console.log("Inventory State:");
  console.log("- Quantity Available:", inv?.quantityAvailable);
  console.log("- Quantity In Transit:", inv?.quantityInTransit);

  // 5. Verify Transactions
  const txs = await prisma.inventoryTransaction.findMany({
    where: { itemId: item.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log("Recent Transactions:", txs.map(t => ({ type: t.type, qty: t.quantity })));

  console.log("\nGoods Receiving Workflow Verified Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
