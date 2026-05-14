const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.item.findMany({
    include: {
      category: true
    }
  });
  const companies = await prisma.company.findMany();
  const vendors = await prisma.vendor.findMany();
  
  console.log('--- ITEMS ---');
  console.log(JSON.stringify(items, null, 2));
  console.log('--- COMPANIES ---');
  console.log(JSON.stringify(companies, null, 2));
  console.log('--- VENDORS ---');
  console.log(JSON.stringify(vendors, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
