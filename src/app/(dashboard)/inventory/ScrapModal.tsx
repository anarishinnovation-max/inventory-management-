"use client";

import {
    AlertTriangle,
    Flame,
    Loader2,
    ShieldAlert,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function ScrapModal({ 
  itemId, 
  itemName, 
  totalStock,
  isOpen, 
  onClose 
}: { 
  itemId: string; 
  itemName: string; 
  totalStock: number;
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Damaged");

  const reasons = ["Damaged", "Expired", "Lost", "Other"];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > totalStock) {
      setError("Cannot scrap more than available stock.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inventory/scrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity, reason }),
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to scrap inventory");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <header className="px-10 py-8 bg-surface-lowest border-b border-border-ghost flex items-start justify-between shrink-0">
          <div className="flex gap-5">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-inner shrink-0 rotate-3 transition-transform">
               <Flame className="w-7 h-7" />
            </div>
            <div>
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-error/60 mb-2">
                  <span>Inventory</span>
                  <span className="opacity-30">/</span>
                  <span className="text-muted-foreground">Scrap Record</span>
               </nav>
               <h2 className="text-2xl font-black text-foreground tracking-tighter leading-tight mb-1">Scrap Inventory</h2>
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{itemName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-low text-muted-foreground hover:text-foreground transition-all"
          >
             <X className="w-6 h-6" />
          </button>
        </header>
  
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
           {error && (
             <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-bold flex items-center gap-3 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
             </div>
           )}

           <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quantity to Scrap</label>
                    <span className="text-[10px] font-black text-error uppercase tracking-tighter">Available: {totalStock}</span>
                 </div>
                 <div className="relative">
                    <input 
                      type="number" 
                      min="1" 
                      max={totalStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-6 py-4 bg-surface-low border border-border-ghost rounded-2xl text-xl font-black text-foreground outline-none focus:ring-4 focus:ring-error/10 focus:border-error/30 transition-all pr-16"
                      required
                    />

                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Reason for Scrapping</label>
                 <div className="grid grid-cols-2 gap-3">
                   {reasons.map((r) => (
                     <button
                       key={r}
                       type="button"
                       onClick={() => setReason(r)}
                       className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                         reason === r 
                         ? "bg-error/5 border-error/30 text-error shadow-sm" 
                         : "bg-white border-border-ghost text-muted-foreground hover:bg-surface-low"
                       }`}
                     >
                       {r}
                     </button>
                   ))}
                 </div>
              </div>
           </div>

           <div className="p-6 bg-error/5 rounded-3xl border border-error/10 flex gap-4">
              <ShieldAlert className="w-6 h-6 text-error shrink-0 opacity-40 mt-1" />
              <p className="text-[12px] font-medium text-error/80 leading-relaxed italic">
                By confirming, you are permanently removing these items from the live inventory. This action will be logged in the activity audit trail.
              </p>
           </div>

           <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-surface-low text-foreground rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-surface-high transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || totalStock <= 0}
                className="flex-[2] px-6 py-4 bg-error text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-error/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                Confirm Scrap
              </button>
           </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
