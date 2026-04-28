"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, X, Tag } from "lucide-react";
import { useState, useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryFiltersProps {
  currentStatus: string;
  currentCategory: string;
  categories: string[];
}

export default function InventoryFilters({
  currentStatus,
  currentCategory,
  categories,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses = [
    { label: "All Items", value: "all" },
    { label: "In Stock", value: "instock" },
    { label: "Low Stock", value: "low" },
    { label: "Out of Stock", value: "outofstock" },
    { label: "Urgent", value: "urgent" },
    { label: "Ordered", value: "ordered" },
  ];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to first page on filter change
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push("/inventory");
    });
  };

  const hasActiveFilters = currentStatus !== "all" || currentCategory !== "all";

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Pills */}
        <div className="flex bg-surface-low/50 p-1 rounded-full border border-border-ghost overflow-x-auto no-scrollbar max-w-full">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => updateFilter("status", s.value)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                currentStatus === s.value
                  ? "bg-white text-primary shadow-sm border border-border-ghost"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-low"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "btn ml-auto h-11 px-6 text-[10px]",
            isExpanded || currentCategory !== "all"
              ? "btn-primary"
              : "btn-neutral"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{isExpanded ? "Hide Filters" : "More Filters"}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-all", isExpanded && "opacity-50")} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-error h-11 px-6 text-[10px] bg-error/5 text-error border-error/10"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="grid">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Tag className="w-3 h-3" /> Filter by Category
                </label>
                <div className="flex flex-wrap gap-2">
                   <button 
                     onClick={() => updateFilter("category", "all")}
                     className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        currentCategory === 'all' 
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                          : "bg-surface-low text-muted-foreground border-border-ghost hover:border-primary/30"
                     )}
                   >
                     All Categories
                   </button>
                   {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => updateFilter("category", cat)}
                        className={cn(
                           "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                           currentCategory === cat 
                             ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                             : "bg-surface-low text-muted-foreground border-border-ghost hover:border-primary/30"
                        )}
                      >
                        {cat}
                      </button>
                   ))}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
