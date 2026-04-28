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
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  Square,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { SupplyInwardsFilters } from "./SupplyInwardsFilters";

interface SupplyInwardsListProps {
  items: any[];
  searchQuery: string;
  vendors: { id: string; name: string }[];
  currentVendorId: string;
  currentPONumber: string;
  currentStartDate: string;
  currentEndDate: string;
  currentPage: number;
  totalPages: number;
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
  currentEndDate,
  currentPage,
  totalPages
}: SupplyInwardsListProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showReview, setShowReview] = useState(false);
  const [reviewValues, setReviewValues] = useState<Record<string, number>>({});

  const toggleAll = () => {
    if (selectedIds.size >= items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      items.forEach(i => next.add(`${i.poId}|${i.itemId}`));
      setSelectedIds(next);
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

    if (!(await confirm("Bulk Receipt", `Are you sure you want to receive ${selectedIds.size} selected items? This will update your inventory immediately.`))) {
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
        showToast(`Successfully received ${selectedIds.size} items`, "success");
        startTransition(() => {
          router.push("/inventory");
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to receive items.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
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
        showToast(`Partial receipt recorded successfully`, "success");
        setShowReview(false);
        startTransition(() => {
          router.push("/inventory");
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to receive items.", "error");
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
          <SearchInput
            defaultValue={searchQuery}
            placeholder="Search Item, Vendor or PO..."
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-white border border-border-ghost rounded-2xl shadow-premium flex items-center gap-1 p-1 pr-4 pl-5">
              <div className="flex flex-col pr-4 border-r border-border-ghost mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedIds.size} Selected</span>
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
                  title="Review & Partial"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleBulkReceive}
                  disabled={isProcessing}
                  className="p-2.5 rounded-xl hover:bg-success/5 text-success transition-all group"
                  title="Confirm Full Receipt"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-4 h-4" />
                  )}
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

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="heading-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
               <Clock className="w-5 h-5" />
            </div>
            Pending Item Arrivals
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-4 opacity-40">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const nextPage = Math.max(1, currentPage - 1);
                params.set('page', nextPage.toString());
                router.push(`/orders/supply-inwards?${params.toString()}`);
              }}
              disabled={currentPage <= 1}
              className="btn btn-ghost h-10 w-10 !p-0 disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const nextPage = currentPage + 1;
                params.set('page', nextPage.toString());
                router.push(`/orders/supply-inwards?${params.toString()}`);
              }}
              disabled={currentPage >= totalPages}
              className="btn btn-ghost h-10 w-10 !p-0 disabled:opacity-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground opacity-20" />
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
                    <tr key={compositeId} className={cn("table-row", isSelected && "bg-primary/[0.03]")}>
                      <td className="table-cell text-center">
                        <button onClick={() => toggleOne(compositeId)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
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
                          <span className="text-xs font-black text-foreground truncate">{item.vendor.name}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="badge badge-primary !text-[9px] !px-2 !py-0.5">PO #{item.poId.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground opacity-30" />
                          <span className="text-[11px] font-black text-foreground">{formatDate(item.orderDate)}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PENDING:</span>
                            <span className="text-sm font-black text-warning tabular-nums">{remaining}</span>
                          </div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest tabular-nums">
                            Ordered: {item.quantityOrdered}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <button 
                          onClick={() => {
                            const initial: Record<string, number> = {};
                            initial[compositeId] = remaining;
                            setReviewValues(initial);
                            setShowReview(true);
                          }}
                          className="btn btn-primary h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Receive
                        </button>
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

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-10 border-b border-border-ghost flex items-center justify-between bg-surface-low/30">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                  <SlidersHorizontal className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="heading-lg">Asset Receipt Review</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Adjusting {Object.keys(reviewValues).length} line items</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-border-ghost"></div>
                    <button
                      onClick={() => {
                        const initial: Record<string, number> = { ...reviewValues };
                        Object.keys(reviewValues).forEach(id => {
                          const [poId, itemId] = id.split('|');
                          const item = items.find(i => i.poId === poId && i.itemId === itemId);
                          initial[id] = item ? (item.quantityOrdered - item.quantityReceived) : 0;
                        });
                        setReviewValues(initial);
                      }}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                    >
                      Reset to Pending
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="btn btn-ghost h-12 w-12 !p-0 rounded-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar bg-surface-low/5">
              {Object.keys(reviewValues).map(id => {
                const [poId, itemId] = id.split('|');
                const item = items.find(i => i.poId === poId && i.itemId === itemId);
                if (!item) return null;
                const pending = item.quantityOrdered - item.quantityReceived;

                return (
                  <div key={id} className="p-6 bg-white rounded-[2rem] border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-8 hover:border-primary/20 transition-all group shadow-sm">
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-surface-low border border-border-ghost flex items-center justify-center font-black text-primary shrink-0 group-hover:border-primary/20 transition-all">
                        {item.item.sku[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-foreground text-base truncate">{item.item.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">SKU: {item.item.sku}</span>
                          <span className="badge badge-primary !text-[9px]">PO #{poId.split('-')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Awaiting Receipt</p>
                        <p className="text-lg font-black text-warning tabular-nums">{pending} <span className="text-[11px] opacity-40 uppercase ml-1">{item.item.unit}</span></p>
                      </div>
                      <div className="w-px h-12 bg-border-ghost"></div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Actual Delivered</p>
                        <input
                          type="number"
                          value={reviewValues[id] || 0}
                          onChange={(e) => setReviewValues(prev => ({ ...prev, [id]: parseFloat(e.target.value) || 0 }))}
                          max={pending}
                          min={0}
                          className="input-field w-36 h-12 text-center text-lg tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-border-ghost bg-surface-low/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-muted-foreground max-w-md">
                <AlertCircle className="w-5 h-5 shrink-0 opacity-40" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed italic opacity-70">
                  Quantities not recorded here will remain as outstanding arrivals in the purchase records.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowReview(false)}
                  className="btn btn-neutral h-14 px-8 rounded-[1.5rem]"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartialReceive}
                  disabled={isProcessing}
                  className="btn btn-primary h-14 px-10 rounded-[1.5rem]"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Finalize Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

