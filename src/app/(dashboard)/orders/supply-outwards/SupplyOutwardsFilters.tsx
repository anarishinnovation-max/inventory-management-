"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Calendar, User, Package, X, Filter } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SupplyOutwardsFilters({
  customers,
  items,
  currentCustomerId,
  currentItemId,
  currentStartDate,
  currentEndDate
}: {
  customers: { id: string, name: string }[];
  items: { id: string, name: string, sku: string }[];
  currentCustomerId: string;
  currentItemId: string;
  currentStartDate?: string;
  currentEndDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [startDate, setStartDate] = useState(currentStartDate || "");
  const [endDate, setEndDate] = useState(currentEndDate || "");

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = currentCustomerId !== 'all' || currentItemId !== 'all' || currentStartDate || currentEndDate;

  return (
    <div className="card-premium w-full md:w-auto flex-1 flex flex-col gap-6 !p-6 border-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Filter className="w-3 h-3" />
          Advanced Filters
        </div>
        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="text-[10px] font-black text-error hover:underline uppercase flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Filter */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <User className="w-3 h-3" />
            Customer
          </label>
          <SearchableSelect
            items={[{ id: 'all', name: 'All Customers' }, ...customers]}
            value={currentCustomerId}
            onChange={(val) => updateFilters({ customerId: val })}
            placeholder="All Customers"
            className="!rounded-xl"
          />
        </div>

        {/* Item Filter */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Package className="w-3 h-3" />
            Item
          </label>
          <SearchableSelect
            items={[{ id: 'all', name: 'All Items', sku: '' }, ...items]}
            value={currentItemId}
            onChange={(val) => updateFilters({ itemId: val })}
            placeholder="All Items"
            className="!rounded-xl"
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              updateFilters({ startDate: e.target.value });
            }}
            className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all hover:border-primary/20"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              updateFilters({ endDate: e.target.value });
            }}
            className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all hover:border-primary/20"
          />
        </div>
      </div>
      
      {isPending && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Applying filters...</span>
        </div>
      )}
    </div>
  );
}
