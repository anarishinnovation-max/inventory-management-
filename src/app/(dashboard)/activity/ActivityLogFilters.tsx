"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import SearchInput from "@/components/SearchInput";
import { SearchableSelect } from "@/components/SearchableSelect";
import { 
  User, 
  Activity, 
  Layers, 
  Calendar, 
  X, 
  Filter as FilterIcon,
  Plus,
  Edit,
  Trash2,
  LogIn,
  RefreshCw
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActivityLogFiltersProps {
  users: { id: string; name: string }[];
}

const ACTION_TYPES = [
  { id: "all", name: "All Actions", icon: <Activity className="w-4 h-4" /> },
  { id: "CREATE", name: "Creation", icon: <Plus className="w-4 h-4 text-success" /> },
  { id: "UPDATE", name: "Updates", icon: <Edit className="w-4 h-4 text-warning" /> },
  { id: "DELETE", name: "Deletions", icon: <Trash2 className="w-4 h-4 text-error" /> },
  { id: "LOGIN", name: "Logins", icon: <LogIn className="w-4 h-4 text-primary" /> },
  { id: "ADJUSTMENT", name: "Adjustments", icon: <RefreshCw className="w-4 h-4 text-indigo-500" /> },
];

const ENTITY_TYPES = [
  { id: "all", name: "All Entities", icon: <Layers className="w-4 h-4" /> },
  { id: "ITEM", name: "Items", icon: <Layers className="w-4 h-4" /> },
  { id: "VENDOR", name: "Vendors", icon: <Layers className="w-4 h-4" /> },
  { id: "CUSTOMER", name: "Customers", icon: <Layers className="w-4 h-4" /> },
  { id: "PURCHASE_ORDER", name: "Purchase Orders", icon: <Layers className="w-4 h-4" /> },
  { id: "DISPATCH_ORDER", name: "Dispatch Orders", icon: <Layers className="w-4 h-4" /> },
  { id: "USER", name: "Users", icon: <Layers className="w-4 h-4" /> },
];

export function ActivityLogFilters({ users }: ActivityLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.delete('page'); // Reset page on filter change
    router.push(`/activity?${params.toString()}`);
  }, [router, searchParams]);

  const clearFilters = () => {
    router.push('/activity');
  };

  const hasActiveFilters = searchParams.get('actionType') || 
                          searchParams.get('entityType') || 
                          searchParams.get('performedBy');

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search Bar on the Left */}
        <div className="flex-1 max-w-2xl">
          <SearchInput 
            placeholder="Search activity by User or Entity ID..." 
            defaultValue={searchParams.get('q') || ''}
          />
        </div>

        {/* Filters on the Right */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-[180px]">
            <SearchableSelect
              items={ACTION_TYPES}
              value={searchParams.get('actionType') || 'all'}
              onChange={(val) => updateFilters({ actionType: val })}
              placeholder="All Actions"
              label="BY ACTION"
              className="!rounded-full h-11"
            />
          </div>

          <div className="w-[180px]">
            <SearchableSelect
              items={ENTITY_TYPES}
              value={searchParams.get('entityType') || 'all'}
              onChange={(val) => updateFilters({ entityType: val })}
              placeholder="All Entities"
              label="BY ENTITY"
              className="!rounded-full h-11"
            />
          </div>

          <div className="w-[200px]">
            <SearchableSelect
              items={[
                { id: "all", name: "All Users" },
                ...users.map(u => ({ id: u.id, name: u.name }))
              ]}
              value={searchParams.get('performedBy') || 'all'}
              onChange={(val) => updateFilters({ performedBy: val })}
              placeholder="All Users"
              label="BY USER"
              className="!rounded-full h-11"
            />
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="btn btn-error h-11 px-6 text-xs bg-error/5 text-error border-error/10"
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>


    </div>
  );
}

