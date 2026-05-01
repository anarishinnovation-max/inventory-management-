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
    <div className="card-premium !p-6 bg-white shadow-ambient mb-8">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Search Item</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              name="q"
              value={filters.q}
              onChange={handleInputChange}
              placeholder="SKU or Item Name..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-low border border-border-ghost focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold"
            />
          </div>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Performed By</label>
          <SearchableSelect 
            items={users.map(u => ({ id: u.id, name: u.name }))}
            value={filters.user}
            onChange={(val) => {
              const updated = { ...filters, user: val };
              setFilters(updated);
              updateFilters(updated);
            }}
            placeholder="All Users"
            className="h-12 !rounded-xl"
            icon={<User className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        {/* Action Type */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Action Type</label>
          <SearchableSelect 
            items={actionTypes}
            value={filters.type}
            onChange={(val) => {
              const updated = { ...filters, type: val };
              setFilters(updated);
              updateFilters(updated);
            }}
            placeholder="All Actions"
            className="h-12 !rounded-xl"
            icon={<Activity className="w-4 h-4 text-muted-foreground" />}
          />
        </div>

        {/* Date Range */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">From Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  name="start"
                  value={filters.start}
                  onChange={handleInputChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-low border border-border-ghost focus:border-primary outline-none transition-all text-sm font-bold cursor-pointer"
                />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">To Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  name="end"
                  value={filters.end}
                  onChange={handleInputChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-low border border-border-ghost focus:border-primary outline-none transition-all text-sm font-bold cursor-pointer"
                />
              </div>
           </div>
        </div>
      </form>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-ghost">
         <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {Object.values(filters).filter(Boolean).length} Filters Active
         </p>
         <button 
           onClick={clearFilters}
           className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-error hover:opacity-70 transition-opacity"
         >
            <FilterX className="w-3.5 h-3.5" />
            Clear All Filters
         </button>
      </div>
    </div>
  );
}

