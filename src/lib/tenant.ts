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
  
  // List of subdomains that should always resolve to the default 'admin' tenant
  const adminFallbackSubdomains = ["localhost", "admin", "ims-azure-psi", "ims-azure"];

  try {
    if (!subdomain || adminFallbackSubdomains.includes(subdomain)) {
      const defaultTenant = await (basePrisma as any).tenant.findFirst({
        where: { subdomain: "admin" }
      });
      return defaultTenant?.id || null;
    }

    // Try to find a tenant by subdomain
    const tenant = await (basePrisma as any).tenant.findFirst({
      where: { subdomain, isActive: true }
    });

    if (tenant) {
        return tenant.id;
    }

    // FINAL FALLBACK: If no tenant is found for the subdomain, pick the first active tenant
    // This prevents 400/500 errors on unrecognized hostnames (like Vercel preview URLs)
    const fallbackTenant = await (basePrisma as any).tenant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (fallbackTenant) {
        console.warn(`[Tenant] No match for "${subdomain}", falling back to tenant: ${fallbackTenant.subdomain}`);
        return fallbackTenant.id;
    }

    return null;
  } catch (err) {
    console.error("[Tenant] Database error during tenant resolution:", err);
    return null; 
  }
}
