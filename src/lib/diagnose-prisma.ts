import prisma from "./prisma";

async function main() {
  console.log("Item model found:", !!prisma.item);
  console.log("Inventory model found:", !!(prisma as any).inventory);
  console.log("InventoryTransaction model found:", !!(prisma as any).inventoryTransaction);
  console.log("Keys:", Object.keys(prisma).filter(k => k.match(/^[a-z]/i)));
  process.exit(0);
}

main();
