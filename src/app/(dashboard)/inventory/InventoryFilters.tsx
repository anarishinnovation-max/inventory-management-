"use client";

import { Filter } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
      <div className="md:col-span-1 p-5 bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost flex flex-col justify-center space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-sans">Stock Status</label>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter("status", "all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm",
              currentStatus === 'all' ? "bg-primary text-white" : "bg-surface-low text-muted-foreground hover:bg-surface-high"
            )}
          >
            All Stock
          </button>
          <button 
            onClick={() => setFilter("status", "instock")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all",
              currentStatus === 'instock' ? "bg-primary text-white" : "bg-surface-low text-muted-foreground hover:bg-surface-high"
            )}
          >
            In Stock
          </button>
          <button 
            onClick={() => setFilter("status", "low")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all",
              currentStatus === 'low' ? "bg-error text-white" : "bg-surface-low text-muted-foreground hover:bg-surface-high"
            )}
          >
            Low Stock
          </button>
          <button 
            onClick={() => setFilter("status", "outofstock")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all",
              currentStatus === 'outofstock' ? "bg-gray-700 text-white" : "bg-surface-low text-muted-foreground hover:bg-surface-high"
            )}
          >
            Out of Stock
          </button>
        </div>
      </div>

      <div className="md:col-span-2 p-5 bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost flex items-center justify-between">
        <div className="space-y-4 flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-left font-sans">Categories</label>
          <div className="flex gap-4">
            <select 
              value={currentCategory}
              onChange={(e) => setFilter("category", e.target.value)}
              className={cn(
                "bg-transparent border-none text-sm font-bold text-foreground p-0 focus:ring-0 cursor-pointer w-full max-w-[140px] transition-opacity",
                isPending && "opacity-50"
              )}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select className="bg-transparent border-none text-sm font-bold text-foreground p-0 focus:ring-0 cursor-pointer w-full max-w-[160px]">
              <option>Zone A (Main)</option>
              <option>Zone B (Cold Storage)</option>
              <option>Zone C (Hazardous)</option>
            </select>
          </div>
        </div>
        <div className="h-12 w-px bg-border-ghost mx-6"></div>
        <button className="p-4 text-muted-foreground hover:bg-surface-low rounded-2xl transition-colors border border-transparent hover:border-border-ghost">
          <Filter className={cn("w-5 h-5", isPending && "animate-spin text-primary")} />
        </button>
      </div>
    </>
  );
}
