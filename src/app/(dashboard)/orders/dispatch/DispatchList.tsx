"use client";

import { clsx, type ClassValue } from "clsx";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Square,
  CheckSquare,
  MinusSquare,
  X,
  Loader2,
  AlertCircle,
  Truck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { DispatchFilters } from "./DispatchFilters";

interface DispatchListProps {
  items: any[];
  searchQuery: string;
  currentStatus: string;
  role: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DispatchList({
  items,
  searchQuery,
  currentStatus,
  role
}: DispatchListProps) {
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

    const pendingOrders = items.filter(
      (item) => selectedIds.has(item.id) && item.status !== "dispatched"
    );

    if (pendingOrders.length === 0) {
      showToast("Only pending, picking or packed orders can be dispatched.", "error");
      return;
    }

    if (
      !(await confirm(
        "Bulk Dispatch",
        `Are you sure you want to dispatch the ${pendingOrders.length} selected orders?`
      ))
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/dispatch-orders/bulk-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: pendingOrders.map((o) => o.id) }),
      });

      if (res.ok) {
        showToast(`Successfully dispatched ${pendingOrders.length} orders`, "success");
        setSelectedIds(new Set());
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to dispatch orders.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedIds.size === 0) return;

    if (
      !(await confirm(
        "Bulk Cancel",
        `Are you sure you want to cancel ${selectedIds.size} selected orders? This will release reserved stock.`
      ))
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/dispatch-orders/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action: "CANCELLED",
        }),
      });

      if (res.ok) {
        showToast(`Successfully cancelled ${selectedIds.size} orders`, "success");
        setSelectedIds(new Set());
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to cancel orders.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative">
        <DispatchFilters
          searchQuery={searchQuery}
          currentStatus={currentStatus}
          selectedCount={selectedIds.size}
          onBulkDispatch={handleBulkDispatch}
          onBulkCancel={handleBulkCancel}
          onClearSelection={() => setSelectedIds(new Set())}
          isProcessing={isProcessing}
        />
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header w-12 text-center">
                  <button type="button" onClick={toggleAll} className="p-2 hover:bg-surface-low rounded-lg transition-colors group">
                    {selectedIds.size === items.length && items.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : selectedIds.size > 0 ? (
                      <MinusSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-70 transition-opacity" />
                    )}
                  </button>
                </th>
                <th className="table-cell-header">Order ID</th>
                <th className="table-cell-header">Customer Details</th>
                <th className="table-cell-header">Quantity</th>
                <th className="table-cell-header">Total Value</th>
                <th className="table-cell-header">Method</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {items.length > 0 ? (
                items.map((order: any) => {
                  const isSelected = selectedIds.has(order.id);
                  return (
                    <tr key={order.id} className={cn("table-row group", isSelected && "bg-primary/[0.03]")}>
                      <td className="table-cell text-center">
                        <button type="button" onClick={() => toggleOne(order.id)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-75 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="table-cell">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-foreground text-sm tracking-tight">
                              #{order.id.split("-")[0].toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                {new Date(order.createdAt).toLocaleDateString("en-IN")}
                              </span>
                              {order.expectedDelivery && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-border-ghost" />
                                  <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    ETA: {new Date(order.expectedDelivery).toLocaleDateString("en-IN")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">
                            {order.customer.name}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mt-0.5">
                            {order.customer.email || "Guest account"}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-neutral !text-xs !px-2.5 !py-1">
                          {order.items.length} Units
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm font-black text-foreground tabular-nums">
                          ₹
                          {order.items
                            .reduce(
                              (acc: number, curr: any) =>
                                acc + Number(curr.sellingPrice) * Number(curr.quantity),
                              0
                            )
                            .toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          {order.paymentMode || "Cash"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={cn(
                            "badge !text-xs !px-3 !py-1 uppercase",
                            order.status === "pending"
                              ? "badge-warning"
                              : order.status === "cancelled"
                              ? "badge-neutral opacity-50"
                              : "badge-success"
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/orders/dispatch/${order.id}/bill`}
                            target="_blank"
                            className="btn btn-neutral h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-success/5 hover:text-success transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Bill
                          </Link>
                          <Link
                            href={`/orders/dispatch/${order.id}`}
                            className="btn btn-primary h-10 px-5 text-xs font-black uppercase tracking-widest rounded-xl"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <AlertCircle className="w-12 h-12" />
                      <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
                        No selling orders found.
                      </p>
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
