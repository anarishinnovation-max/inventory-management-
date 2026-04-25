"use client";

import { 
    CheckSquare, 
    Flame, 
    ImageIcon, 
    Loader2, 
    Square, 
    Trash2, 
    X,
    Package,
    ShoppingCart
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InventoryTableActions from "./InventoryTableActions";
import SearchInput from "@/components/SearchInput";
import { MappedItem } from "./page";

export default function InventoryList({ 
  items, 
  userRole,
  searchQuery 
}: { 
  items: MappedItem[], 
  userRole: string,
  searchQuery: string
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
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

  const handleBulkCreatePO = () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    const bulkData = selectedItems.map(item => ({
      id: item.id,
      // Suggested quantity: refill to twice the min stock level, or at least 10 units if not low stock
      q: Math.max(10, (item.minStockLevel || 0) * 2 - Math.max(0, item.totalStock || 0)),
    }));

    const bulkParam = encodeURIComponent(JSON.stringify(bulkData));
    router.push(`/orders/purchase/new?bulk=${bulkParam}`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} items? This only works for items with zero stock.`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/items/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete items.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkScrap = async () => {
    if (!confirm(`Permanently scrap all remaining inventory for ${selectedIds.size} selected items?`)) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/inventory/bulk-scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), reason: "Bulk Scrap" }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to scrap items.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full max-w-2xl">
            <SearchInput 
                defaultValue={searchQuery}
                placeholder="Search items, SKU, or Rack..."
            />
        </div>

        {/* Bulk Action Bar - Now placed next to Search Bar */}
        {selectedIds.size > 0 && userRole !== 'EMPLOYEE' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="bg-white border border-border-ghost rounded-2xl shadow-premium flex items-center gap-1 p-1.5 pr-4 pl-5">
              <div className="flex flex-col pr-4 border-r border-border-ghost mr-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedIds.size} Selected</span>
              </div>
              
              <div className="flex items-center gap-1">
                  <button 
                    onClick={handleBulkCreatePO}
                    disabled={isProcessing}
                    className="p-2.5 rounded-xl hover:bg-primary/5 text-primary transition-all group"
                    title="Create Bulk PO"
                    suppressHydrationWarning
                  >
                    <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>

                  <button 
                    onClick={handleBulkScrap}
                    disabled={isProcessing}
                    className="p-2.5 rounded-xl hover:bg-error/5 text-error transition-all group"
                    title="Scrap All"
                    suppressHydrationWarning
                  >
                    <Flame className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={handleBulkDelete}
                    disabled={isProcessing}
                    className="p-2.5 rounded-xl hover:bg-error/5 text-error transition-all group"
                    title="Delete Selected"
                    suppressHydrationWarning
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  </button>

                  <div className="w-px h-4 bg-border-ghost mx-1" />

                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="p-2 rounded-xl hover:bg-surface-low text-muted-foreground hover:text-foreground transition-all"
                    suppressHydrationWarning
                  >
                    <X className="w-4 h-4" />
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
      <div className="card-premium !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4 w-10">
                  <button 
                    onClick={toggleAll}
                    className="p-2 rounded-lg hover:bg-surface-low transition-colors"
                    suppressHydrationWarning
                  >
                    {selectedIds.size === items.length && items.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="table-cell-header">Item Name & SKU</th>
                <th className="table-cell-header">Category</th>
                <th className="table-cell-header text-right">Units</th>
                <th className="table-cell-header">Rack</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {items.length > 0 ? items.map((item) => {
                const totalStock = item.totalStock;
                const incomingQty = (item.incomingQty ?? 0) + (item.quantityInTransit ?? 0);
                const netAvailable = (totalStock + incomingQty) - (item.quantityReserved || 0);
                const isUrgent = netAvailable < 0;
                const isShortage = totalStock <= 0;
                const isOrdered = incomingQty > 0;
                const isLowStock = !isOrdered && totalStock > 0 && totalStock <= item.minStockLevel;
                const isSelected = selectedIds.has(item.id);
                
                const rackLocations = (item.stocks || []).length > 0
                  ? Array.from(new Set(item.stocks.map((s: any) => s.rack.rackNumber))).join(", ")
                  : (item.totalStock > 0 ? "General" : "N/A");

                return (
                  <tr 
                    key={item.id} 
                    className={`group transition-colors border-b border-border-ghost last:border-0 ${isSelected ? "bg-primary/[0.03]" : "hover:bg-surface-low/30"}`}
                  >
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleOne(item.id)}
                        className="p-2 rounded-lg hover:bg-surface-low transition-colors"
                        suppressHydrationWarning
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 cursor-pointer" onClick={() => toggleOne(item.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground border border-border-ghost transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                          <ImageIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{item.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="badge bg-indigo-50/50 text-indigo-600 border-indigo-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-black tracking-tight ${isUrgent || isShortage ? "text-error" : isLowStock ? "text-warning" : "text-success"}`}>
                          {Math.max(0, totalStock)} <span className="text-[10px] font-medium text-muted-foreground ml-1">{item.unit}</span>
                        </span>
                        {incomingQty > 0 && (
                          <span className="text-[9px] font-black uppercase tracking-tight text-primary mt-1">
                            +{incomingQty} Ordered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-muted-foreground bg-surface-low px-2 py-1 rounded-md">
                        {rackLocations || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {isUrgent ? (
                        <span className="badge bg-error text-white border-error shadow-lg shadow-error/20">Urgent</span>
                      ) : isShortage ? (
                        <span className="badge bg-error/10 text-error border-error/20">Out of Stock</span>
                      ) : isOrdered ? (
                        <span className="badge bg-primary/5 text-primary border-primary/10">Ordered</span>
                      ) : isLowStock ? (
                        <span className="badge bg-warning/10 text-warning border-warning/20">Low Stock</span>
                      ) : (
                        <span className="badge bg-success/10 text-success border-success/20">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <InventoryTableActions
                        itemId={item.id}
                        itemName={item.name}
                        totalStock={totalStock}
                        incomingQty={incomingQty}
                        minStockLevel={item.minStockLevel || 0}
                        userRole={userRole}
                      />
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-6 rounded-3xl bg-surface-low border border-border-ghost">
                        <Package className="w-16 h-16 opacity-20" />
                      </div>
                      <p className="text-2xl font-black text-foreground">No Items Found</p>
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
