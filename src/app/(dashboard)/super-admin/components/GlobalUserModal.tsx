"use client";

import { useEffect, useState } from "react";
import { X, User, Loader2, Save, Building2, Shield, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "@/lib/types";
import { AVAILABLE_PERMISSIONS } from "@/lib/permissions";

interface GlobalUserModalProps {
  isOpen: boolean;
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GlobalUserModal({ isOpen, user, onClose, onSuccess }: GlobalUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: UserRole.EMPLOYEE,
    companyId: "",
    customPermissions: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      if (user) {
        setFormData({
          name: user.name,
          username: user.username,
          password: "", // Don't show password
          role: user.role,
          companyId: user.companyId || "",
          customPermissions: user.customPermissions || []
        });
      } else {
        setFormData({
          name: "",
          username: "",
          password: "",
          role: UserRole.EMPLOYEE,
          companyId: "",
          customPermissions: []
        });
      }
    }
  }, [user, isOpen]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/super-admin/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error(error);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      customPermissions: prev.customPermissions.includes(perm)
        ? prev.customPermissions.filter(p => p !== perm)
        : [...prev.customPermissions, perm]
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = user 
        ? `/api/super-admin/users/${user.id}` 
        : "/api/super-admin/users";
      
      const method = user ? "PATCH" : "POST";

      const payload = {
        ...formData,
        companyId: formData.role === UserRole.SUPER_ADMIN ? null : formData.companyId
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save user");
      }

      toast.success(user ? "User updated" : "User created");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-4xl bg-surface-lowest rounded-[2.5rem] shadow-ambient overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-border-ghost flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="heading-md">{user ? "Edit User" : "Create User"}</h2>
              <p className="text-sm text-muted-foreground font-medium">Manage credentials and platform permissions.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-surface-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="John Doe" 
                  className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Username</label>
                <input 
                  required
                  type="text" 
                  placeholder="johndoe" 
                  className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <select 
                    required={formData.role !== UserRole.SUPER_ADMIN}
                    className="w-full pl-12 pr-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all disabled:opacity-50"
                    value={formData.role === UserRole.SUPER_ADMIN ? "" : formData.companyId}
                    disabled={formData.role === UserRole.SUPER_ADMIN}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    {formData.role === UserRole.SUPER_ADMIN ? (
                      <option value="">Platform Level (Global)</option>
                    ) : (
                      <>
                        <option value="">Select Company</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <select 
                    required
                    className="w-full pl-12 pr-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value={UserRole.EMPLOYEE}>Employee</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.OWNER}>Owner</option>
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-foreground ml-1">
                  {user ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input 
                  required={!user}
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Granular Permissions Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="heading-sm">Custom Permissions Overrides</h3>
              </div>
              <p className="text-xs text-muted-foreground font-medium bg-surface-low p-4 rounded-xl border border-border-ghost">
                These permissions will be granted to the user <strong className="text-foreground">in addition</strong> to their role's default permissions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <label 
                    key={perm} 
                    className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                      formData.customPermissions.includes(perm) 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-white border-border-ghost hover:border-primary/40'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-border-ghost text-primary focus:ring-primary transition-all cursor-pointer"
                      checked={formData.customPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground capitalize">
                        {perm.split(':').join(' ')}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border-ghost bg-surface-lowest shrink-0 flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 btn btn-secondary h-14 rounded-2xl"
          >
            Cancel
          </button>
          <button 
            form="user-form"
            type="submit"
            disabled={loading}
            className="flex-[2] btn btn-primary h-14 rounded-2xl"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {user ? "Save Changes" : "Create User"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
