import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

function hasInventoryBatchDelegate(client: unknown): client is ReturnType<typeof prismaClientSingleton> {
  return !!client && typeof client === "object" && "inventoryBatch" in client;
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// In dev, Next's module reloading can keep an older PrismaClient instance alive on globalThis.
// If the schema/client was regenerated (new models), refresh the singleton automatically.
const prisma = (globalThis.prisma && hasInventoryBatchDelegate(globalThis.prisma))
  ? globalThis.prisma
  : prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
