"use client";

import { Edit, Eye, Flame, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ItemBreakdownModal } from "./ItemBreakdownModal";
import { ScrapModal } from "./ScrapModal";

export default function InventoryTableActions({
  itemId,
  itemName,
  totalStock,
  incomingQty,
  minStockLevel
}: {
  itemId: string;
  itemName: string;
  totalStock: number;
  incomingQty: number;
  minStockLevel: number;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showScrap, setShowScrap] = useState(false);

  const neededAmount = Math.max(1, minStockLevel - totalStock);

  const handleDelete = async () => {
    if (!confirm("Delete this item? This cannot be undone and only works if there is no stock.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Could not delete item");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-1">
      <Link 
        href={`/orders/purchase/new?itemId=${itemId}&quantity=${neededAmount}`}
        className="p-2 hover:bg-white rounded-xl text-success transition-all border border-transparent hover:border-border-ghost shadow-sm hover:shadow-md"
        title={`Shop ${neededAmount} more`}
      >
        <ShoppingCart className="w-5 h-5" />
      </Link>
      <button
        onClick={() => setShowBreakdown(true)}
        className="p-2 hover:bg-white rounded-xl text-primary transition-all border border-transparent hover:border-border-ghost shadow-sm hover:shadow-md"
        suppressHydrationWarning
      >
        <Eye className="w-5 h-5" />
      </button>

      <ItemBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        itemId={itemId}
        itemName={itemName}
        totalStock={totalStock}
        incomingQty={incomingQty}
      />
      <ScrapModal
        isOpen={showScrap}
        onClose={() => setShowScrap(false)}
        itemId={itemId}
        itemName={itemName}
        totalStock={totalStock}
      />
      <Link
        href={`/inventory/${itemId}/edit`}
        className="p-2 hover:bg-surface-low rounded-xl text-muted-foreground transition-colors"
        title="Edit Item"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={() => setShowScrap(true)}
        className="p-2 hover:bg-error/10 rounded-xl text-error transition-all border border-transparent hover:border-error/20"
        title="Scrap Inventory"
        suppressHydrationWarning
      >
        <Flame className="w-4 h-4" />
      </button>
      {/* <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 hover:bg-error/10 rounded-xl text-error transition-colors disabled:opacity-50"
        suppressHydrationWarning
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button> */}
    </div>
  );
}
