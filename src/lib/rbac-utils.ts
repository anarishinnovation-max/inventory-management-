import { getSession } from "./auth";
import { UserRole } from "./types";
import { hasPermission as checkPermission, Permission } from "./permissions";
import { redirect } from "next/navigation";

export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return checkPermission(session.role as UserRole, permission);
}

export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === UserRole.SUPER_ADMIN;
}

export async function isOwner(): Promise<boolean> {
  const session = await getSession();
  return session?.role === UserRole.OWNER || session?.role === UserRole.SUPER_ADMIN;
}

export async function isManager(): Promise<boolean> {
  const session = await getSession();
  return session?.role === UserRole.MANAGER || session?.role === UserRole.OWNER || session?.role === UserRole.SUPER_ADMIN;
}

export async function isEmployee(): Promise<boolean> {
  const session = await getSession();
  return session?.role === UserRole.EMPLOYEE;
}

/**
 * Server-side helper to ensure a user has a specific permission.
 * Throws a redirect or an error if the user is unauthorized.
 */
export async function requirePermission(permission: Permission) {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    // In a real app, you might want to redirect to an unauthorized page
    // or return a specific 403 response if it's an API route.
    throw new Error("Unauthorized: Missing permission " + permission);
  }
}

/**
 * Server-side helper to ensure a user has a specific role.
 */
export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session || session.role !== role) {
    throw new Error("Unauthorized: Requires role " + role);
  }
}
