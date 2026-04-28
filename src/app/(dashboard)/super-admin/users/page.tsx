"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Plus, 
  MoreVertical, 
  Settings2, 
  Trash2, 
  Loader2,
  Search,
  ArrowLeft,
  Building2,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Key
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import GlobalUserModal from "../components/GlobalUserModal";
import { useConfirm } from "@/hooks/use-confirm";
import { UserRole } from "@/lib/types";

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  companyId: string;
  createdAt: string;
  company: {
    name: string;
  } | null;
}

export default function GlobalUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [companies, setCompanies] = useState<any[]>([]);
  const confirm = useConfirm();

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/super-admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/super-admin/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const deleteUser = async (user: User) => {
    if (!(await confirm("Remove User", `Are you sure you want to remove ${user.name} from the platform?`))) return;

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success("User removed successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return <div className="badge badge-error gap-2"><ShieldCheck className="w-3 h-3" />SUPER</div>;
      case UserRole.OWNER: return <div className="badge badge-primary gap-2"><ShieldCheck className="w-3 h-3" />OWNER</div>;
      case UserRole.MANAGER: return <div className="badge badge-warning gap-2"><ShieldAlert className="w-3 h-3" />MANAGER</div>;
      default: return <div className="badge badge-neutral gap-2"><UserIcon className="w-3 h-3" />EMPLOYEE</div>;
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.company?.name || "Platform Admin").toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesCompany = companyFilter === "ALL" || 
      (companyFilter === "PLATFORM" ? !u.companyId : u.companyId === companyFilter);
      
    return matchesSearch && matchesRole && matchesCompany;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link 
            href="/super-admin" 
            className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="heading-xl tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            Global User Management
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage users across all tenants, reset passwords, and assign roles globally.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setSelectedUser(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary self-start"
        >
          <Plus className="w-5 h-5" />
          Create New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-surface-lowest border border-border-ghost rounded-2xl shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or username..." 
            className="w-full pl-12 pr-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48 relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select 
              className="w-full pl-12 pr-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="ALL">All Companies</option>
              <option value="PLATFORM">Platform Level</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 md:w-40 relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select 
              className="w-full pl-12 pr-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              <option value={UserRole.OWNER}>Owner</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.EMPLOYEE}>Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container animate-in delay-100">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="table-cell-header">User</th>
                  <th className="table-cell-header">Company</th>
                  <th className="table-cell-header">Role</th>
                  <th className="table-cell-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center font-black text-primary text-xl border border-border-ghost">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-lg">{user.name}</span>
                          <span className="text-sm text-muted-foreground font-medium">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        {user.company?.name || "Platform Admin"}
                      </div>
                    </td>
                    <td className="table-cell">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="p-3 hover:bg-surface-muted rounded-xl transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {activeMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-surface-lowest border border-border-ghost rounded-2xl shadow-ambient z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setIsModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-surface-muted rounded-xl transition-colors"
                            >
                              <Settings2 className="w-4 h-4 text-amber-500" />
                              Edit User & Role
                            </button>
                            <div className="h-px bg-border-ghost my-1" />
                            <button 
                              onClick={() => deleteUser(user)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GlobalUserModal 
        isOpen={isModalOpen}
        user={selectedUser}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
