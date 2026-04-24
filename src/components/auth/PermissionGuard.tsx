"use client";

import React, { useEffect, useState } from "react";
import { Permission, ROLE_PERMISSIONS } from "@/lib/permissions";
import { UserRole } from "@/lib/types";

interface PermissionGuardProps {
  permission?: Permission;
  role?: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A client-side component to conditionally render content based on user permissions or role.
 * Note: This is for UX only. Always perform server-side checks for actual security.
 */
export function PermissionGuard({
  permission,
  role,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const [user, setUser] = useState<{ role: UserRole } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might fetch the user from a global state (Zustand, Context)
    // or an API endpoint that returns the current session.
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error("Failed to check auth", e);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (isLoading) return null;
  if (!user) return fallback;

  // Check role if specified
  if (role && user.role !== role) {
    // Special case: OWNER has access to everything
    if (user.role !== UserRole.OWNER) {
      return fallback;
    }
  }

  // Check permission if specified
  if (permission) {
    const permissions = ROLE_PERMISSIONS[user.role];

    const hasPermission = 
      permissions.includes("*") || 
      permissions.includes(permission) ||
      permissions.includes(`${permission.split(":")[0]}:*` as Permission);

    if (!hasPermission) return fallback;
  }

  return <>{children}</>;
}
