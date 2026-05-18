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
  X,
  Loader2,
  CheckCircle2,
  Truck
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { SearchableSelect } from "@/components/SearchableSelect";
import SearchInput from "@/components/SearchInput";

interface AdvancedPurchaseFiltersProps {
  vendors: { id: string; name: string }[];
  items: { id: string; name: string; quantity?: number; unit?: string }[];
  currentFilters: {
    q?: string;
    vendorId?: string;
    itemId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  };
  selectedCount?: number;
  onBulkOrdered?: () => void;
  onBulkReceived?: () => void;
  onBulkCancel?: () => void;
  onClearSelection?: () => void;
  isProcessing?: boolean;
}

export default function AdvancedPurchaseFilters({
  vendors,
  items,
  currentFilters,
  selectedCount = 0,
  onBulkOrdered,
  onBulkReceived,
  onBulkCancel,
  onClearSelection,
  isProcessing = false
}: AdvancedPurchaseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses = [
    { id: "all", name: "All Status" },
    { id: "pending", name: "Pending" },
    { id: "ordered", name: "Ordered" },
    { id: "partial", name: "Partial" },
    { id: "received", name: "Received" },
  ];

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

  const hasActiveFilters = Object.keys(currentFilters).some(k => k !== 'q' && currentFilters[k as keyof typeof currentFilters]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <SearchInput 
            defaultValue={currentFilters.q} 
            placeholder="Search by Order ID or Vendor Name..."
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
              onClick={onBulkOrdered}
              disabled={isProcessing}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Ordered</span>
            </button>
            <button
              onClick={onBulkReceived}
              disabled={isProcessing}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-success hover:text-success/80 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              <span>Receive</span>
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
                items={statuses}
                value={currentFilters.status || "all"}
                onChange={(val) => updateFilters({ status: val })}
                placeholder="All Status"
                label="BY STATUS"
                className="!rounded-full h-11"
              />
            </div>

            {/* Vendor Dropdown */}
            <div className="w-[200px]">
              <SearchableSelect
                items={[{ id: "all", name: "All Vendors" }, ...vendors]}
                value={currentFilters.vendorId || "all"}
                onChange={(val) => updateFilters({ vendorId: val })}
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
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="card-premium grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Item Filter */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Package className="w-3 h-3" /> Filter by Item
            </label>
            <SearchableSelect
              items={[{ id: "all", name: "All Items" }, ...items]}
              value={currentFilters.itemId || "all"}
              onChange={(val) => updateFilters({ itemId: val })}
              placeholder="All Items"
              className="h-12"
            />
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={currentFilters.startDate || ""}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-12"
              />
              <span className="text-muted-foreground text-xs font-black">TO</span>
              <input
                type="date"
                value={currentFilters.endDate || ""}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-12"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="w-3 h-3" /> Amount Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={currentFilters.minAmount || ""}
                onChange={(e) => updateFilters({ minAmount: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-12"
              />
              <input
                type="number"
                placeholder="Max"
                value={currentFilters.maxAmount || ""}
                onChange={(e) => updateFilters({ maxAmount: e.target.value })}
                className="w-full bg-surface-low border border-border-ghost rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-12"
              />
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-end">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
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

