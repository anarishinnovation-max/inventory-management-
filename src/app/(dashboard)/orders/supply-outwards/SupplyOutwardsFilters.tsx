"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, User, Package, Filter, ChevronDown, X, Loader2 } from "lucide-react";
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
    setCustomerId("all");
    setItemId("all");
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = customerId !== "all" || itemId !== "all" || startDate || endDate;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "btn ml-auto h-12 !px-8 !rounded-2xl shadow-ambient relative group",
            isExpanded || hasActiveFilters
              ? "btn-primary !border-primary shadow-glow-primary"
              : "btn-neutral border-border-ghost hover:bg-surface-low"
          )}
        >
          <Filter className={cn("w-4 h-4 transition-transform group-hover:rotate-12")} />
          <span>{isExpanded ? "Hide Filters" : "More Filters"}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
          
          {!isExpanded && hasActiveFilters && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-white"></span>
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-neutral h-12 !px-6 !rounded-2xl !text-error border-error/20 hover:!bg-error hover:!text-white group"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Reset
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-border-ghost shadow-ambient animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <User className="w-3.5 h-3.5 opacity-40" /> Customer
                </label>
                <div className="relative">
                  <select 
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full h-14 pl-5 pr-10 bg-surface-low/50 border border-border-ghost rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:bg-surface-low"
                  >
                    <option value="all">All Customers</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <Package className="w-3.5 h-3.5 opacity-40" /> Item
                </label>
                <div className="relative">
                  <select 
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="w-full h-14 pl-5 pr-10 bg-surface-low/50 border border-border-ghost rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:bg-surface-low"
                  >
                    <option value="all">All Items</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40" />
                </div>
              </div>

              <div className="space-y-4 lg:col-span-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <Calendar className="w-3.5 h-3.5 opacity-40" /> Date Range
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-14 px-6 bg-surface-low/50 border border-border-ghost rounded-2xl text-[11px] font-black uppercase focus:ring-2 focus:ring-primary outline-none transition-all tabular-nums"
                    />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground px-2 opacity-30">TO</span>
                  <div className="relative flex-1">
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-14 px-6 bg-surface-low/50 border border-border-ghost rounded-2xl text-[11px] font-black uppercase focus:ring-2 focus:ring-primary outline-none transition-all tabular-nums"
                    />
                  </div>
                  <button 
                    onClick={applyFilters}
                    disabled={isPending}
                    className="btn btn-primary h-14 !px-6 !rounded-2xl shadow-glow-primary min-w-[70px]"
                  >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

