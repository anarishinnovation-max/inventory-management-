"use client";

import { clsx, type ClassValue } from "clsx";
import { Edit, Eye, Flame, Loader2, MapPin, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { ItemBreakdownModal } from "./ItemBreakdownModal";
import { ScrapModal } from "./ScrapModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InventoryTableActions({
  itemId,
  itemName,
  totalStock,
  incomingQty,
  minStockLevel,
  userRole
}: {
  itemId: string;
  itemName: string;
  totalStock: number;
  incomingQty: number;
  minStockLevel: number;
  userRole: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showScrap, setShowScrap] = useState(false);

  const confirm = useConfirm();
  const neededAmount = Math.max(1, minStockLevel - totalStock);

  const handleDelete = async () => {
    if (!(await confirm("Delete Item", "Are you sure you want to delete this item? This action cannot be undone and only works if there is no remaining stock."))) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Item deleted successfully", "success");
        router.refresh();
      } else {
        const error = await res.json();
        showToast(error.error || "Could not delete item", "error");
      }
    } catch {
      showToast("An unexpected error occurred.", "error");
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

      <button
        onClick={() => router.push(`/inventory/${itemId}/edit`)}
        className={cn(
          "p-2 rounded-xl transition-all",
          userRole === 'EMPLOYEE' ? "hover:bg-primary/10 text-primary" : "hover:bg-surface-low text-muted-foreground"
        )}
        title={userRole === 'EMPLOYEE' ? "Manage Stock & Rack" : "Edit Item"}
      >
        {userRole === 'EMPLOYEE' ? <MapPin className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
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
      {userRole !== 'EMPLOYEE' && (
        <button
          onClick={() => setShowScrap(true)}
          className="p-2 hover:bg-error/10 rounded-xl text-error transition-all border border-transparent hover:border-error/20"
          title="Scrap Inventory"
          suppressHydrationWarning
        >
          <Flame className="w-4 h-4" />
        </button>
      )}
      {userRole !== 'EMPLOYEE' && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 hover:bg-error/10 rounded-xl text-error transition-all border border-transparent hover:border-error/20 disabled:opacity-50"
          title="Delete Item"
          suppressHydrationWarning
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
