"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

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
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-4">

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
