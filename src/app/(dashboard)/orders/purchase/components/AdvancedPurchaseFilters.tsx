"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  IndianRupee, 
  Package, 
  User, 
  X 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import PremiumSelect from "@/components/PremiumSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdvancedPurchaseFiltersProps {
  vendors: { id: string; name: string }[];
  items: { id: string; name: string }[];
  currentFilters: {
    vendorId?: string;
    itemId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  };
}

export default function AdvancedPurchaseFilters({
  vendors,
  items,
  currentFilters,
}: AdvancedPurchaseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset page when filtering
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Object.keys(currentFilters).some(k => currentFilters[k as keyof typeof currentFilters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Quick Status Filters */}
        <div className="flex bg-surface-low p-1 rounded-2xl border border-border-ghost">
          {["all", "pending", "ordered", "received"].map((s) => (
            <button
              key={s}
              onClick={() => updateFilters({ status: s })}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                (currentFilters.status || "all") === s
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>



        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border",
            isExpanded || hasActiveFilters
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-surface-low text-muted-foreground border-border-ghost hover:border-primary/20"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{isExpanded ? "Hide Filters" : "More Filters"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-error/5 text-error font-black text-[10px] uppercase tracking-widest hover:bg-error/10 transition-all border border-error/10"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="card-premium grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Vendor Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> Filter by Vendor
            </label>
            <PremiumSelect
              options={vendors.map(v => v.name)}
              value={vendors.find(v => v.id === currentFilters.vendorId)?.name || "all"}
              onChange={(val) => {
                const vendor = vendors.find(v => v.name === val);
                updateFilters({ vendorId: vendor?.id || "all" });
              }}
              placeholder="All Vendors"
              icon={<User className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Item Filter */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Package className="w-3 h-3" /> Filter by Item
            </label>
            <PremiumSelect
              options={items.map(i => i.name)}
              value={items.find(i => i.id === currentFilters.itemId)?.name || "all"}
              onChange={(val) => {
                const item = items.find(i => i.name === val);
                updateFilters({ itemId: item?.id || "all" });
              }}
              placeholder="All Items"
              icon={<Package className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-3 lg:col-span-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={currentFilters.startDate || ""}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
              <span className="text-muted-foreground text-[10px] font-black">TO</span>
              <input
                type="date"
                value={currentFilters.endDate || ""}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="w-3 h-3" /> Amount Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={currentFilters.minAmount || ""}
                onChange={(e) => updateFilters({ minAmount: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={currentFilters.maxAmount || ""}
                onChange={(e) => updateFilters({ maxAmount: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
