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
  | "users:*" | "users:view" | "users:manage"
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
    "users:*"
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
    "users:*"
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

export const AVAILABLE_PERMISSIONS: Permission[] = [
  "items:view", "items:create", "items:update", "items:delete", "items:update-limited",
  "stock:view", "stock:adjust",
  "vendors:view", "vendors:create", "vendors:update", "vendors:delete",
  "po:view", "po:create", "po:update", "po:delete",
  "grn:view", "grn:create",
  "rack:view", "rack:create", "rack:update", "rack:delete",
  "reports:view",
  "company:manage",
  "users:view", "users:manage",
  "billing:access"
];

export function hasPermission(userRole: UserRole, permission: Permission, customPermissions: string[] = []): boolean {
  // 1. Check custom overrides first
  if (customPermissions.includes("*")) return true;
  if (customPermissions.includes(permission)) return true;
  
  const [resource] = permission.split(":");
  if (customPermissions.includes(`${resource}:*` as Permission)) return true;

  // 2. Fallback to Role Default Permissions
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;

  if (permissions.includes(`${resource}:*` as Permission)) return true;

  return false;
}
