"use client";

import { useState } from "react";
import { X, Key, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({ isOpen, user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: user.username,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          password 
        }),
      });

      if (!response.ok) throw new Error("Failed to reset password");

      toast.success("Password reset successfully");
      setPassword("");
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
      
      <div className="relative w-full max-w-lg bg-surface-lowest rounded-[2.5rem] shadow-ambient overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border-ghost flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="heading-md">Force Reset Password</h2>
              <p className="text-sm text-muted-foreground font-medium">Reset password for {user.name}.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-surface-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground ml-1">New Password</label>
            <input 
              required
              type="text" 
              placeholder="Enter new secure password" 
              className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary h-14 rounded-2xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] btn btn-primary bg-amber-500 hover:bg-amber-600 text-white border-transparent h-14 rounded-2xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
