"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, User, Activity, Calendar as CalendarIcon, FilterX, ChevronDown } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useEffect, useState } from "react";

export function TransactionFilters({ users }: { users: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    user: searchParams.get("user") || "",
    type: searchParams.get("type") || "",
    start: searchParams.get("start") || "",
    end: searchParams.get("end") || "",
  });

  const actionTypes = [
    { name: "Purchase", id: "PURCHASE" },
    { name: "Dispatch (Sale)", id: "SALE" },
    { name: "Inventory Registry", id: "INITIAL_REGISTRY" },
    { name: "Scrapped Stock", id: "SCRAP" },
    { name: "Adjustment (In)", id: "ADJUSTMENT_IN" },
    { name: "Adjustment (Out)", id: "ADJUSTMENT_OUT" },
    { name: "Manual Outward", id: "OUTWARD" },
    { name: "Internal Move", id: "MOVE" }
  ];

  const updateFilters = (newFilters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value as string);
      else params.delete(key);
    });
    router.push(`/transactions?${params.toString()}`);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    
    // For selects/dates, update immediately. For text, we might want to debounce, but let's keep it simple for now or use a submit button.
    if (name !== 'q') {
       updateFilters(updated);
    }
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    updateFilters(filters);
  };

  const clearFilters = () => {
    setFilters({ q: "", user: "", type: "", start: "", end: "" });
    router.push("/transactions");
  };

  return (
    <div className="w-full space-y-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              name="q"
              value={filters.q}
              onChange={handleInputChange}
              placeholder="Search SKU or Item Name..."
              className="w-full h-11 pl-12 pr-4 rounded-full bg-surface-low border border-border-ghost focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold"
            />
          </form>
        </div>

        {/* Filters on the Right */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-[200px]">
            <SearchableSelect 
              items={users.map(u => ({ id: u.id, name: u.name }))}
              value={filters.user}
              onChange={(val) => {
                const updated = { ...filters, user: val };
                setFilters(updated);
                updateFilters(updated);
              }}
              placeholder="All Users"
              label="BY USER"
              className="!rounded-full h-11"
            />
          </div>

          <div className="w-[200px]">
            <SearchableSelect 
              items={actionTypes}
              value={filters.type}
              onChange={(val) => {
                const updated = { ...filters, type: val };
                setFilters(updated);
                updateFilters(updated);
              }}
              placeholder="All Actions"
              label="BY ACTION"
              className="!rounded-full h-11"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="date"
                name="start"
                value={filters.start}
                onChange={handleInputChange}
                className="w-[140px] h-11 px-4 rounded-full bg-surface-low border border-border-ghost focus:border-primary outline-none transition-all text-xs font-bold cursor-pointer"
              />
            </div>
            <span className="text-xs font-black text-muted-foreground opacity-30">TO</span>
            <div className="relative">
              <input 
                type="date"
                name="end"
                value={filters.end}
                onChange={handleInputChange}
                className="w-[140px] h-11 px-4 rounded-full bg-surface-low border border-border-ghost focus:border-primary outline-none transition-all text-xs font-bold cursor-pointer"
              />
            </div>
          </div>

          {Object.values(filters).some(v => v !== "") && (
            <button 
              onClick={clearFilters}
              className="btn btn-error h-11 px-6 text-xs bg-error/5 text-error border-error/10"
              title="Clear all filters"
            >
              <FilterX className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

