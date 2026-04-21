import { cookies, headers } from "next/headers";
import prisma from "./prisma";

export async function getTenantId(): Promise<string | null> {
  const h = await headers();
  const subdomain = h.get("x-tenant-subdomain");
  
  if (!subdomain || subdomain === "localhost" || subdomain === "admin") {
    // For local dev or default admin subdomain, return the first tenant as fallback
    const defaultTenant = await (prisma as any).tenant.findFirst({
      where: { subdomain: "admin" }
    });
    return defaultTenant?.id || null;
  }

  const tenant = await (prisma as any).tenant.findFirst({
    where: { subdomain, isActive: true }
  });

  return tenant?.id || null;
}
