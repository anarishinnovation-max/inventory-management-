import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      items: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  console.log(JSON.stringify(pos, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
