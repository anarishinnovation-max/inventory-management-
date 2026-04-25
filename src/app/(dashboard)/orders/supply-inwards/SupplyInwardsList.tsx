"use client";

import SearchInput from "@/components/SearchInput";
import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  ArrowDownToLine,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Loader2,
  SlidersHorizontal,
  Square,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { SupplyInwardsFilters } from "./SupplyInwardsFilters";

interface SupplyInwardsListProps {
  items: any[];
  searchQuery: string;
  vendors: { id: string; name: string }[];
  currentVendorId: string;
  currentPONumber: string;
  currentStartDate: string;
  currentEndDate: string;
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

export default function SupplyInwardsList({
  items,
  searchQuery,
  vendors,
  currentVendorId,
  currentPONumber,
  currentStartDate,
  currentEndDate
}: SupplyInwardsListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showReview, setShowReview] = useState(false);
  const [reviewValues, setReviewValues] = useState<Record<string, number>>({});

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => `${i.poId}|${i.itemId}`)));
    }
  };

  const toggleOne = (compositeId: string) => {
    const next = new Set(selectedIds);
    if (next.has(compositeId)) {
      next.delete(compositeId);
    } else {
      next.add(compositeId);
    }
    setSelectedIds(next);
  };

  const handleBulkReceive = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to receive ${selectedIds.size} selected items? This will update your inventory immediately.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const selections = Array.from(selectedIds).map(id => {
        const [poId, itemId] = id.split('|');
        const item = items.find(i => i.poId === poId && i.itemId === itemId);
        return {
          poId,
          itemId,
          receivedQty: item ? (item.quantityOrdered - item.quantityReceived) : 0
        };
      }).filter(s => s.receivedQty > 0);

      const res = await fetch("/api/purchase-orders/bulk-receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });

      if (res.ok) {
        startTransition(() => {
          router.push("/inventory");
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to receive items.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialReceive = async () => {
    if (Object.keys(reviewValues).length === 0) return;

    setIsProcessing(true);
    try {
      const selections = Object.entries(reviewValues).map(([id, qty]) => {
        const [poId, itemId] = id.split('|');
        return {
          poId,
          itemId,
          receivedQty: qty
        };
      }).filter(s => s.receivedQty > 0);

      const res = await fetch("/api/purchase-orders/bulk-receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });

      if (res.ok) {
        setShowReview(false);
        startTransition(() => {
          router.push("/inventory");
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to receive items.");
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
          <SearchInput
            defaultValue={searchQuery}
            placeholder="Search Item, Vendor or PO..."
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="bg-white border border-border-ghost rounded-2xl shadow-premium flex items-center gap-1 p-1.5 pr-4 pl-5 h-[60px]">
              <div className="flex flex-col pr-4 border-r border-border-ghost mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">{selectedIds.size} Selected</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const initial: Record<string, number> = {};
                    selectedIds.forEach(id => {
                      const [poId, itemId] = id.split('|');
                      const item = items.find(i => i.poId === poId && i.itemId === itemId);
                      initial[id] = item ? (item.quantityOrdered - item.quantityReceived) : 0;
                    });
                    setReviewValues(initial);
                    setShowReview(true);
                  }}
                  disabled={isProcessing}
                  className="p-2.5 rounded-xl hover:bg-primary/5 text-primary transition-all group"
                  title="Review & Partial Receipt"
                >
                  <SlidersHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={handleBulkReceive}
                  disabled={isProcessing}
                  className="p-2.5 rounded-xl hover:bg-success/5 text-success transition-all group"
                  title="Confirm Full Receipt"
                >
                  <ArrowDownToLine className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                <div className="w-px h-4 bg-border-ghost mx-1"></div>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-2.5 rounded-xl hover:bg-surface-low text-muted-foreground transition-all group"
                  title="Clear Selection"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ml-auto">
          <SupplyInwardsFilters
            vendors={vendors}
            currentVendorId={currentVendorId}
            currentPONumber={currentPONumber}
            currentStartDate={currentStartDate}
            currentEndDate={currentEndDate}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            Pending Item Arrivals
          </h3>
          <Link href="/orders/purchase" className="text-[10px] font-black text-primary hover:underline uppercase">Full Purchase List</Link>
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
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="table-cell-header">Item Details</th>
                  <th className="table-cell-header">Source</th>
                  <th className="table-cell-header">Placed On</th>
                  <th className="table-cell-header text-right">Quantity</th>
                  <th className="table-cell-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {items.length > 0 ? items.map((item: any) => {
                  const remaining = item.quantityOrdered - item.quantityReceived;
                  const compositeId = `${item.poId}|${item.itemId}`;
                  const isSelected = selectedIds.has(compositeId);

                  return (
                    <tr key={compositeId} className={cn(
                      "group transition-all border-b border-border-ghost last:border-0",
                      isSelected ? "bg-primary/[0.03]" : "hover:bg-surface-low/30"
                    )}>
                      <td className="px-6 py-5">
                        <button onClick={() => toggleOne(compositeId)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
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
                          <span className="text-xs font-bold text-foreground truncate">{item.vendor.name}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                           <span className="px-2 py-0.5 rounded-md bg-primary/[0.05] text-[9px] font-black text-primary uppercase border border-primary/10 tracking-wider">PO #{item.poId.split('-')[0]}</span>
                        </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">{formatDate(item.orderDate)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PENDING:</span>
                            <span className="text-sm font-black text-warning">{remaining}</span>
                          </div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mt-1">
                            Ordered: {item.quantityOrdered}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                      <Link href={`/orders/purchase/${item.poId}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border-ghost hover:border-primary shadow-sm hover:shadow-md hover:scale-105 active:scale-95 group/btn">
                        <CheckCircle2 className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-12" />
                        Receive
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

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-lowest w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b border-border-ghost flex items-center justify-between bg-surface-low/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Review Bulk Receipt</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Adjust delivered quantities for {selectedIds.size} items</p>
                    <span className="w-1 h-1 rounded-full bg-border-ghost"></span>
                    <button
                      onClick={() => {
                        const initial: Record<string, number> = {};
                        selectedIds.forEach(id => {
                          const [poId, itemId] = id.split('|');
                          const item = items.find(i => i.poId === poId && i.itemId === itemId);
                          initial[id] = item ? (item.quantityOrdered - item.quantityReceived) : 0;
                        });
                        setReviewValues(initial);
                      }}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                    >
                      Set all to pending
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="p-3 hover:bg-white rounded-2xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border-ghost shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {Array.from(selectedIds).map(id => {
                const [poId, itemId] = id.split('|');
                const item = items.find(i => i.poId === poId && i.itemId === itemId);
                if (!item) return null;
                const pending = item.quantityOrdered - item.quantityReceived;

                return (
                  <div key={id} className="p-5 bg-white rounded-3xl border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-colors group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-surface-low flex items-center justify-center font-black text-primary border border-border-ghost group-hover:bg-primary group-hover:text-white transition-all">
                        {item.item.sku[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-foreground text-sm truncate">{item.item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SKU: {item.item.sku}</span>
                          <span className="w-1 h-1 rounded-full bg-border-ghost"></span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">PO #{poId.split('-')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Expected Pending</p>
                        <p className="text-sm font-black text-warning">{pending} <span className="text-[10px] opacity-60 uppercase">{item.item.unit}</span></p>
                      </div>
                      <div className="w-px h-8 bg-border-ghost"></div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Actual Delivered</p>
                        <input
                          type="number"
                          value={reviewValues[id] || 0}
                          onChange={(e) => setReviewValues(prev => ({ ...prev, [id]: parseFloat(e.target.value) || 0 }))}
                          max={pending}
                          min={0}
                          className="w-32 bg-surface-low border border-border-ghost rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-border-ghost bg-surface-low/50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                  Unreceived quantities will remain in "Pending Arrival" status.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-6 py-3 bg-white text-foreground text-xs font-black rounded-2xl border border-border-ghost hover:bg-surface-low transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartialReceive}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-primary text-white text-xs font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Bulk Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
