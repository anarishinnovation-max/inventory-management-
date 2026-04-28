
import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to add missing column...");
    await prisma.$executeRawUnsafe('ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;');
    console.log("Column added or already exists.");
  } catch (e) {
    console.error("Error executing SQL:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
