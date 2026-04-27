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
  Package,
  Square,
  Truck,
  User,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
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
  return new Date(value).toLocaleString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
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
  const confirm = useConfirm();
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

    if (!(await confirm("Bulk Dispatch", `Are you sure you want to dispatch ${selectedOrders.size} orders containing ${selectedIds.size} selected items?`))) {
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
        showToast(`Successfully dispatched ${selectedOrders.size} orders`, "success");
        setSelectedIds(new Set());
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to dispatch items.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
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
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
            <div className="bg-foreground text-white px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                   <Package className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Bulk Protocol</p>
                   <p className="text-sm font-black">{selectedIds.size} Items Selected</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="btn btn-ghost text-white hover:bg-white/10 px-5 h-12"
                >
                  Clear Selection
                </button>
                <button 
                  onClick={handleBulkDispatch}
                  disabled={isProcessing}
                  className="btn btn-primary px-8 h-12 rounded-2xl"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
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

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="heading-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning border border-warning/10">
               <Clock className="w-5 h-5" />
            </div>
            Pending Dispatch Items
          </h3>
          <Link href="/orders/dispatch" className="btn btn-ghost h-10 px-4 text-[10px] font-black uppercase tracking-widest">Full Sale List</Link>
        </div>
 
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="table-cell-header w-12 text-center">
                    <button onClick={toggleAll} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : selectedIds.size > 0 ? (
                        <MinusSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground opacity-20" />
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
                    <tr key={item.id} className={cn("table-row", isSelected && "bg-primary/[0.03]")}>
                      <td className="table-cell text-center">
                        <button onClick={() => toggleOne(item.id)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground opacity-10 group-hover:opacity-40 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-low border border-border-ghost flex items-center justify-center font-black text-primary shrink-0 group-hover:border-primary/20 transition-all">
                            {item.item.sku[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-foreground text-sm truncate">{item.item.name}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 font-mono">SKU: {item.item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-foreground truncate">{item.customer.name}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-primary !text-[9px] !px-2 !py-0.5">DO #{item.orderId.split('-')[0]}</span>
                            {item.collectedBy && (
                               <span className="badge badge-neutral !text-[9px] !px-2 !py-0.5">COL: {item.collectedBy}</span>
                            )}
                            {item.transportMode && (
                               <span className="badge badge-warning !text-[9px] !px-2 !py-0.5">{item.transportMode}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground opacity-30" />
                          <span className="text-[11px] font-black text-foreground">{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-warning tabular-nums">{item.quantity}</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Units Booked</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <Link href={`/orders/dispatch/${item.orderId}`} className="btn btn-primary h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Send
                        </Link>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <AlertCircle className="w-12 h-12" />
                        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No pending items found.</p>
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

