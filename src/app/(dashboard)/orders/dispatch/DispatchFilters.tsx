"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, ChevronDown, X, Clock, CheckCircle2, LayoutGrid, Loader2, Truck } from "lucide-react";
import { useState, useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchableSelect } from "@/components/SearchableSelect";
import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DispatchFiltersProps {
  searchQuery?: string;
  currentStatus?: string;
  selectedCount?: number;
  onBulkDispatch?: () => void;
  onBulkCancel?: () => void;
  onClearSelection?: () => void;
  isProcessing?: boolean;
}

const statusOptions = [
  { id: "all", name: "All Bills" },
  { id: "pending", name: "Pending" },
  { id: "dispatched", name: "Sent" },
];

export function DispatchFilters({
  searchQuery,
  currentStatus = "all",
  selectedCount = 0,
  onBulkDispatch,
  onBulkCancel,
  onClearSelection,
  isProcessing = false
}: DispatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      {/* Search Bar on the Left */}
      <div className="flex-1 max-w-2xl">
        <SearchInput 
          defaultValue={searchQuery} 
          placeholder="Search Customer or Order ID..."
        />
      </div>

      {/* Filters or Bulk Actions on the Right */}
      {selectedCount > 0 ? (
        <div className="flex items-center gap-3 animate-in slide-in-from-right duration-300 bg-surface-low border border-border-ghost rounded-full px-5 h-11 shadow-sm shrink-0">
          <span className="text-xs font-black uppercase tracking-widest text-primary mr-1">
            {selectedCount} Selected
          </span>
          <div className="w-[1px] h-4 bg-border-ghost mx-1" />
          <button
            onClick={onBulkDispatch}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-success hover:text-success/80 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Truck className="w-3.5 h-3.5" />
            )}
            <span>Dispatch</span>
          </button>
          <button
            onClick={onBulkCancel}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-error hover:text-error/80 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <div className="w-[1px] h-4 bg-border-ghost mx-1" />
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            title="Clear Selection"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Status Dropdown */}
          <div className="w-[180px]">
            <SearchableSelect
              items={statusOptions}
              value={currentStatus}
              onChange={(val) => updateFilter("status", val)}
              placeholder="All Status"
              label="BY STATUS"
              className="!rounded-full h-11"
            />
          </div>
        </div>
      )}
    </div>
  );
}
