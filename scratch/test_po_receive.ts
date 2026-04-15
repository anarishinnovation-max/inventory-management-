import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";
import { InventoryService } from "../src/lib/inventory-service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== E2E TEST: PO Create → Receive → Inventory Check ===\n");

  // 1. Get a vendor and item
  const vendor = await (prisma as any).vendor.findFirst();
  const item = await (prisma as any).item.findFirst({ include: { inventory: true } });
  if (!vendor || !item) throw new Error("No vendor or item found. Run seed first.");

  const qtyBefore = item.inventory?.quantityAvailable ?? 0;
  const TEST_QTY = 25;

  console.log(`  Vendor: ${vendor.name}`);
  console.log(`  Item: ${item.name} (SKU: ${item.sku})`);
  console.log(`  Inventory BEFORE receive: ${qtyBefore}`);

  // Check Stock BEFORE
  const stockBefore = await (prisma as any).stock.findFirst({ where: { itemId: item.id }, include: { rack: true } });
  console.log(`  Stock (Rack) BEFORE: ${stockBefore ? `${stockBefore.quantity} @ Rack ${stockBefore.rack?.rackNumber}` : "0 (no record)"}`);

  // 2. Create PO
  console.log("\n[STEP 2] Creating Purchase Order...");
  const po = await (prisma as any).purchaseOrder.create({
    data: {
      vendorId: vendor.id,
      status: "ORDERED",
      items: {
        create: [{
          itemId: item.id,
          quantityOrdered: TEST_QTY,
          costPrice: 500,
        }]
      }
    }
  });
  console.log(`  ✅ PO created: ${po.id} | Status: ${po.status}`);

  // 3. Receive goods via InventoryService
  console.log("\n[STEP 3] Receiving goods...");
  const updatedPo = await InventoryService.receiveGoods(po.id, [
    { itemId: item.id, receivedQty: TEST_QTY }
  ]);
  console.log(`  ✅ PO after receive | Status: ${(updatedPo as any)?.status}`);

  // 4. Check Inventory table
  const inventoryAfter = await (prisma as any).inventory.findUnique({ where: { itemId: item.id } });
  console.log(`\n[STEP 4] Inventory Table AFTER receive: ${inventoryAfter?.quantityAvailable}`);
  const invOk = inventoryAfter?.quantityAvailable >= qtyBefore + TEST_QTY;
  console.log(`  ${invOk ? "✅" : "❌"} Expected ≥ ${qtyBefore + TEST_QTY}, got ${inventoryAfter?.quantityAvailable}`);

  // 5. Check Stock table (what inventory page reads)
  const stockAfter = await (prisma as any).stock.findFirst({ where: { itemId: item.id }, include: { rack: true } });
  const stockQtyAfter = stockAfter?.quantity ?? 0;
  const stockQtyBefore = stockBefore?.quantity ?? 0;
  console.log(`\n[STEP 5] Stock Table (Rack) AFTER receive: ${stockQtyAfter} @ Rack ${stockAfter?.rack?.rackNumber ?? "N/A"}`);
  const stockOk = stockQtyAfter >= stockQtyBefore + TEST_QTY;
  console.log(`  ${stockOk ? "✅" : "❌"} Expected ≥ ${stockQtyBefore + TEST_QTY}, got ${stockQtyAfter}`);

  // 6. Check PO final status
  const finalPo = await (prisma as any).purchaseOrder.findUnique({ where: { id: po.id } });
  const statusOk = finalPo?.status === "RECEIVED";
  console.log(`\n[STEP 6] PO Final Status: ${finalPo?.status}`);
  console.log(`  ${statusOk ? "✅" : "❌"} Expected RECEIVED, got ${finalPo?.status}`);

  console.log("\n=== SUMMARY ===");
  console.log(`  Inventory updated:  ${invOk  ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Stock (page) updated: ${stockOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  PO status correct:  ${statusOk ? "✅ PASS" : "❌ FAIL"}`);

  // Cleanup: delete test PO
  await (prisma as any).inventoryTransaction.deleteMany({ where: { referenceId: po.id } });
  await (prisma as any).pOLineItem.deleteMany({ where: { purchaseOrderId: po.id } });
  await (prisma as any).purchaseOrder.delete({ where: { id: po.id } });
  console.log("\n  [Cleanup] Test PO removed.");

  await prisma.$disconnect();
  await pool.end();
}
main().catch(console.error);
