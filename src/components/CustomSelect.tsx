"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Filter } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  label,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedValue = value === "all" ? "All Categories" : value;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 bg-white border border-border-ghost rounded-xl px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10",
          isOpen && "border-primary/50 ring-2 ring-primary/10 shadow-md",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <span className="truncate">{selectedValue || placeholder}</span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-border-ghost rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="max-h-60 overflow-y-auto py-2">
            <button
              onClick={() => {
                onChange("all");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-left transition-colors",
                value === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-low hover:text-foreground"
              )}
            >
              All Categories
              {value === "all" && <Check className="w-3 h-3" />}
            </button>
            <div className="h-px bg-border-ghost/50 my-1 mx-2"></div>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-left transition-colors",
                  value === option ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-low"
                )}
              >
                <span className="truncate">{option}</span>
                {value === option && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
