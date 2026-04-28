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
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full max-w-2xl">
          <SearchInput 
            placeholder="Search activity by User or Entity ID..." 
            defaultValue={searchParams.get('q') || ''}
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={cn(
              "btn h-12 px-6 flex items-center gap-3 transition-all rounded-2xl",
              isFilterVisible || hasActiveFilters 
                ? "bg-primary text-white shadow-glow-primary border-primary" 
                : "bg-white text-foreground border-border-ghost hover:border-primary/30 shadow-ambient"
            )}
          >
            <FilterIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {Array.from(searchParams.keys()).filter(k => k !== 'q' && k !== 'page').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="p-3 hover:bg-error/10 text-error rounded-xl transition-all"
              title="Clear all filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isFilterVisible && (
        <div className="bg-white border border-border-ghost p-8 rounded-[2.5rem] shadow-premium animate-in fade-in slide-in-from-top-4 duration-500 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Action Type</label>
            <SearchableSelect
              items={ACTION_TYPES}
              value={searchParams.get('actionType') || 'all'}
              onChange={(val) => updateFilters({ actionType: val })}
              placeholder="Select Action..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Entity Category</label>
            <SearchableSelect
              items={ENTITY_TYPES}
              value={searchParams.get('entityType') || 'all'}
              onChange={(val) => updateFilters({ entityType: val })}
              placeholder="Select Entity..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Performed By</label>
            <SearchableSelect
              items={[
                { id: "all", name: "All Users", icon: <User className="w-4 h-4" /> },
                ...users.map(u => ({ id: u.id, name: u.name, icon: <User className="w-4 h-4" /> }))
              ]}
              value={searchParams.get('performedBy') || 'all'}
              onChange={(val) => updateFilters({ performedBy: val })}
              placeholder="Select User..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
