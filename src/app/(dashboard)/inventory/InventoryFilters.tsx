"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, X, Tag, Search, Check } from "lucide-react";
import { useState, useTransition, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchableSelect } from "@/components/SearchableSelect";

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

  const statuses = [
    { label: "All Items", value: "all" },
    { label: "In Stock", value: "instock" },
    { label: "Low Stock", value: "low" },
    { label: "Out of Stock", value: "outofstock" },
    { label: "Urgent", value: "urgent" },
    { label: "Ordered", value: "ordered" },
  ];

  const activityOptions = [
    { id: "latest_sent", name: "Latest Sent" },
    { id: "latest_received", name: "Latest Received" },
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

        {/* Activity Dropdown - Custom */}
        <div className="w-[180px]">
           <SearchableSelect 
             items={activityOptions}
             value={currentStatus.startsWith('latest_') ? currentStatus : 'all'}
             onChange={(val) => updateFilter("status", val)}
             placeholder="Activity Log"
             className="!rounded-full h-11"
           />
        </div>

        {/* Category Dropdown - Custom */}
        <div className="w-[220px]">
           <SearchableSelect 
             items={categories.map(c => ({ id: c, name: c }))}
             value={currentCategory}
             onChange={(val) => updateFilter("category", val)}
             placeholder="All Categories"
             className="!rounded-full h-11"
           />
        </div>

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
    </div>
  );
}
