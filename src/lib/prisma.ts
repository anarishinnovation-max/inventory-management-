import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const prismaClientSingleton = () => {
  // Use Vercel Postgres URL or fallback to DATABASE_URL
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("POSTGRES_URL or DATABASE_URL must be defined in production");
    }
    // In dev, we can fail softly or expect it to be in .env
    return new PrismaClient();
  }

  // Use the adapter for better edge/serverless compatibility
  const pool = new Pool({ 
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 1, // Limited connections for serverless
    idleTimeoutMillis: 30000,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

// Simplified type check for the delegate
function isPrismaClient(client: any): client is ReturnType<typeof prismaClientSingleton> {
  return client && typeof client === "object" && "$connect" in client;
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma && isPrismaClient(globalThis.prisma)
  ? globalThis.prisma
  : prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
