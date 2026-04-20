import { AsyncLocalStorage } from "async_hooks";

/**
 * Context structure for the current request.
 * Add other fields (user, etc.) if needed later.
 */
export interface TenantContext {
  tenantId: string;
  subdomain: string;
}

// Global instance of AsyncLocalStorage
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Executes a function within a specific tenant context.
 */
export function runWithTenantContext<T>(context: TenantContext, fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    tenantStorage.run(context, async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Gets the current tenant context from storage.
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Helper to get just the tenantId.
 */
export function getCurrentTenantId(): string | undefined {
  return getTenantContext()?.tenantId;
}
