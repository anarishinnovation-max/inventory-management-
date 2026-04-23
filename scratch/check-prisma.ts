import prisma from "../src/lib/prisma";

async function main() {
  try {
    const po = await prisma.purchaseOrder.findMany({
      select: { paymentStatus: true },
      take: 1
    });
    console.log("Success! paymentStatus found.");
    console.log("Data:", po);
  } catch (error) {
    console.error("Failed to find paymentStatus.");
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
