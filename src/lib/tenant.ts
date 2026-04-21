import { cookies, headers } from "next/headers";
import { basePrisma } from "./prisma";

export async function getTenantId(): Promise<string | null> {
  let subdomain: string | null = null;
  
  try {
    const h = await headers();
    subdomain = h.get("x-tenant-subdomain");
  } catch (e) {
    // Expected during build or non-request contexts
  }
  
  try {
    if (!subdomain || subdomain === "localhost" || subdomain === "admin") {
      const defaultTenant = await (basePrisma as any).tenant.findFirst({
        where: { subdomain: "admin" }
      });
      return defaultTenant?.id || null;
    }

    const tenant = await (basePrisma as any).tenant.findFirst({
      where: { subdomain, isActive: true }
    });

    if (!tenant) {
        console.warn(`[Tenant] No active tenant found for subdomain: ${subdomain}`);
    }

    return tenant?.id || null;
  } catch (err) {
    console.error("[Tenant] Database error during tenant resolution:", err);
    return null; // Return null rather than crashing
  }
}
