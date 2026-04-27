"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  User as UserIcon, 
  MoreVertical, 
  Trash2, 
  Key, 
  ChevronLeft,
  Loader2,
  Settings2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ResetPasswordModal from "./components/ResetPasswordModal";
import AddUserModal from "./components/AddUserModal";
import EditUserModal from "./components/EditUserModal";
import { UserRole } from "@/lib/types";
import { useConfirm } from "@/hooks/use-confirm";

interface TeamMember {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetUser, setResetUser] = useState<TeamMember | null>(null);
  const [editUser, setEditUser] = useState<TeamMember | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return <ShieldCheck className="w-4 h-4 text-primary" />;
      case UserRole.MANAGER: return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default: return <UserIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!(await confirm("Remove Member", `Are you sure you want to remove ${name} from the company? This action is irreversible.`))) return;

    try {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success(`${name} removed successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
            <Users className="w-10 h-10 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage roles, access levels, and security for your entire team.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 shadow-ambient-primary transition-all self-start"
        >
          <UserPlus className="w-5 h-5" />
          Add Team Member
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface-lowest border border-border-ghost rounded-[3rem] shadow-ambient overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading team members...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-ghost">
                  <th className="px-8 py-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                  <th className="px-8 py-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-8 py-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="px-8 py-6 text-sm font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-surface-muted/50 transition-colors">
                    <td className="px-8 py-6">
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
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-muted border border-border-ghost w-fit">
                        {getRoleIcon(user.role)}
                        <span className="text-sm font-bold uppercase tracking-wider">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-muted-foreground font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
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
                                setResetUser(user);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-surface-muted rounded-xl transition-colors"
                            >
                              <Key className="w-4 h-4 text-primary" />
                              Reset Password
                            </button>
                            <button 
                              onClick={() => {
                                setEditUser(user);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-surface-muted rounded-xl transition-colors"
                            >
                              <Settings2 className="w-4 h-4 text-amber-500" />
                              Edit Member Info
                            </button>
                            <div className="h-px bg-border-ghost my-1" />
                            <button 
                              onClick={() => deleteUser(user.id, user.name)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Member
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

      <ResetPasswordModal 
        user={resetUser} 
        onClose={() => setResetUser(null)} 
      />

      <EditUserModal 
        user={editUser} 
        onClose={() => setEditUser(null)} 
        onSuccess={() => {
          setEditUser(null);
          fetchUsers();
        }}
      />

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
}
