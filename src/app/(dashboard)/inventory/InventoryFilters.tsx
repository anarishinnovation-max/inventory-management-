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
}

export default function InventoryFilters({
  currentStatus,
  currentCategory,
  categories,
  searchQuery,
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

  const hasActiveFilters = currentStatus !== "all" || currentCategory !== "all" || searchQuery !== "";

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <SearchInput
            defaultValue={searchQuery}
            placeholder="Search items, SKU, or Rack..."
          />
        </div>

        {/* Dropdowns on the Right */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Stock Status Dropdown */}
          <div className="w-[180px]">
             <SearchableSelect 
               items={statuses.map(s => ({ id: s.value, name: s.label }))}
               value={currentStatus.startsWith('latest_') ? 'all' : currentStatus}
               onChange={(val) => updateFilter("status", val)}
               placeholder="Stock Status"
               className="!rounded-full h-11"
             />
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
          <div className="w-[200px]">
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
    </div>
  );
}
