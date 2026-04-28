"use client";

import { clsx, type ClassValue } from "clsx";
import { Edit, Eye, Flame, Loader2, MapPin, MoreVertical, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";
import { useConfirm } from "@/hooks/use-confirm";
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
  userRole,
  onViewBreakdown
}: {
  itemId: string;
  itemName: string;
  totalStock: number;
  incomingQty: number;
  minStockLevel: number;
  userRole: string;
  onViewBreakdown: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showScrap, setShowScrap] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const confirm = useConfirm();
  const neededAmount = Math.max(1, minStockLevel - totalStock);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setShowDropdown(false);
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
    <div className="relative flex justify-end" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-ghost h-8 w-8 !p-0 rounded-xl hover:bg-surface-low transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-premium border border-border-ghost z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
          <Link 
            href={`/orders/purchase/new?itemId=${itemId}&quantity=${neededAmount}`}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            onClick={() => setShowDropdown(false)}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Order Units</span>
          </Link>
          
          <button
            onClick={() => {
              onViewBreakdown();
              setShowDropdown(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors text-left"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Breakdown</span>
          </button>

          <button
            onClick={() => {
              router.push(`/inventory/${itemId}/edit`);
              setShowDropdown(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors text-left border-t border-border-ghost/50"
          >
            {userRole === 'EMPLOYEE' ? (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span>Manage Stock</span>
              </>
            ) : (
              <>
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Item</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowScrap(true);
              setShowDropdown(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors text-left"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Scrap Items</span>
          </button>

          {userRole !== 'EMPLOYEE' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors text-left border-t border-border-ghost/50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Item</span>
            </button>
          )}
        </div>
      )}

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
