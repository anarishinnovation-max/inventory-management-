"use client";

import React from "react";
import { X, Keyboard, HelpCircle } from "lucide-react";
import { SHORTCUT_CONFIG } from "@/config/shortcuts";
import { useShortcuts } from "./ShortcutsProvider";

export default function ShortcutsHelpModal() {
  const { isHelpOpen, setHelpOpen } = useShortcuts();

  if (!isHelpOpen) return null;

  const categories = ["Navigation", "Actions", "System"];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={() => setHelpOpen(false)} 
      />

      {/* Modal Body */}
      <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-border-ghost bg-surface-low/30 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow">
              <Keyboard className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-foreground">Keyboard Shortcuts</h2>
              <p className="text-muted-foreground font-medium text-sm mt-1">Master your workflow with intuitive keys</p>
            </div>
          </div>
          <button 
            onClick={() => setHelpOpen(false)}
            className="w-12 h-12 rounded-full hover:bg-white hover:shadow-md border border-transparent hover:border-border-ghost flex items-center justify-center transition-all group"
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {categories.map((cat) => (
              <div key={cat} className="space-y-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 pb-4 border-b border-border-ghost">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {cat}
                </h3>
                <div className="space-y-5">
                  {SHORTCUT_CONFIG.filter(item => item.category === cat).map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, idx) => (
                          <kbd key={idx} className="px-2 py-1 rounded-lg bg-surface-low border border-border-ghost text-[9px] font-black shadow-sm text-muted-foreground uppercase min-w-[28px] text-center">
                            {k === "meta" ? "CMD" : k.toUpperCase()}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-surface-low/30 border-t border-border-ghost flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              Tip: Open the Command Palette with <kbd className="px-1 py-0.5 rounded bg-white border border-border-ghost ml-1">CTRL + K</kbd>
           </div>
           <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-50">Keyboard Protocol V1.0</p>
        </div>
      </div>
    </div>
  );
}
