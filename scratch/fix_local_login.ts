import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = "aniket";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Setting up user [${username}] locally...`);

  // Ensure Company exists
  const companyId = "ss-cuttings-id";
  await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: { id: companyId, name: "SS Cuttings Tool" }
  });

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: "OWNER",
      companyId: companyId
    },
    create: {
      username,
      password: hashedPassword,
      name: "Aniket Gupta",
      role: "OWNER",
      companyId: companyId
    }
  });

  console.log(`✅ User [${username}] is now ready with password [${password}].`);
  console.log(`   Linked to Company: ${companyId}`);
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
