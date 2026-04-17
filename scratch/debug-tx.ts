import prisma from "../src/lib/prisma";

async function check() {
  try {
    const count = await prisma.inventoryTransaction.count();
    console.log(`TOTAL TRANSACTIONS: ${count}`);
    const latest = await prisma.inventoryTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { item: true }
    });
    console.log("LATEST 5:", JSON.stringify(latest, null, 2));
  } catch (err) {
    console.error("DEBUG ERROR:", err);
  } finally {
    process.exit(0);
  }
}

check();
