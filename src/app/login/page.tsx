"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { handleLoginAction } from "@/lib/user-actions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    startTransition(async () => {
      const result = await handleLoginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md px-4 animate-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl primary-gradient shadow-glow mb-6 transform hover:rotate-6 transition-transform duration-500">
            <Lock className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">IMS Portal</h1>
          <p className="text-muted-foreground font-medium">Inventory Management System</p>
        </div>

        <div className="card-premium p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/70 ml-1 tracking-wide uppercase text-xs">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                  <User strokeWidth={2.5} className="w-full h-full" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field input-with-icon"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/70 ml-1 tracking-wide uppercase text-xs">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                  <Lock strokeWidth={2.5} className="w-full h-full" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff strokeWidth={2.5} className="w-5 h-5" />
                  ) : (
                    <Eye strokeWidth={2.5} className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-in bg-error/10 border border-error/20 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error" />
                <p className="text-error text-xs font-bold uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-4 text-lg"
            >
              {isPending ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-muted-foreground/60 max-w-[280px] mx-auto leading-relaxed">
            Precision inventory management for the <span className="text-foreground">modern built environment.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

