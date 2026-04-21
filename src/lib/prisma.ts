import { PrismaClient } from "../generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Reverted to a standard single-tenant client
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Return a clean Prisma instance without multi-tenant extensions
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
// Keeping basePrisma export to avoid breaking imports in the short term, but mapping it to the standard client
export const basePrisma = prisma;
