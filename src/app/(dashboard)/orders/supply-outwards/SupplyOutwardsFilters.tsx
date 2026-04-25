"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, User, Package, Filter, ChevronDown, X } from "lucide-react";
import { useState, useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupplyOutwardsFiltersProps {
  customers: { id: string; name: string }[];
  items: { id: string; name: string }[];
  currentCustomerId: string;
  currentItemId: string;
  currentStartDate?: string;
  currentEndDate?: string;
}

export function SupplyOutwardsFilters({
  customers,
  items,
  currentCustomerId,
  currentItemId,
  currentStartDate,
  currentEndDate
}: SupplyOutwardsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [customerId, setCustomerId] = useState(currentCustomerId);
  const [itemId, setItemId] = useState(currentItemId);
  const [startDate, setStartDate] = useState(currentStartDate || "");
  const [endDate, setEndDate] = useState(currentEndDate || "");
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (customerId && customerId !== 'all') params.set("customerId", customerId);
    else params.delete("customerId");
    
    if (itemId && itemId !== 'all') params.set("itemId", itemId);
    else params.delete("itemId");
    
    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");
    
    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = customerId !== "all" || itemId !== "all" || startDate || endDate;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quick Tabs */}
        <div className="flex bg-surface-low p-1.5 rounded-full border border-border-ghost">
           <button
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                !hasActiveFilters ? "bg-white text-primary shadow-premium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={clearFilters}
            >
              All Bookings
            </button>
            <button
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                hasActiveFilters ? "bg-white text-primary shadow-premium" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setIsExpanded(true)}
            >
              Filtered
            </button>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "ml-auto flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm",
            isExpanded || hasActiveFilters
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-primary/[0.03] text-primary border-primary/10 hover:bg-primary/10"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{isExpanded ? "Hide Filters" : "More Filters"}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-error/[0.03] text-error border border-error/10 font-black text-[10px] uppercase tracking-widest hover:bg-error/10 transition-all shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="card-premium grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Customer
            </label>
            <select 
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="all">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Package className="w-3 h-3" /> Item
            </label>
            <select 
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="all">All Items</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
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
                className="w-full px-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-[10px] font-black text-muted-foreground">TO</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
              />
              <button 
                onClick={applyFilters}
                className="ml-2 p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
