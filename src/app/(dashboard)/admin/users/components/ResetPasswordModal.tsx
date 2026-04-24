"use client";

import { useState } from "react";
import { Key, X, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ResetPasswordModalProps {
  user: { id: string; name: string; username: string } | null;
  onClose: () => void;
}

export default function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      toast.success(`Password for ${user.name} has been reset!`);
      onClose();
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
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reset Password</h2>
                <p className="text-sm text-muted-foreground">For {user.name} (@{user.username})</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-muted rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full p-4 bg-surface-muted border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground ml-1">
                Note: This will immediately overwrite the user's current password.
              </p>
            </div>

            <div className="flex gap-3">
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
                className="flex-[2] p-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
