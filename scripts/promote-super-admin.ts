import { PrismaClient, UserRole } from "../src/generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import bcrypt from "bcryptjs";

async function main() {
  const username = process.argv[2] || "superadmin";
  const password = process.argv[3] || "admin123";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { username },
      update: { 
        role: UserRole.SUPER_ADMIN,
        companyId: null 
      },
      create: { 
        username,
        password: hashedPassword,
        name: "Platform Admin",
        role: UserRole.SUPER_ADMIN,
        companyId: null
      },
    });

    console.log(`Successfully created/promoted ${user.username} to SUPER_ADMIN`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password === "admin123" ? "(default: admin123)" : "********"}`);
  } catch (error) {
    console.error("Failed to setup Super Admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
