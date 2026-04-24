"use client";

import { useState, useEffect } from "react";
import { User, X, Loader2, ShieldCheck, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import { UserRole } from "@/lib/types";

interface EditUserModalProps {
  user: { id: string; name: string; username: string; role: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "EMPLOYEE"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        role: user.role
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-lowest border border-border-ghost w-full max-w-md rounded-[2.5rem] shadow-ambient overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-xl font-bold">Edit Member</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-muted rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1 text-muted-foreground">Access Level (Role)</label>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-muted rounded-2xl border border-border-ghost">
                {Object.values(UserRole).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      formData.role === r 
                        ? "bg-white text-primary shadow-sm border border-border-ghost" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-4 border border-border-ghost rounded-2xl font-bold hover:bg-surface-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] p-4 bg-secondary text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
