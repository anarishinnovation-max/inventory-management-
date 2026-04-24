"use client";

import { useState } from "react";
import { UserPlus, X, Loader2, User, Lock, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "@/lib/types";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: UserRole.EMPLOYEE
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success(`User ${formData.name} created successfully!`);
      onSuccess();
      onClose();
      setFormData({ username: "", password: "", name: "", role: UserRole.EMPLOYEE });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest border border-border-ghost w-full max-w-lg rounded-[3rem] shadow-ambient overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-10 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Add Team Member</h2>
                <p className="text-sm text-muted-foreground font-medium text-balance">Create a new account for your staff member.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-surface-muted rounded-2xl transition-colors"
            >
              <X className="w-7 h-7 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               {/* Name */}
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-bold ml-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. jdoe"
                  className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold ml-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                >
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.OWNER}>Owner</option>
                </select>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-bold ml-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set a secure password..."
                  className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-5 border border-border-ghost rounded-2xl font-black hover:bg-surface-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] p-5 bg-primary text-white rounded-2xl font-black hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-ambient-primary"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-6 h-6" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

