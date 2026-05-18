"use client";

import { Lock, ShieldCheck, ShieldAlert, User as UserIcon, ChevronLeft, Info } from "lucide-react";
import Link from "next/link";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { UserRole } from "@/lib/types";

export default function SecurityPage() {
  const roles = Object.values(UserRole);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return <ShieldCheck className="w-6 h-6 text-primary" />;
      case UserRole.MANAGER: return <ShieldAlert className="w-6 h-6 text-amber-500" />;
      default: return <UserIcon className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return "Highest level of access. Can manage users, billing, and all platform settings.";
      case UserRole.MANAGER: return "Operational control. Can manage inventory, orders, and view reports, but cannot manage team members.";
      default: return "Basic access. Restricted to viewing data and recording limited stock updates.";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin Center
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground flex items-center gap-3">
          <Lock className="w-10 h-10 text-secondary" />
          Security & RBAC
        </h1>
        <p className="text-muted-foreground font-medium">
          View and configure role-based access control policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {roles.map((role) => (
          <div key={role} className="flex flex-col bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient overflow-hidden">
            <div className="p-8 border-b border-border-ghost bg-surface-low/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-2xl border border-border-ghost shadow-sm">
                  {getRoleIcon(role)}
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase">{role}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {getRoleDescription(role)}
              </p>
            </div>
            
            <div className="p-8 flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Active Permissions
              </h4>
              <div className="flex flex-wrap gap-2">
                {ROLE_PERMISSIONS[role].map((permission) => (
                  <span 
                    key={permission}
                    className="px-3 py-1.5 bg-surface-muted border border-border-ghost rounded-xl text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    {permission}
                  </span>
                ))}
                {ROLE_PERMISSIONS[role].includes("*") && (
                  <span className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold uppercase tracking-wider text-primary">
                    Full Access (Superuser)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-10 bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
              <Info className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">Policy Management</h2>
              <p className="text-muted-foreground font-medium max-w-3xl">
                  Permissions are currently centrally managed in the platform core to ensure security integrity. 
                  If you need custom permissions for specific staff members, please contact technical support to update your organization's security profile.
              </p>
          </div>
      </div>
    </div>
  );
}

