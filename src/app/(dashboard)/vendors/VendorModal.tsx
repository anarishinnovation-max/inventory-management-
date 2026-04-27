"use client";

import { useState, useTransition } from "react";
import { Plus, X, Building2, Mail, Phone, IndianRupee, CreditCard, Landmark, Wallet } from "lucide-react";
import { createVendor } from "@/lib/user-actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PAYMENT_MODES = [
  { id: "Cash", icon: Wallet, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "Bank Transfer", icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "UPI", icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "Credit", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

export function VendorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState("Cash");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      contact: formData.get("contact") as string,
      preferredPaymentMode: selectedMode,
    };

    if (!data.name) {
      setError("Vendor name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createVendor(data);
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Failed to onboard vendor.");
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Onboard Vendor
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-lowest w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-200">
             <header className="px-10 pt-10 pb-6 flex items-center justify-between">
                <div>
                   <h2 className="text-3xl font-black text-foreground tracking-tight">Supply Onboarding</h2>
                   <p className="text-muted-foreground font-medium mt-1">Register a new verified vendor source for procurement.</p>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-3 rounded-2xl hover:bg-surface-low text-muted-foreground transition-all"
                >
                   <X className="w-6 h-6" />
                </button>
             </header>

             <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8">
                {error && (
                    <div className="p-4 rounded-2xl bg-error/10 text-error text-sm font-bold border border-error/1s0">
                        {error}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Vendor Entity Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                name="name"
                                required
                                placeholder="e.g. Global Tech Logistics Pvt Ltd"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Procurement Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                name="email"
                                type="email"
                                placeholder="orders@vendor.com"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Direct Support</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                name="contact"
                                placeholder="+91 98765 43210"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-4 block">Preferred Remittance Mode</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {PAYMENT_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setSelectedMode(mode.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group",
                                    selectedMode === mode.id 
                                        ? "bg-white border-primary shadow-lg shadow-primary/5" 
                                        : "bg-surface-low border-transparent hover:bg-surface-ghost"
                                )}
                            >
                                <div className={cn("p-2 rounded-xl transition-colors", mode.bg, mode.color)}>
                                    <mode.icon className="w-5 h-5" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tight",
                                    selectedMode === mode.id ? "text-foreground" : "text-muted-foreground"
                                )}>{mode.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border-ghost">
                    <button 
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-4 rounded-2xl bg-surface-low text-foreground font-black text-sm hover:bg-surface-ghost transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={isPending}
                        type="submit"
                        className="flex-[2] py-4 rounded-2xl bg-foreground text-surface-lowest font-black text-sm shadow-xl   transition-all disabled:opacity-50"
                    >
                        {isPending ? "Connecting to Ledger..." : "Authorize Fulfillment Contract"}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
}

