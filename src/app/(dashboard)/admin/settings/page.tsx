"use client";

import { useState, useEffect } from "react";
import { Settings, Save, ChevronLeft, Loader2, Building2, Bell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface CompanySettings {
  id: string;
  name: string;
  settings: {
    minStockThreshold?: number;
    emailAlertsEnabled?: boolean;
    warehouseZone?: string;
  };
}

export default function GlobalSettingsPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await fetch("/api/company");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setCompany({
        ...data,
        settings: data.settings || {}
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    try {
      const response = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: company.name,
          settings: company.settings
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");
      toast.success("Global settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Loading organization profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Admin Center
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Settings className="w-10 h-10 text-amber-500" />
            Global Settings
          </h1>
          <p className="text-muted-foreground font-medium">
            Configure platform-wide defaults and organization profile.
          </p>
        </div>
        
        <button 
          form="settings-form"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 shadow-ambient-primary transition-all self-start disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Organization Profile */}
        <div className="bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient overflow-hidden">
          <div className="p-8 border-b border-border-ghost bg-surface-low/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Organization Profile</h3>
          </div>
          <div className="p-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Company Display Name</label>
              <input 
                type="text" 
                value={company?.name || ""}
                onChange={(e) => setCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                placeholder="e.g. SS Cuttings Tool"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Default Warehouse Zone</label>
              <input 
                type="text" 
                value={company?.settings.warehouseZone || ""}
                onChange={(e) => setCompany(prev => prev ? { ...prev, settings: { ...prev.settings, warehouseZone: e.target.value } } : null)}
                className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                placeholder="e.g. Main Plant A"
              />
            </div>
          </div>
        </div>

        {/* System Defaults */}
        <div className="bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient overflow-hidden">
          <div className="p-8 border-b border-border-ghost bg-surface-low/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
              <Bell className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">System Defaults</h3>
          </div>
          <div className="p-10 flex flex-col gap-8">
            <div className="flex items-center justify-between p-6 bg-surface-muted rounded-3xl border border-border-ghost">
              <div className="flex flex-col gap-1">
                <span className="font-bold">Email Alerts</span>
                <span className="text-xs text-muted-foreground font-medium">Enable platform-wide critical stock notifications.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={company?.settings.emailAlertsEnabled ?? true}
                  onChange={(e) => setCompany(prev => prev ? { ...prev, settings: { ...prev.settings, emailAlertsEnabled: e.target.checked } } : null)}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-surface-lowest border-2 border-border-ghost peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-muted-foreground peer-checked:after:bg-primary after:border-border-ghost after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:border-primary/20 peer-checked:bg-primary/10"></div>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold">Critical Stock Threshold (%)</label>
                <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                  {company?.settings.minStockThreshold || 15}%
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={company?.settings.minStockThreshold || 15}
                onChange={(e) => setCompany(prev => prev ? { ...prev, settings: { ...prev.settings, minStockThreshold: parseInt(e.target.value) } } : null)}
                className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-primary border border-border-ghost"
              />
              <p className="text-xs text-muted-foreground font-medium italic">
                Items will be marked as "Critical" when stock levels fall below this percentage of their individual target.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

