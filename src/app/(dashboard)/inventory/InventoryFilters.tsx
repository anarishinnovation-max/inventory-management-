"use client";

import { clsx, type ClassValue } from "clsx";
import { Filter, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { twMerge } from "tailwind-merge";
import CustomSelect from "@/components/CustomSelect";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InventoryFilters({
  currentStatus,
  currentCategory,
  categories = []
}: {
  currentStatus: string;
  currentCategory: string;
  categories?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All Categories') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <>
      <div className="md:col-span-2 card-premium flex flex-col justify-center gap-4 border-primary/5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Filter by Status</label>
          {isPending && <span className="text-[10px] font-bold text-primary animate-pulse">Updating...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("status", "all")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'all' ? "bg-primary text-white border-primary shadow-glow" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>All items</span>
          </button>
          <button
            onClick={() => setFilter("status", "instock")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'instock' ? "bg-success text-white border-success shadow-[0_0_12px_oklch(0.65_0.2_150_/_0.2)]" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>In Stock</span>
          </button>
          <button
            onClick={() => setFilter("status", "low")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'low' ? "bg-warning text-white border-warning shadow-[0_0_12px_oklch(0.8_0.15_80_/_0.2)]" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>Low Stock</span>
          </button>
          <button
            onClick={() => setFilter("status", "outofstock")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'outofstock' ? "bg-error/10 text-error border-error/20 ring-4 ring-error/5" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>Out of Stock</span>
          </button>
          <button
            onClick={() => setFilter("status", "ordered")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'ordered' ? "bg-indigo-600 text-white border-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.2)]" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>Ordered</span>
          </button>
          <button
            onClick={() => setFilter("status", "urgent")}
            className={cn(
              "badge py-2 px-4 transition-all active:scale-95",
              currentStatus === 'urgent' ? "bg-error text-white border-error shadow-[0_0_12px_oklch(0.55_0.2_25_/_0.2)]" : "bg-surface-low text-muted-foreground border-transparent hover:border-border-ghost"
            )}
            suppressHydrationWarning
          >
            <span>Urgent</span>
          </button>
        </div>
      </div>

      <div className="md:col-span-1 card-premium flex items-center justify-between !p-6">
        <div className="space-y-4 flex-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block text-left">Filter by Category</label>
          <div className="flex flex-col gap-3">
            <CustomSelect
              options={categories}
              value={currentCategory}
              onChange={(val) => setFilter("category", val)}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="h-10 w-px bg-border-ghost mx-5"></div>
        <div className="p-3 text-primary bg-primary/5 rounded-xl">
          <Search className={cn("w-4 h-4", isPending && "animate-pulse")} />
        </div>
      </div>
    </>
  );
}

