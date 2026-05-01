"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Filter, ChevronDown, X, Clock, CheckCircle2, LayoutGrid } from "lucide-react";
import { useState, useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchableSelect } from "@/components/SearchableSelect";
import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DispatchFiltersProps {
  searchQuery?: string;
  currentStatus?: string;
}

const statusOptions = [
  { id: "all", name: "All Bills" },
  { id: "pending", name: "Pending" },
  { id: "dispatched", name: "Sent" },
];

export function DispatchFilters({
  searchQuery,
  currentStatus = "all"
}: DispatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      {/* Search Bar on the Left */}
      <div className="flex-1 max-w-2xl">
        <SearchInput 
          defaultValue={searchQuery} 
          placeholder="Search Customer or Order ID..."
        />
      </div>

      {/* Filters on the Right */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Dropdown */}
        <div className="w-[200px]">
          <SearchableSelect
            items={statusOptions}
            value={currentStatus}
            onChange={(val) => updateFilter("status", val)}
            placeholder="All Status"
            className="!rounded-full h-11"
          />
        </div>

        {/* Action button if needed, but for now just status */}
      </div>
    </div>
  );
}
