"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Package,
  ArrowDownToLine,
  ArrowLeft,
  Truck,
  Clock,
  CreditCard,
  ChevronRight
} from "lucide-react";
import { showToast } from "@/lib/toast";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReceiveItem {
  poId: string;
  itemId: string;
  name: string;
  sku: string;
  unit: string;
  ordered: number;
  received: number;
  vendorName: string;
}

export default function ReceiveItemsForm({ initialItems }: { initialItems: ReceiveItem[] }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    initialItems.forEach(item => {
      initial[`${item.poId}|${item.itemId}`] = item.ordered - item.received;
    });
    return initial;
  });

  const handleUpdateQty = (id: string, qty: number) => {
    setValues(prev => ({ ...prev, [id]: qty }));
  };

  const handleSubmit = async () => {
    const selections = Object.entries(values).map(([id, qty]) => {
      const [poId, itemId] = id.split('|');
      return {
        poId,
        itemId,
        receivedQty: qty
      };
    }).filter(s => s.receivedQty > 0);

    if (selections.length === 0) {
      showToast("No quantities entered for receipt.", "info");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/purchase-orders/bulk-receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });

      if (res.ok) {
        showToast(`Successfully recorded receipt for ${selections.length} items`, "success");
        router.push("/orders/supply-inwards");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to record receipt.", "error");
      }
    } catch (err) {
      showToast("Network error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPending = initialItems.reduce((acc, item) => acc + (item.ordered - item.received), 0);
  const totalReceiving = Object.values(values).reduce((acc, val) => acc + val, 0);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Link 
            href="/orders/supply-inwards"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Inwards List
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="heading-xl tracking-tighter">Asset Receipt</h1>
            <span className="badge badge-warning text-xs py-1 px-3">Processing Arrival</span>
          </div>
          <p className="text-muted-foreground font-medium">Verifying physical stock for {initialItems.length} line items</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/orders/supply-inwards")}
            className="btn btn-neutral h-12 px-6 !rounded-xl text-xs font-black uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="btn btn-primary h-12 px-10 shadow-glow-primary !rounded-xl"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Finalize Receipt
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="card-premium !p-10 shadow-ambient border-border-ghost bg-white">
            <div className="flex items-center justify-between mb-10">
               <div className="space-y-1">
                 <h2 className="heading-md">Arrival Verification</h2>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Record physical item counts</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Batch Progress</p>
                  <p className="text-xl font-black text-primary tabular-nums">{Math.round((totalReceiving / totalPending) * 100)}%</p>
               </div>
            </div>

            <div className="table-container !border-0 !shadow-none !bg-transparent">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-ghost">
                    <th className="py-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Item Specification</th>
                    <th className="py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Pending</th>
                    <th className="py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Actual Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost/50">
                  {initialItems.map((item) => {
                    const id = `${item.poId}|${item.itemId}`;
                    const pending = item.ordered - item.received;
                    
                    return (
                      <tr key={id} className="group">
                        <td className="py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-surface-low border border-border-ghost flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-foreground text-sm tracking-tight">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/20"></span>
                                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">PO #{item.poId.split('-')[0]}</p>
                                </div>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 text-right font-black text-foreground tabular-nums">
                          {pending} <span className="text-xs text-muted-foreground font-bold ml-1">{item.unit}</span>
                        </td>
                        <td className="py-6 text-right">
                          <input
                            type="number"
                            value={values[id] ?? 0}
                            onChange={(e) => handleUpdateQty(id, parseFloat(e.target.value) || 0)}
                            max={pending}
                            min={0}
                            className="input-field w-28 h-10 text-right px-4 text-sm font-black tabular-nums shadow-inner bg-surface-low/50 focus:bg-white transition-all border-border-ghost/50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="card-premium !p-8 border-border-ghost shadow-ambient bg-white">
            <h3 className="heading-md !text-sm mb-8 flex items-center gap-2">
               <Truck className="w-4 h-4 text-primary" />
               Vendor Information
            </h3>

            <div className="space-y-8">
              <div className="p-6 rounded-[2rem] bg-surface-low/30 border border-border-ghost space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Primary Source</p>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
                </div>
                <div>
                  <p className="text-base font-black text-foreground tracking-tight">
                    {initialItems.length > 0 ? initialItems[0].vendorName : "Unknown Vendor"}
                  </p>
                  {initialItems.length > 1 && (
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 italic">
                      + multiple vendor items in batch
                    </p>
                  )}
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-surface-low/30 border border-border-ghost space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6 text-muted-foreground opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Action Date</p>
                    <p className="text-sm font-black text-foreground tracking-tight">
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 text-muted-foreground opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Batch Count</p>
                    <p className="text-sm font-black text-foreground tracking-tight">{initialItems.length} line items</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isProcessing}
                className="btn btn-primary w-full h-16 shadow-glow-primary !text-[15px] !rounded-[1.5rem]"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
                Process Arrivals
              </button>
            </div>
          </div>

          <div className="card-premium !p-10 bg-surface-low border-border-ghost shadow-ambient">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-primary shadow-sm">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Receipt Note</p>
             </div>
             <p className="text-[13px] font-medium leading-relaxed text-muted-foreground italic">
               Recording the physical arrival of these items will update the inventory registers and mark the purchase orders as partially or fully fulfilled.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
