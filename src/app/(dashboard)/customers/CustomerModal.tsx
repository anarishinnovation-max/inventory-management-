"use client";

import { createCustomer } from "@/lib/user-actions";
import { Mail, MapPin, Phone, Plus, User, X } from "lucide-react";
import { useState, useTransition } from "react";

export function CustomerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      contact: formData.get("contact") as string,
      address: formData.get("address") as string,
    };

    if (!data.name) {
      setError("Customer name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createCustomer(data);
        setIsOpen(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Could not add customer";
        setError(errorMessage);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Customer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-lowest w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-200">
             <header className="px-10 pt-10 pb-6 flex items-center justify-between">
                <div>
                   <h2 className="text-3xl font-black text-foreground tracking-tight">Add New Customer</h2>
                   <p className="text-muted-foreground font-medium mt-1">Add a new customer</p>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-3 rounded-2xl hover:bg-surface-low text-muted-foreground transition-all"
                >
                   <X className="w-6 h-6" />
                </button>
             </header>

             <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-bold border border-error/20">
                        {error}
                    </div>
                )}
                
                <div className="space-y-4">
                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                name="name"
                                required
                                placeholder="e.g. John Smith or ABC Company"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    name="email"
                                    type="email"
                                    placeholder="john@company.com"
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    name="contact"
                                    placeholder="+1-123-456-7890"
                                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <textarea 
                                name="address"
                                rows={3}
                                placeholder="Street address or location"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
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
                        className="flex-2 py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isPending ? "Saving..." : "Save Customer"}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
}
