"use client";

import { Bell, Search, Plus, Command, User, Settings as SettingsIcon, ShoppingCart, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-border-ghost' : 'bg-transparent'}`}>
      <div className="flex items-center justify-between px-8 py-4">
        {/* Global Search */}
        <div className="relative group w-full max-w-md">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
           </div>
           <input
             type="text"
             className="block w-full pl-11 pr-14 py-2.5 bg-surface-low/50 border border-transparent rounded-xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium text-sm placeholder:text-muted-foreground/60"
             placeholder="Search anything... (Cmd+K)"
             suppressHydrationWarning
           />
           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <kbd className="hidden sm:inline-flex items-center gap-1 h-5 px-1.5 font-sans text-[10px] font-bold text-muted-foreground bg-surface-low border border-border-ghost rounded-md">
               <Command className="w-2.5 h-2.5" /> K
             </kbd>
           </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded-xl text-sm font-bold shadow-premium hover:opacity-90 active:scale-95 transition-all" 
              suppressHydrationWarning
            >
               <Plus className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-45")} />
               <span>Quick Entry</span>
            </button>

            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-surface-lowest border border-border-ghost rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 space-y-1">
                    <Link 
                      href="/inventory/new" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-surface-low rounded-xl transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-4 h-4" />
                      </div>
                      New Item
                    </Link>
                    <Link 
                      href="/orders/purchase/new" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-surface-low rounded-xl transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      Purchase Order
                    </Link>
                    <Link 
                      href="/orders/dispatch/new" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-surface-low rounded-xl transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-4 h-4" />
                      </div>
                      Dispatch Items
                    </Link>
                    <div className="h-px bg-border-ghost my-2 mx-4" />
                    <Link 
                      href="/vendors" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-surface-low rounded-xl transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-low text-muted-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                        <SettingsIcon className="w-4 h-4" />
                      </div>
                      Manage Vendors
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border-ghost mx-2" />

          <button className="relative p-2.5 text-muted-foreground hover:bg-surface-low hover:text-foreground rounded-xl transition-all" suppressHydrationWarning>
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white shadow-sm" />
          </button>

          <button className="p-0.5 border-2 border-transparent hover:border-primary/20 rounded-full transition-all active:scale-95 overflow-hidden" suppressHydrationWarning>
             <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs uppercase">
                ND
             </div>
          </button>
        </div>
      </div>
    </header>
  );
}
