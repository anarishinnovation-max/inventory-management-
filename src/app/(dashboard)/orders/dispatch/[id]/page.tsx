"use client";

import { clsx, type ClassValue } from "clsx";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Package,
    Send,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { showToast } from "@/lib/toast";

export default function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch("/api/dispatch-orders");
        if (res.ok) {
          const orders = await res.json();
          const found = orders.find((o: any) => o.id === id);
          if (found) {
            setOrder(found);
          } else {
            showToast("Dispatch order record not found.", "error");
          }
        }
      } catch (err) {
        showToast("Failed to load dispatch details.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleDispatch = async () => {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/dispatch-orders/${id}/dispatch`, {
        method: "POST",
      });

      if (res.ok) {
        showToast("Consignment dispatch confirmed.", "success");
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to confirm dispatch.", "error");
      }
    } catch (err) {
      showToast("Network or server failure during dispatch.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs animate-pulse">Retrieving Fulfillment Mandate...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-8">
        <AlertCircle className="w-16 h-16 text-error opacity-20" />
        <p className="text-lg font-black text-foreground uppercase tracking-widest">Order data unavailable</p>
        <Link href="/orders/dispatch" className="btn btn-neutral px-8">Back to Dispatch List</Link>
      </div>
    );
  }

  const isDispatched = order.status === "dispatched";

  return (
    <div className="p-8 lg:p-12 space-y-12 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-6">
          <Link href="/orders/dispatch" className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dispatch Registry</span>
          </Link>
          <div className="flex items-center gap-6">
             <h1 className="heading-xl tracking-tight tabular-nums">DO #{order.id.split('-')[0].toUpperCase()}</h1>
             <span className={cn(
                "badge !px-4 !py-1.5",
                isDispatched ? "badge-success" : "badge-warning"
             )}>
                {order.status}
             </span>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Customer Recipient: <span className="text-foreground font-black">{order.customer.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Items */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost">
              <h3 className="heading-md mb-10 border-b border-border-ghost pb-8 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                    <Package className="w-6 h-6" />
                 </div>
                 Items for Fulfillment
              </h3>
              
              <div className="space-y-6">
                 {order.items.map((item: any) => (
                    <div key={item.id} className="p-8 bg-surface-low/30 rounded-[2rem] border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-8 group">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-border-ghost flex items-center justify-center font-black text-primary text-xl shadow-sm group-hover:border-primary/30 transition-colors">
                             {item.item.sku[0]}
                          </div>
                          <div>
                             <p className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{item.item.name}</p>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{item.item.sku}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-16 text-center">
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Target Quantity</p>
                             <p className="text-xl font-black text-foreground tabular-nums">{item.quantity} <span className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">{item.item.unit}</span></p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Unit Price</p>
                             <p className="text-xl font-black text-primary tabular-nums">₹{item.sellingPrice.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Fulfillment */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost space-y-10">
              <h3 className="heading-md border-b border-border-ghost pb-6">Consignment Action</h3>
              
              <div className="space-y-6">
                 <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Recipient Entity</p>
                    <p className="text-xl font-black text-indigo-900 tracking-tight">{order.customer.name}</p>
                    <p className="text-xs font-bold text-indigo-700/60 mt-2 uppercase tracking-tight">{order.customer.email || "Verification Pending"}</p>
                 </div>

                 <div className="p-8 rounded-[2rem] bg-blue-50 border border-blue-100 shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Mode of Payment</p>
                    <p className="text-xl font-black text-blue-900 tracking-tight">{order.paymentMode || "Cash"}</p>
                 </div>

                 {order.collectedBy && (
                   <div className="p-8 rounded-[2rem] bg-purple-50 border border-purple-100 shadow-sm">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-3">Collected By (Customer)</p>
                      <p className="text-xl font-black text-purple-900 tracking-tight">{order.collectedBy}</p>
                   </div>
                 )}

                 {order.dispatchedBy && (
                   <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Dispatched By (Our Staff)</p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">{order.dispatchedBy}</p>
                   </div>
                 )}

                 {order.transportMode && (
                   <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 shadow-sm">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3">Transport Mode</p>
                      <p className="text-xl font-black text-amber-900 tracking-tight">{order.transportMode}</p>
                   </div>
                 )}

                 {isDispatched ? (
                    <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
                          <CheckCircle2 className="w-6 h-6" />
                       </div>
                       <p className="text-sm font-black text-emerald-900 leading-tight">Shipment confirmed and issued.</p>
                    </div>
                 ) : (
                    <div className="space-y-6 pt-4">
                       <button 
                         onClick={handleDispatch}
                         disabled={submitting}
                         className="btn btn-primary w-full h-16 shadow-glow-primary !text-[15px] !rounded-[1.5rem]"
                       >
                         {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                         {submitting ? "Processing..." : "Confirm Outward Dispatch"}
                       </button>
                       <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.2em] px-4 leading-relaxed opacity-70">
                          Final action: This will permanently deduct stock from active inventory batches.
                       </p>
                    </div>
                 )}
              </div>
           </div>

           <div className="card-premium !p-8 bg-surface-low border-border-ghost shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <ShieldCheck className="w-4 h-4" />
                 </div>
                 <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Integrity Check</h4>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                 All items in this consignment have been pre-reserved at the time of order booking. Confirmation will finalize the decrement from the physical ledger.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
