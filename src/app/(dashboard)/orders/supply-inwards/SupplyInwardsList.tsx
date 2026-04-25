"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  Square, 
  CheckSquare, 
  Loader2, 
  ArrowDownToLine,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export default function SupplyInwardsList({ items }: { items: any[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-6">
      {/* Bulk Action Header */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs shadow-glow">
                {selectedIds.size}
             </div>
             <p className="text-xs font-black text-foreground uppercase tracking-widest">Items selected for receipt</p>
          </div>
          <button 
            onClick={handleBulkReceive}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
            Confirm Full Receipt
          </button>
        </div>
      )}

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
                        <div className="flex items-center gap-1.5">
                           <span className="text-[9px] font-black text-primary uppercase">PO #{item.poId.split('-')[0]}</span>
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
                      <Link href={`/orders/purchase/${item.poId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-low text-foreground font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border-ghost hover:border-primary shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
  );
}
