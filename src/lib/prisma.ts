import { PrismaClient } from "../generated/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  const baseClient = new PrismaClient({
    adapter,
    log: ["error"],
  });

  const extendedClient = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
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
            // Lazy import to break circular dependency with tenant.ts
            const { getTenantId } = await import("./tenant");
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

  return { extendedClient, baseClient };
};

const clients = globalThis as unknown as {
  prisma: any;
  basePrisma: any;
};

if (!clients.prisma) {
  const { extendedClient, baseClient } = prismaClientSingleton();
  clients.prisma = extendedClient;
  clients.basePrisma = baseClient;
}

export const basePrisma = clients.basePrisma;
const prisma = clients.prisma;
export default prisma;

if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = clients.prisma;
  (globalThis as any).basePrisma = clients.basePrisma;
}
