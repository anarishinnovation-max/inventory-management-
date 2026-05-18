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
  X,
  Package
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
  const handleBulkReceiveRedirect = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(',');
    router.push(`/orders/supply-inwards/receive?ids=${ids}`);
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        <SupplyInwardsFilters
          vendors={vendors}
          currentVendorId={currentVendorId}
          currentPONumber={currentPONumber}
          currentStartDate={currentStartDate}
          currentEndDate={currentEndDate}
          searchQuery={searchQuery}
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="heading-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
               <Clock className="w-5 h-5" />
            </div>
             Pending Item Arrivals
             {selectedIds.size > 0 && (
               <button 
                 onClick={handleBulkReceiveRedirect}
                 className="badge badge-primary animate-in fade-in zoom-in duration-300 ml-3 flex items-center gap-2 hover:shadow-glow-primary transition-all group py-1.5"
               >
                 <span>{selectedIds.size} Items Selected</span>
                 <div className="w-px h-3 bg-primary/20"></div>
                 <CheckCircle2 className="w-3.5 h-3.5 group-hover:translate-y-0 transition-transform" />
               </button>
             )}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-4 opacity-40">
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
                    <button type="button" onClick={toggleAll} className="p-2 hover:bg-surface-low rounded-lg transition-colors group">
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-70 transition-opacity" />
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
                    <tr key={compositeId} className={cn("table-row group", isSelected && "bg-primary/[0.03]")}>
                      <td className="table-cell text-center">
                        <button type="button" onClick={() => toggleOne(compositeId)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-75 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-low border border-border-ghost flex items-center justify-center text-primary shrink-0 group-hover:border-primary/20 transition-all">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-foreground text-sm truncate">{item.item.name}</span>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1 font-mono">SKU: {item.item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-black text-foreground truncate">{item.vendor.name}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="badge badge-primary !text-xs !px-2 !py-0.5">PO #{item.poId.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground opacity-30" />
                          <span className="text-xs font-black text-foreground">{formatDate(item.orderDate)}</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">PENDING:</span>
                            <span className="text-sm font-black text-warning tabular-nums">{remaining}</span>
                          </div>
                          <div className="text-xs font-bold text-muted-foreground uppercase mt-1 tracking-widest tabular-nums">
                            Ordered: {item.quantityOrdered}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <button 
                          onClick={() => router.push(`/orders/supply-inwards/receive?ids=${compositeId}`)}
                          className="btn btn-primary h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl"
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
    </div>
  );
}


