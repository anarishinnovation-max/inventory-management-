"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, X, ChevronRight } from "lucide-react";
import { SHORTCUT_CONFIG, ShortcutItem } from "@/config/shortcuts";
import { useShortcuts } from "./ShortcutsProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CommandPalette() {
  const { isPaletteOpen, setPaletteOpen } = useShortcuts();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredItems = SHORTCUT_CONFIG.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          if (item.href) router.push(item.href);
          else if (item.action) item.action();
          setPaletteOpen(false);
        }
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen, filteredItems, selectedIndex, router, setPaletteOpen]);

  if (!isPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/10 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={() => setPaletteOpen(false)} 
      />

      {/* Palette Body */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-border-ghost overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Search Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border-ghost bg-surface-low/30">
          <Search className="w-5 h-5 text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-foreground font-bold placeholder:text-muted-foreground placeholder:font-medium text-lg"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-low border border-border-ghost">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[400px] overflow-y-auto p-3 no-scrollbar">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      else if (item.action) item.action();
                      setPaletteOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group text-left",
                      isSelected 
                        ? "bg-primary text-white shadow-glow translate-x-1" 
                        : "hover:bg-surface-low text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                      isSelected ? "bg-white/20 border-white/20 text-white" : "bg-surface-low border-border-ghost text-primary"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight truncate">{item.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest border",
                          isSelected ? "bg-white/20 border-white/20 text-white" : "bg-primary/5 border-primary/10 text-primary"
                        )}>
                          {item.category}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs font-medium mt-0.5 truncate",
                        isSelected ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd key={kIdx} className={cn(
                          "px-1.5 py-1 rounded text-xs font-black uppercase border min-w-[24px] text-center",
                          isSelected ? "bg-white/20 border-white/10 text-white" : "bg-surface-low border-border-ghost text-muted-foreground"
                        )}>
                          {k === "meta" ? "CMD" : k.toUpperCase()}
                        </kbd>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-surface-low flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No matching commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-low/30 border-t border-border-ghost flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-1 rounded bg-white border border-border-ghost text-xs font-black shadow-sm">↑↓</kbd>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-1 rounded bg-white border border-border-ghost text-xs font-black shadow-sm">ENTER</kbd>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
             <Command className="w-3 h-3" />
             <span className="text-xs font-bold uppercase tracking-widest">Protocol V3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

