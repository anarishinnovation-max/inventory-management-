"use client";

import { clsx, type ClassValue } from "clsx";
import { Calendar, ChevronDown, Filter, Hash, Loader2, Search, User, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import SearchInput from "@/components/SearchInput";
import { SearchableSelect } from "@/components/SearchableSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupplyInwardsFiltersProps {
  vendors: { id: string; name: string }[];
  currentVendorId: string;
  currentPONumber: string;
  currentStartDate: string;
  currentEndDate: string;
  searchQuery?: string;
}

export function SupplyInwardsFilters({
  vendors,
  currentVendorId,
  currentPONumber,
  currentStartDate,
  currentEndDate,
  searchQuery
}: SupplyInwardsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vendorId, setVendorId] = useState(currentVendorId);
  const [poNumber, setPoNumber] = useState(currentPONumber);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (vendorId && vendorId !== 'all') params.set("vendorId", vendorId);
    else params.delete("vendorId");

    if (poNumber) params.set("poNumber", poNumber);
    else params.delete("poNumber");

    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setVendorId("all");
    setPoNumber("");
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push("/orders/supply-inwards");
    });
  };

  const hasActiveFilters = vendorId !== "all" || poNumber || startDate || endDate;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <SearchInput 
            defaultValue={searchQuery} 
            placeholder="Search Item, Vendor or PO..."
          />
        </div>

        {/* Filters on the Right */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Vendor Dropdown */}
          <div className="w-[200px]">
            <SearchableSelect
              items={[{ id: "all", name: "All Vendors" }, ...vendors]}
              value={vendorId}
              onChange={(val: string) => {
                setVendorId(val);
                // Immediately apply if we want, or keep it to applyFilters
              }}
              placeholder="All Vendors"
              label="BY VENDOR"
              className="!rounded-full h-11"
            />
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 px-6 h-11 rounded-full font-bold text-xs uppercase tracking-widest transition-all border shadow-sm",
              isExpanded
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-surface-low text-muted-foreground border-border-ghost hover:border-primary/20"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Hide" : "More"}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
            
            {!isExpanded && hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-white"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="card-premium grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5 opacity-40" /> PO Number
            </label>
            <input
              type="text"
              placeholder="e.g. PO-123"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full h-12 px-4 bg-surface-low/50 border border-border-ghost rounded-xl text-xs font-black uppercase tracking-[0.1em] focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 tabular-nums"
            />
          </div>

              <div className="space-y-3 lg:col-span-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                  <span className="text-xs font-black text-muted-foreground opacity-30">TO</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={applyFilters}
                    disabled={isPending}
                    className="btn btn-primary h-12 w-12 rounded-xl shrink-0"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-end">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Actions
                </label>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-error h-12 w-full text-xs bg-error/5 text-error border-error/10 font-black uppercase tracking-widest hover:bg-error/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                )}
                {!hasActiveFilters && (
                   <div className="h-12 flex items-center justify-center border border-dashed border-border-ghost rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                      No Active Filters
                   </div>
                )}
              </div>
        </div>
      )}
    </div>
  );
}


