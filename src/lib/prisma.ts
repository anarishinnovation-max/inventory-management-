import { PrismaClient } from "../generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Reverted to a standard single-tenant client
let connectionString = env.DATABASE_URL;

// Diagnostic Log (Masked)
console.log(`[PRISMA] Initializing with DB: ${connectionString.split('@')[1] || 'URL masked'}`);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Suppress pg security warning by explicitly handling SSL configuration
const isProduction = process.env.NODE_ENV === "production";

// Parse connection string to handle SSL and other options
let poolConfig: any = {
  connectionString,
  max: isProduction ? 10 : 2,
  idleTimeoutMillis: 30000,
};

// Vercel/Production often requires SSL, but we want to avoid the driver's alias warning
if (isProduction || connectionString.includes("sslmode=")) {
  poolConfig.ssl = {
    rejectUnauthorized: false, // Set to true if you have the CA certificate
  };
}

// Limit connections for Serverless environments and cache the pool
const pool = globalForPrisma.pool ?? new Pool(poolConfig);
const adapter = new PrismaPg(pool);

// Return a clean Prisma instance without multi-tenant extensions
// FORCING NEW CLIENT TO PICK UP NEW SCHEMA AND REUSING IN DEVELOPMENT TO PREVENT CONNECTION LEAKS
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
globalForPrisma.pool = pool;

export default prisma;
// Keeping basePrisma export to avoid breaking imports in the short term, but mapping it to the standard client
export const basePrisma = prisma;
