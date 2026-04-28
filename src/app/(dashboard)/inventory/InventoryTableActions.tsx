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
        className="btn btn-ghost h-8 w-8 !p-0 rounded-xl text-success hover:bg-success/5 border-success/10"
        title={`Shop ${neededAmount} more`}
      >
        <ShoppingCart className="w-4 h-4" />
      </Link>
      <button
        onClick={() => setShowBreakdown(true)}
        className="btn btn-ghost h-8 w-8 !p-0 rounded-xl text-primary hover:bg-primary/5 border-primary/10"
        suppressHydrationWarning
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        onClick={() => router.push(`/inventory/${itemId}/edit`)}
        className={cn(
          "btn h-8 w-8 !p-0 rounded-xl",
          userRole === 'EMPLOYEE' ? "btn-primary bg-primary/5 text-primary border-primary/10" : "btn-neutral"
        )}
        title={userRole === 'EMPLOYEE' ? "Manage Stock & Rack" : "Edit Item"}
      >
        {userRole === 'EMPLOYEE' ? <MapPin className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
      </button>

      <button
        onClick={() => setShowScrap(true)}
        className="btn btn-ghost h-8 w-8 !p-0 rounded-xl text-error hover:bg-error/5 border-error/10"
        title="Scrap Item"
      >
        <Flame className="w-4 h-4" />
      </button>

      {userRole !== 'EMPLOYEE' && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn btn-ghost h-8 w-8 !p-0 rounded-xl text-error hover:bg-error/5 border-error/10"
          title="Delete Item"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}

      <ItemBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        itemId={itemId}
        itemName={itemName}
        totalStock={totalStock}
        incomingQty={incomingQty}
        minStockLevel={minStockLevel}
      />

      <ScrapModal 
        isOpen={showScrap}
        onClose={() => setShowScrap(false)}
        itemId={itemId}
        itemName={itemName}
        totalStock={totalStock}
      />
    </div>
  );
}
