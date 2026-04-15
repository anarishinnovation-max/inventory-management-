import prisma from "./src/lib/prisma";

async function check() {
    const count = await prisma.item.count();
    const items = await prisma.item.findMany({ take: 5, include: { category: true } });
    console.log("ITEM COUNT:", count);
    console.log("SAMPLE ITEMS:", JSON.stringify(items, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
