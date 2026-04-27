"use client";

import SearchInput from "@/components/SearchInput";

import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Loader2,
  MinusSquare,
  Square,
  Truck,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { SupplyOutwardsFilters } from "./SupplyOutwardsFilters";

interface SupplyOutwardsListProps {
  items: any[];
  searchQuery: string;
  customers: { id: string; name: string }[];
  allItems: { id: string; name: string; sku: string }[];
  currentCustomerId: string;
  currentItemId: string;
  currentStartDate?: string;
  currentEndDate?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SupplyOutwardsList({
  items,
  searchQuery,
  customers,
  allItems,
  currentCustomerId,
  currentItemId,
  currentStartDate,
  currentEndDate
}: SupplyOutwardsListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleAll = () => {
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDispatch = async () => {
    if (selectedIds.size === 0) return;

    // We need to collect unique order IDs from selected line items
    const selectedOrders = new Set<string>();
    selectedIds.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) selectedOrders.add(item.orderId);
    });

    if (!confirm(`Are you sure you want to dispatch ${selectedOrders.size} orders containing ${selectedIds.size} selected items?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/dispatch-orders/bulk-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to dispatch items.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 max-w-3xl">
          <div className="relative group">
            <SearchInput
              defaultValue={searchQuery}
              placeholder="Search Item, Customer or Order..."
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="bg-white border border-border-ghost rounded-2xl shadow-premium flex items-center gap-1 p-1.5 pr-4 pl-5 h-[60px]">
              <div className="flex flex-col pr-4 border-r border-border-ghost mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">{selectedIds.size} Selected</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleBulkDispatch}
                  disabled={isProcessing}
                  className="p-2.5 rounded-xl hover:bg-primary/5 text-primary transition-all group flex items-center gap-2"
                  title="Bulk Dispatch"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Dispatch Selected</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ml-auto">
          <SupplyOutwardsFilters
            customers={customers}
            items={allItems}
            currentCustomerId={currentCustomerId}
            currentItemId={currentItemId}
            currentStartDate={currentStartDate}
            currentEndDate={currentEndDate}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            Pending Dispatch Items
          </h3>
          <Link href="/orders/dispatch" className="text-[10px] font-black text-primary hover:underline uppercase">Full Sale List</Link>
        </div>

        <div className="card-premium !p-0 overflow-hidden border-warning/10 shadow-lg shadow-warning/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header bg-warning/[0.02]">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleAll} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : selectedIds.size > 0 ? (
                        <MinusSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="table-cell-header">Item Details</th>
                  <th className="table-cell-header">Recipient</th>
                  <th className="table-cell-header">Booked On</th>
                  <th className="table-cell-header text-right">Quantity</th>
                  <th className="table-cell-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {items.length > 0 ? items.map((item: any) => {
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr key={item.id} className={cn(
                      "group transition-all border-b border-border-ghost last:border-0",
                      isSelected ? "bg-primary/[0.03]" : "hover:bg-surface-low/30"
                    )}>
                      <td className="px-6 py-5">
                        <button onClick={() => toggleOne(item.id)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-border-ghost flex items-center justify-center font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                            {item.item.sku[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground text-sm truncate">{item.item.name}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">SKU: {item.item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-foreground truncate">{item.customer.name}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-primary/[0.05] text-[9px] font-black text-primary uppercase border border-primary/10 tracking-wider">DO #{item.orderId.split('-')[0]}</span>
                            {item.collectedBy && (
                               <span className="px-2 py-0.5 rounded-md bg-indigo-500/[0.05] text-[9px] font-black text-indigo-600 uppercase border border-indigo-500/10 tracking-wider">Col: {item.collectedBy}</span>
                            )}
                            {item.dispatchedBy && (
                               <span className="px-2 py-0.5 rounded-md bg-slate-500/[0.05] text-[9px] font-black text-slate-600 uppercase border border-slate-500/10 tracking-wider">Staff: {item.dispatchedBy}</span>
                            )}
                            {item.transportMode && (
                               <span className="px-2 py-0.5 rounded-md bg-amber-500/[0.05] text-[9px] font-black text-amber-600 uppercase border border-amber-500/10 tracking-wider">{item.transportMode}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-warning">{item.quantity}</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Units Booked</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/orders/dispatch/${item.orderId}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border-ghost hover:border-primary shadow-sm hover:shadow-md hover:scale-105 active:scale-95 group/btn">
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-12" />
                          Send
                        </Link>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <AlertCircle className="w-10 h-10" />
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No pending items found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
