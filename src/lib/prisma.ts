import { PrismaClient } from "../generated/client";
import { getTenantId } from "./tenant";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Diagnostic logging for initialization
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ [Prisma] DATABASE_URL is not set in environment variables!");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  basePrisma: PrismaClient | undefined;
};

export const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient({
  adapter,
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.basePrisma = basePrisma;

const prisma = basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Skip tenant check for Tenant model itself to avoid recursion
          if (model === "Tenant") {
            return query(args);
          }

          const readOperations = [
            "findMany", 
            "findFirst", 
            "findUnique", 
            "findUniqueOrThrow", 
            "count", 
            "aggregate", 
            "groupBy"
          ];
          
          if (readOperations.includes(operation)) {
            try {
              const tenantId = await getTenantId();
              if (tenantId) {
                // Safely inject tenantId into the where clause
                (args as any).where = {
                  ...(args as any).where,
                  tenantId: tenantId,
                };
              }
            } catch (e) {
              // Log but don't crash the whole query if tenant resolution fails
              console.error(`❌ [Prisma Extension] Tenant resolution failed for ${model}.${operation}:`, e);
            }
          }

          try {
            return await query(args);
          } catch (e) {
            console.error(`❌ [Prisma Query Error] ${model}.${operation}:`, e);
            throw e;
          }
        },
      },
    },
});

export default prisma;
