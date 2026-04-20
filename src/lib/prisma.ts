import { PrismaClient } from "../generated/client";
import { getTenantId } from "./tenant";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // Use the native driver adapter as required by Prisma 7 for this environment
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: ["error"],
  }).$extends({
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
};

type PrismaClientExtended = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
