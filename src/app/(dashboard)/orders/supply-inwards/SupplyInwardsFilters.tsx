"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, User, Hash } from "lucide-react";
import { useState, useEffect } from "react";

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

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setVendorId("all");
    setPoNumber("");
    setStartDate("");
    setEndDate("");
    router.push("/orders/supply-inwards");
  };

  return (
    <div className="card-premium p-6 flex flex-wrap gap-6 items-end bg-surface-low/50 border-border-ghost shadow-sm">
      <div className="flex-1 min-w-[200px]">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Vendor Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select 
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">PO Number</label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="e.g. PO-123"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-[150px]">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">From</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
        <div className="min-w-[150px]">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">To</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-ghost rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={applyFilters}
          className="px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          Apply
        </button>
        <button 
          onClick={clearFilters}
          className="px-6 py-2.5 bg-surface-low text-muted-foreground text-xs font-bold rounded-xl hover:bg-surface-high transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
