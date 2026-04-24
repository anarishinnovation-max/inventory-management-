import { PrismaClient } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { UserRole } from "../src/lib/types";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: npx tsx scratch/add_company.ts <CompanyName> <AdminUsername> [AdminPassword]");
    process.exit(1);
  }

  const companyName = args[0];
  const adminUsername = args[1];
  const adminPassword = args[2] || "admin123";
  const companyId = companyName.toLowerCase().replace(/\s+/g, '-');

  console.log(`Adding new company: ${companyName}...`);

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: { name: companyName },
    create: {
      id: companyId,
      name: companyName,
    },
  });

  // 2. Create Owner
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      name: `${companyName} Admin`,
      role: UserRole.OWNER,
      companyId: company.id,
      password: hashedPassword
    },
    create: {
      username: adminUsername,
      password: hashedPassword,
      name: `${companyName} Admin`,
      role: UserRole.OWNER,
      companyId: company.id,
    },
  });

  console.log(`✅ Success!`);
  console.log(`Company: ${company.name} (ID: ${company.id})`);
  console.log(`Admin Login:`);
  console.log(`- Username: ${user.username}`);
  console.log(`- Password: ${adminPassword}`);
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
