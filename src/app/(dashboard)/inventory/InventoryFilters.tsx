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
    { label: "Out of Stock", value: "outofstock" },
    { label: "Urgent", value: "urgent" },
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

  const getActiveFilterLabel = () => {
    const active = [];
    if (currentStatus !== 'all') {
      const s = statuses.find(s => s.value === currentStatus)?.label || 
                activityOptions.find(o => o.id === currentStatus)?.name;
      if (s) active.push(s);
    }
    if (currentCategory !== 'all') active.push(currentCategory);
    if (searchQuery) active.push(`Search: ${searchQuery}`);
    
    return active.length > 0 ? `(${active.join(', ')})` : '';
  };

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
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              {hasActiveFilters ? (
                <>
                  Showing <span className="text-foreground">{filteredCount}</span> out of <span className="text-foreground">{totalCount}</span>
                  <span className="text-muted-foreground/30 mx-1">|</span>
                  Total: <span className="text-foreground">{totalFilteredQuantity.toLocaleString()} Units</span>
                  <span className="text-primary/60 ml-1.5">{getActiveFilterLabel()}</span>
                  <button 
                    onClick={clearFilters}
                    className="ml-2 hover:text-primary transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
                  >
                    Clear All
                  </button>
                </>
              ) : (
                <>
                  Showing <span className="text-foreground">{totalCount}</span> items 
                  <span className="text-muted-foreground/30 mx-1">|</span> 
                  Total: <span className="text-foreground">{absoluteTotalQuantity.toLocaleString()} Units</span>
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
              className="btn btn-error h-11 px-6 text-[10px] bg-error/5 text-error border-error/10"
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
