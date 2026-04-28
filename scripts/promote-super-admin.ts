import { PrismaClient, UserRole } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.argv[2];

  if (!username) {
    console.error("Please provide a username: npm run promote <username>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { username },
      data: { role: UserRole.SUPER_ADMIN },
    });

    console.log(`Successfully promoted ${user.username} to SUPER_ADMIN`);
  } catch (error) {
    console.error("Failed to promote user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
