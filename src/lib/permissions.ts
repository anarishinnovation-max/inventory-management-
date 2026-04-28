import { UserRole } from "./types";

export type Permission = 
  | "*" // Full access
  | "items:*" | "items:view" | "items:create" | "items:update" | "items:delete" | "items:update-limited"
  | "stock:*" | "stock:view" | "stock:adjust"
  | "vendors:*" | "vendors:view" | "vendors:create" | "vendors:update" | "vendors:delete"
  | "po:*" | "po:view" | "po:create" | "po:update" | "po:delete"
  | "grn:*" | "grn:view" | "grn:create"
  | "rack:*" | "rack:view" | "rack:create" | "rack:update" | "rack:delete"
  | "reports:view"
  | "company:manage"
  | "users:view"
  | "users:manage"
  | "billing:access";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ["*"],
  [UserRole.OWNER]: [
    "items:*",
    "vendors:*",
    "po:*",
    "grn:*",
    "stock:*",
    "rack:*",
    "reports:view",
    "billing:access",
    "users:view"
  ],
  [UserRole.MANAGER]: [
    "items:*",
    "vendors:*",
    "po:*",
    "grn:*",
    "stock:*",
    "rack:*",
    "reports:view",
    "billing:access",
    "users:view"
  ],
  [UserRole.EMPLOYEE]: [
    "items:view",
    "items:update-limited",
    "rack:view",
    "rack:update",
    "stock:view",
    "reports:view",
    "po:view"
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;

  // Handle wildcard checks (e.g., if user has 'items:*' and asks for 'items:view')
  const [resource] = permission.split(":");
  if (permissions.includes(`${resource}:*` as Permission)) return true;

  return false;
}
