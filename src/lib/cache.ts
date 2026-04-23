import { unstable_cache } from "next/cache";

/**
 * Higher-order function to cache database queries.
 * @param fn The async function to cache.
 * @param keyParts Unique keys for the cache.
 * @param revalidate Seconds to wait before revalidating (default 60s).
 */
export function cacheQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  revalidate: number = 60
): T {
  return unstable_cache(fn, keyParts, {
    revalidate,
    tags: keyParts,
  }) as unknown as T;
}
