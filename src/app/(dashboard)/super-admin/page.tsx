"use client";

import { useEffect, useState } from "react";
import { 
  Shield, 
  Building2, 
  Users, 
  ArrowRight, 
  Activity,
  LayoutDashboard,
  Plus
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Stats {
  companies: number;
  users: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ companies: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [compRes, userRes] = await Promise.all([
          fetch("/api/super-admin/companies"),
          fetch("/api/super-admin/users")
        ]);
        
        if (!compRes.ok || !userRes.ok) throw new Error("Failed to fetch statistics");
        
        const companies = await compRes.json();
        const users = await userRes.json();
        
        setStats({
          companies: companies.length,
          users: users.length
        });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="heading-xl tracking-tight flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          Super Admin Console
        </h1>
        <p className="text-muted-foreground font-medium">
          Centralized management for all companies, users, and platform-wide settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient-soft flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <span className="text-4xl font-black text-foreground">{loading ? "..." : stats.companies}</span>
          </div>
          <div>
            <h3 className="heading-md mb-1">Total Companies</h3>
            <p className="text-sm text-muted-foreground font-medium text-balance">Active tenants using the platform.</p>
          </div>
          <Link href="/super-admin/companies" className="btn btn-secondary w-full justify-between mt-2">
            Manage Companies
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-8 bg-surface-lowest border border-border-ghost rounded-[2.5rem] shadow-ambient-soft flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-secondary" />
            </div>
            <span className="text-4xl font-black text-foreground">{loading ? "..." : stats.users}</span>
          </div>
          <div>
            <h3 className="heading-md mb-1">Total Users</h3>
            <p className="text-sm text-muted-foreground font-medium text-balance">Users registered across all companies.</p>
          </div>
          <Link href="/super-admin/users" className="btn btn-secondary w-full justify-between mt-2">
            Manage All Users
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-10 bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient flex flex-col gap-8">
          <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="heading-lg">Platform Health</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 border border-border-ghost rounded-3xl bg-surface-low/50">
              <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Quick Actions</h4>
              <div className="flex flex-col gap-3">
                <Link href="/super-admin/companies?action=new" className="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-all font-bold text-sm">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                    <Plus className="w-4 h-4" />
                  </div>
                  Register New Company
                </Link>
                <Link href="/super-admin/users?action=new" className="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-all font-bold text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Plus className="w-4 h-4" />
                  </div>
                  Create Global User
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 border-2 border-dashed border-border-ghost rounded-[2rem] flex items-center justify-center text-muted-foreground font-medium italic">
                Platform logs and activity stream will appear here...
            </div>
          </div>
      </div>
    </div>
  );
}
