"use client";

import { clsx, type ClassValue } from "clsx";
import { Calendar, ChevronDown, Filter, Hash, Search, User, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupplyInwardsFiltersProps {
  vendors: { id: string; name: string }[];
  currentVendorId: string;
  currentPONumber: string;
  currentStartDate: string;
  currentEndDate: string;
}

export function SupplyInwardsFilters({
  vendors,
  currentVendorId,
  currentPONumber,
  currentStartDate,
  currentEndDate
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "ml-auto flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-ambient relative group",
            isExpanded || hasActiveFilters
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
              : "bg-white text-primary border-border-ghost hover:border-primary/30 hover:bg-surface-low"
          )}
        >
          <Filter className={cn("w-3.5 h-3.5 transition-transform group-hover:rotate-12", isExpanded && "scale-110")} />
          <span>{isExpanded ? "Hide Filters" : "More Filters"}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isExpanded && "rotate-180")} />
          
          {!isExpanded && hasActiveFilters && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-white"></span>
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-error/[0.03] text-error border border-error/10 font-black text-[10px] uppercase tracking-widest hover:bg-error hover:text-white transition-all shadow-sm group"
          >
            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            Reset
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="card-premium animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Vendor
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-low border border-border-ghost rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-3 h-3" /> PO Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-123"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-low border border-border-ghost rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-3 lg:col-span-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-low border border-border-ghost rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                  <span className="text-[10px] font-black text-muted-foreground px-2">TO</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-low border border-border-ghost rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={applyFilters}
                    className="ml-2 p-3.5 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center min-w-[50px]"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
