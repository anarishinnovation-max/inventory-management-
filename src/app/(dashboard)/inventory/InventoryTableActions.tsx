"use client";

import { Eye, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InventoryTableActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone and will only work if there is no stock associated.")) {
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
        alert(error.error || "Failed to delete item");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-2 hover:bg-surface-low rounded-xl text-primary transition-colors">
        <Eye className="w-4 h-4" />
      </button>
      <Link 
        href={`/inventory/${itemId}/edit`}
        className="p-2 hover:bg-surface-low rounded-xl text-muted-foreground transition-colors"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 hover:bg-error/10 rounded-xl text-error transition-colors disabled:opacity-50"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
