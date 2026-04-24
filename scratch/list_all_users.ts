import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Fetching all users from the local database...");
  const users = await prisma.user.findMany({
    include: {
      company: true
    }
  });

  console.log(`Total users found: ${users.length}`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. [${user.username}] ${user.name} (Role: ${user.role}, Company: ${user.company?.name || "None"})`);
    console.log(`   Password: ${user.password}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
