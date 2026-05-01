"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, User, Package, Filter, ChevronDown, X, Loader2 } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { SearchableSelect } from "@/components/SearchableSelect";
import SearchInput from "@/components/SearchInput";

interface SupplyOutwardsFiltersProps {
  customers: { id: string; name: string }[];
  items: { id: string; name: string; quantity?: number; unit?: string }[];
  currentCustomerId: string;
  currentItemId: string;
  currentStartDate?: string;
  currentEndDate?: string;
  searchQuery?: string;
}

export function SupplyOutwardsFilters({
  customers,
  items,
  currentCustomerId,
  currentItemId,
  currentStartDate,
  currentEndDate,
  searchQuery
}: SupplyOutwardsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(currentStartDate || "");
  const [endDate, setEndDate] = useState(currentEndDate || "");
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = currentCustomerId !== "all" || currentItemId !== "all" || currentStartDate || currentEndDate;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <SearchInput 
            defaultValue={searchQuery} 
            placeholder="Search Item, Customer or Order..."
          />
        </div>

        {/* Filters on the Right */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Customer Dropdown */}
          <div className="w-[200px]">
            <SearchableSelect
              items={[{ id: "all", name: "All Customers" }, ...customers]}
              value={currentCustomerId}
              onChange={(val) => updateFilter("customerId", val)}
              placeholder="All Customers"
              label="BY CUSTOMER"
              className="!rounded-full h-11"
            />
          </div>

          {/* Item Dropdown */}
          <div className="w-[200px]">
            <SearchableSelect
              items={[{ id: "all", name: "All Items" }, ...items]}
              value={currentItemId}
              onChange={(val) => updateFilter("itemId", val)}
              placeholder="All Items"
              label="BY ITEM"
              className="!rounded-full h-11"
            />
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 px-6 h-11 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all border shadow-sm",
              isExpanded
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-surface-low text-muted-foreground border-border-ghost hover:border-primary/20"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Hide" : "More"}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="card-premium grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date Range
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 px-4 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
              <span className="text-[10px] font-black text-muted-foreground opacity-30">TO</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 px-4 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
              <button 
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (startDate) params.set("startDate", startDate);
                  else params.delete("startDate");
                  if (endDate) params.set("endDate", endDate);
                  else params.delete("endDate");
                  startTransition(() => {
                    router.push(`?${params.toString()}`);
                  });
                }}
                className="btn btn-primary h-12 w-12 rounded-xl shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions Column */}
          <div className="space-y-3 flex flex-col justify-end">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Actions
            </label>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-error h-12 w-full text-[10px] bg-error/5 text-error border-error/10 font-black uppercase tracking-widest hover:bg-error/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            )}
            {!hasActiveFilters && (
               <div className="h-12 flex items-center justify-center border border-dashed border-border-ghost rounded-xl text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                  No Active Filters
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

