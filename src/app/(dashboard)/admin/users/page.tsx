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
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const confirm = useConfirm();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserRole(data.role as UserRole);
      }
    } catch (err) {
      console.error("Failed to fetch current user", err);
    }
  };

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
    fetchCurrentUser();
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
          <h1 className="heading-xl tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage roles, access levels, and security for your entire team.
          </p>
        </div>
        
        {currentUserRole === UserRole.SUPER_ADMIN && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary self-start"
          >
            <UserPlus className="w-5 h-5" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="table-container animate-in delay-100">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading team members...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="table-cell-header">Member</th>
                  <th className="table-cell-header">Role</th>
                  <th className="table-cell-header">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {users.map((user) => (
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
                      <div className={`badge gap-2 ${
                        user.role === UserRole.OWNER ? 'badge-primary' : 
                        user.role === UserRole.MANAGER ? 'badge-warning' : 
                        'badge-neutral'
                      }`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-muted-foreground font-medium">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
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
