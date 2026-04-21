import { PrismaClient } from "../generated/client";
import { getTenantId } from "./tenant";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
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
          // Skip tenant check for Tenant model itself
          if (model === "Tenant") {
            return query(args);
          }

          // We only automate isolation for READ operations to keep TypeScript happy.
          // CREATE, UPDATE, DELETE are handled explicitly in the service layer 
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
            const tenantId = await getTenantId();
            if (tenantId) {
              (args as any).where = {
                ...(args as any).where,
                tenantId: tenantId,
              };
            }
          }

          return query(args);
        },
      },
    },
});

export default prisma;
