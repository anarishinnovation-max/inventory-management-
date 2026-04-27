import { PrismaClient } from "../generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Reverted to a standard single-tenant client
let connectionString = process.env.DATABASE_URL || "";

// Suppress pg-connection-string security warning by explicitly setting sslmode
if (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://")) {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
      connectionString = url.toString();
    }
  } catch (e) {
    // Let pg handle any invalid URL formats
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Limit connections for Serverless environments and cache the pool
const pool = globalForPrisma.pool ?? new Pool({ 
  connectionString,
  max: 2, // Restrict max connections per serverless instance
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

// Return a clean Prisma instance without multi-tenant extensions
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;
// Keeping basePrisma export to avoid breaking imports in the short term, but mapping it to the standard client
export const basePrisma = prisma;
