import { cookies, headers } from "next/headers";
import { basePrisma } from "./prisma";

export async function getTenantId(): Promise<string | null> {
  let subdomain: string | null = null;
  
  try {
    const h = await headers();
    subdomain = h.get("x-tenant-subdomain");
  } catch (e) {
    // Silence error when called outside of request context (e.g. during build or static generation)
  }
  
  if (!subdomain || subdomain === "localhost" || subdomain === "admin") {
    // For local dev or default admin subdomain, return the first tenant as fallback
    // We use basePrisma here to avoid circular dependency and recursion with the tenant extension
    const defaultTenant = await (basePrisma as any).tenant.findFirst({
      where: { subdomain: "admin" }
    });
    return defaultTenant?.id || null;
  }

  const tenant = await (basePrisma as any).tenant.findFirst({
    where: { subdomain, isActive: true }
  });

  return tenant?.id || null;
}
