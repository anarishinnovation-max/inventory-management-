"use client";

import { X, Calendar, Package, Layers, History, BadgeCent } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BatchEntry {
  id: string;
  quantity: number;
  remainingQty: number;
  costPerUnit: number;
  purchaseDate: string;
  vendor: {
    id: string;
    name: string;
  };
}

export function StockBreakdownPopup({
  isOpen,
  onClose,
  itemName,
  totalStock,
  batches
}: {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  totalStock: number;
  batches: BatchEntry[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Only show batches with remaining stock
  const activeBatches = batches.filter(b => b.remainingQty > 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-8 py-7 bg-surface-lowest border-b border-border-ghost flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shadow-inner">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter leading-none">Buying Details</h3>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mt-1.5 opacity-60 line-clamp-1">{itemName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-surface-low text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border-ghost"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Stock</span>
              </div>
              <p className="text-3xl font-black text-primary tracking-tighter">{totalStock.toLocaleString()} <span className="text-sm font-bold opacity-60">Units</span></p>
            </div>
            <div className="bg-indigo-600/5 border border-indigo-600/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Active Batches</span>
              </div>
              <p className="text-3xl font-black text-indigo-600 tracking-tighter">{activeBatches.length} <span className="text-sm font-bold opacity-60">Entries</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] px-2 flex items-center justify-between">
              <span>Vendor & Cost Breakdown</span>
              <span className="opacity-40 italic">Sorted by Date</span>
            </p>
            {activeBatches.length > 0 ? (
              <div className="grid gap-4">
                {activeBatches.map((batch) => (
                  <div 
                    key={batch.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-7 bg-surface-low/30 rounded-[2rem] border border-border-ghost hover:border-indigo-600/20 hover:bg-white transition-all group gap-6"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-border-ghost flex items-center justify-center font-black text-indigo-600 shadow-sm  transition-transform">
                        {batch.vendor.name[0] || "V"}
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground group-hover:text-indigo-600 transition-colors leading-tight">{batch.vendor.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                              <Calendar className="w-3 h-3 opacity-40" />
                              {new Date(batch.purchaseDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 md:text-right">
                       <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest md:justify-end">
                             <BadgeCent className="w-3 h-3 text-emerald-600" />
                             Unit Cost
                          </div>
                          <p className="text-xl font-black text-foreground tracking-tighter">
                            ₹{batch.costPerUnit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                          </p>
                       </div>
                       <div className="w-px h-10 bg-border-ghost hidden md:block" />
                       <div className="space-y-0.5">
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest md:justify-end">Available</p>
                          <div className="flex items-center gap-2 md:justify-end">
                             <span className="text-xl font-black text-indigo-600 tracking-tighter">{batch.remainingQty.toLocaleString()}</span>
                             <span className="text-xs font-bold text-muted-foreground">Units</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-6 opacity-30 border-2 border-dashed border-border-ghost rounded-[2.5rem]">
                <Package className="w-16 h-16" />
                <div>
                  <p className="text-xl font-black tracking-tight">No Active Stock Found</p>
                  <p className="text-sm font-medium mt-1">All items from previous batches have been consumed.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="px-10 py-8 bg-surface-low/30 border-t border-border-ghost shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4.5 bg-foreground text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl   transition-all"
          >
            Go Back
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}


