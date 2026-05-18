"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
import AdvancedPurchaseFilters from "./components/AdvancedPurchaseFilters";
import PurchaseOrdersTable from "./components/PurchaseOrdersTable";

interface PurchaseOrdersListProps {
  pos: any[];
  vendors: any[];
  items: any[];
  filters: any;
}

export default function PurchaseOrdersList({
  pos,
  vendors,
  items,
  filters,
}: PurchaseOrdersListProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleAll = () => {
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pos.map((p) => p.id)));
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

  const handleBulkAction = async (action: "ORDERED" | "RECEIVED" | "CANCELLED") => {
    if (selectedIds.size === 0) return;

    let title = "";
    let desc = "";
    if (action === "ORDERED") {
      title = "Bulk Mark Ordered";
      desc = `Are you sure you want to mark ${selectedIds.size} purchase orders as ORDERED?`;
    } else if (action === "RECEIVED") {
      title = "Bulk Mark Received";
      desc = `Are you sure you want to mark ${selectedIds.size} purchase orders as RECEIVED? Remaining quantities will be updated and moved to Quality Check (QC).`;
    } else {
      title = "Bulk Cancel";
      desc = `Are you sure you want to cancel ${selectedIds.size} purchase orders? This will release the incoming quantity from inventory.`;
    }

    if (!(await confirm(title, desc))) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/purchase-orders/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
        }),
      });

      if (res.ok) {
        showToast(`Successfully processed bulk action for ${selectedIds.size} orders`, "success");
        setSelectedIds(new Set());
        startTransition(() => {
          router.refresh();
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to process bulk update.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdvancedPurchaseFilters
        vendors={vendors}
        items={items}
        currentFilters={filters}
        selectedCount={selectedIds.size}
        onBulkOrdered={() => handleBulkAction("ORDERED")}
        onBulkReceived={() => handleBulkAction("RECEIVED")}
        onBulkCancel={() => handleBulkAction("CANCELLED")}
        onClearSelection={() => setSelectedIds(new Set())}
        isProcessing={isProcessing}
      />

      <PurchaseOrdersTable
        pos={pos}
        currentPage={1}
        totalPages={1}
        selectedIds={selectedIds}
        toggleOne={toggleOne}
        toggleAll={toggleAll}
      />
    </div>
  );
}
