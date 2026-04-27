"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Filter, Search, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PremiumSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  showSearch?: boolean;
}

export default function PremiumSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  icon,
  showSearch = true
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const displayValue = value === "all" || !value ? placeholder : value;

  return (
    <div className={cn("relative w-full", isOpen && "z-50")} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "input-field flex items-center justify-between gap-3 text-sm transition-all duration-300",
          isOpen && "border-primary/60 ring-4 ring-primary/10 shadow-glow bg-surface-lowest",
          disabled && "opacity-50 cursor-not-allowed grayscale"
        )}
      >
        <div className="flex items-center gap-3 truncate">
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "bg-surface-low text-muted-foreground"
          )}>
            {icon || <Filter className="w-3.5 h-3.5" />}
          </div>
          <span className={cn(
            "truncate transition-colors",
            !value || value === "all" ? "text-muted-foreground font-medium" : "text-foreground font-black"
          )}>
            {displayValue}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-colors duration-500",
          isOpen && "rotate-180 text-primary"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-[110] w-full mt-3 bg-white/80 backdrop-blur-xl border border-border-ghost rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 origin-top">
          {showSearch && (
            <div className="p-4 border-b border-border-ghost bg-surface-low/30">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field h-10 pl-11 pr-10 text-xs"
                />
                {searchQuery && (
                   <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 btn btn-ghost h-7 w-7 !p-0 rounded-md"
                   >
                     <X className="w-3.5 h-3.5 text-muted-foreground" />
                   </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto no-scrollbar py-2">
            <button
              onClick={() => {
                onChange("all");
                setIsOpen(false);
                setSearchQuery("");
              }}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-left transition-all relative group",
                (value === "all" || !value) ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-surface-low hover:text-foreground"
              )}
            >
              <span className="relative z-10">{placeholder}</span>
              {(value === "all" || !value) && <Check className="w-3.5 h-3.5" />}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-active:opacity-100 transition-opacity"></div>
            </button>
            
            <div className="h-px bg-border-ghost/40 my-2 mx-4"></div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-left transition-all relative group",
                    value === option ? "bg-primary/5 text-primary" : "text-foreground hover:bg-surface-low"
                  )}
                >
                  <span className="truncate relative z-10">{option}</span>
                  {value === option && <Check className="w-3.5 h-3.5" />}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-active:opacity-100 transition-opacity"></div>
                </button>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
