"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, X, Tag, Search, Check } from "lucide-react";
import { useState, useTransition, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchableSelect } from "@/components/SearchableSelect";
import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryFiltersProps {
  currentStatus: string;
  currentCategory: string;
  categories: string[];
  searchQuery: string;
  filteredCount: number;
  totalCount: number;
  totalFilteredQuantity: number;
  absoluteTotalQuantity: number;
}

export default function InventoryFilters({
  currentStatus,
  currentCategory,
  categories,
  searchQuery,
  filteredCount,
  totalCount,
  totalFilteredQuantity,
  absoluteTotalQuantity,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statuses = [
    { label: "All Items", value: "all" },
    { label: "In Stock", value: "instock" },
    { label: "Low Stock", value: "low" },
    { label: "Urgent", value: "urgent" },
    { label: "Out of Stock", value: "outofstock" },
    { label: "Ordered", value: "ordered" },
  ];

  const activityOptions = [
    { id: "all", name: "All Actions" },
    { id: "latest_sent", name: "Latest Sent" },
    { id: "latest_received", name: "Latest Received" },
  ];

  const categoryOptions = [
    { id: "all", name: "All Categories" },
    ...categories.map(c => ({ id: c, name: c }))
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

  const hasActiveFilters = currentStatus !== "all" || currentCategory !== "all" || searchQuery !== "";


  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl space-y-2">
          <SearchInput
            defaultValue={searchQuery}
            placeholder="Search items, SKU, or Rack..."
          />
          <div className="px-4 transition-all duration-300 animate-in fade-in slide-in-from-left-2">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              {hasActiveFilters ? (
                <>
                  Showing Inventory:<span className="text-foreground">{filteredCount}</span> out of <span className="text-foreground">{totalCount}</span>
                  <div className="flex flex-wrap items-center gap-2 ml-2">
                    {currentStatus !== 'all' && (
                      <button 
                        onClick={() => updateFilter('status', 'all')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-all group animate-in zoom-in-95 duration-300"
                      >
                        <span className="text-xs font-black uppercase tracking-widest">
                          {statuses.find(s => s.value === currentStatus)?.label || 
                           activityOptions.find(o => o.id === currentStatus)?.name}
                        </span>
                        <X className="w-3 h-3 text-primary/40 group-hover:text-primary transition-colors" />
                      </button>
                    )}
                    {currentCategory !== 'all' && (
                      <button 
                        onClick={() => updateFilter('category', 'all')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/5 text-blue-600 border border-blue-500/20 hover:bg-blue-500/10 transition-all group animate-in zoom-in-95 duration-300"
                      >
                        <span className="text-xs font-black uppercase tracking-widest">{currentCategory}</span>
                        <X className="w-3 h-3 text-blue-600/40 group-hover:text-blue-600 transition-colors" />
                      </button>
                    )}
                    {searchQuery && (
                      <button 
                        onClick={() => updateFilter('q', '')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 text-amber-600 border border-amber-500/20 hover:bg-amber-500/10 transition-all group animate-in zoom-in-95 duration-300"
                      >
                        <span className="text-xs font-black uppercase tracking-widest">Search: {searchQuery}</span>
                        <X className="w-3 h-3 text-amber-600/40 group-hover:text-amber-600 transition-colors" />
                      </button>
                    )}
                    <button 
                      onClick={clearFilters}
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4 ml-2"
                    >
                      Clear All
                    </button>
                  </div>
                </>
              ) : (
                <>
                  Showing Inventory:<span className="text-foreground">{totalCount}</span> items 
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dropdowns on the Right */}
        <div className="flex flex-wrap items-center gap-4 mt-0.5">
          {/* Stock Status Dropdown */}
          <div className="w-[200px]">
             <SearchableSelect 
               items={statuses.map(s => ({ id: s.value, name: s.label }))}
               value={currentStatus.startsWith('latest_') ? 'all' : currentStatus}
               onChange={(val) => updateFilter("status", val)}
               placeholder="All Items"
               label="BY ITEM"
               className="!rounded-full h-11"
             />
          </div>

          {/* Activity Dropdown - Custom */}
          <div className="w-[200px]">
             <SearchableSelect 
               items={activityOptions}
               value={currentStatus.startsWith('latest_') ? currentStatus : 'all'}
               onChange={(val) => updateFilter("status", val)}
               placeholder="All Actions"
               label="BY ACTION"
               className="!rounded-full h-11"
             />
          </div>

          {/* Category Dropdown - Custom */}
          <div className="w-[220px]">
             <SearchableSelect 
               items={categoryOptions}
               value={currentCategory}
               onChange={(val) => updateFilter("category", val)}
               placeholder="All Categories"
               label="BY CATEGORY"
               className="!rounded-full h-11"
             />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-error h-11 px-6 text-xs bg-error/5 text-error border-error/10"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

