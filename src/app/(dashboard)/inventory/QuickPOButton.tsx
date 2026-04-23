"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  totalStock: number;
  minStockLevel: number;
}

export default function QuickPOButton({ items }: { items: Item[] }) {
  const router = useRouter();

  const lowStockItems = items.filter(
    (item) => item.totalStock < item.minStockLevel
  );

  const handleCreatePO = () => {
    if (lowStockItems.length === 0) {
      alert("All items are well stocked! No need for a quick PO right now.");
      return;
    }

    const bulkData = lowStockItems.map((item) => ({
      id: item.id,
      // Suggested quantity: refill to twice the min stock level, or at least 10 units
      q: Math.max(10, item.minStockLevel * 2 - Math.max(0, item.totalStock)),
    }));

    const bulkParam = encodeURIComponent(JSON.stringify(bulkData));
    router.push(`/orders/purchase/new?bulk=${bulkParam}`);
  };

  return (
    <button
      onClick={handleCreatePO}
      className="btn-secondary h-14 bg-surface-lowest hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all border-dashed"
      title="Create a PO for all items that are low or out of stock"
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-4 h-4" />
        <div className="flex flex-col items-start leading-tight">
          <span className="font-black text-[11px] uppercase tracking-widest">Quick Reorder</span>
          <span className="text-[9px] font-bold text-muted-foreground opacity-60">
            {lowStockItems.length} items low
          </span>
        </div>
      </div>
    </button>
  );
}
