"use client";

import { Shield, Users, Settings, Activity, Lock } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          Admin Control Center
        </h1>
        <p className="text-muted-foreground font-medium">
          Manage platform-wide configurations and access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <div className="p-8 bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient-soft flex flex-col gap-6 group hover:border-primary/30 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
            <Users className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">Manage roles, permissions, and active sessions for all employees.</p>
          </div>
        </div>

        {/* System Policies */}
        <div className="p-8 bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient-soft flex flex-col gap-6 group hover:border-primary/30 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary transition-colors">
            <Lock className="w-8 h-8 text-secondary group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Security & RBAC</h3>
            <p className="text-sm text-muted-foreground">Configure global authentication policies and role-based access rules.</p>
          </div>
        </div>

        {/* Warehouse Config */}
        <div className="p-8 bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient-soft flex flex-col gap-6 group hover:border-primary/30 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
            <Settings className="w-8 h-8 text-amber-500 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Global Settings</h3>
            <p className="text-sm text-muted-foreground">Adjust warehouse capacity thresholds and system-wide default values.</p>
          </div>
        </div>
      </div>

      <div className="p-10 bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient flex flex-col gap-6">
          <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">System Integrity Audit</h2>
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border-ghost rounded-[2rem] text-muted-foreground font-medium italic">
              Live audit logs and security telemetry will appear here...
          </div>
      </div>
    </div>
  );
}
