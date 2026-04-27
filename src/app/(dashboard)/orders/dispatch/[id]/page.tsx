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

export default function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
            setError("Dispatch order not found.");
          }
        }
      } catch (err) {
        setError("Failed to load dispatch details.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleDispatch = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/dispatch-orders/${id}/dispatch`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to confirm dispatch.");
      }
    } catch (err) {
      setError("Network or server failure.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Retrieving Fulfillment Mandate...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-lg font-bold text-foreground">{error || "Order not found"}</p>
        <Link href="/orders/dispatch" className="btn-secondary">Back to Dispatch List</Link>
      </div>
    );
  }

  const isDispatched = order.status === "dispatched";

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-4">
          <Link href="/orders/dispatch" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dispatch Registry</span>
          </Link>
          <div className="flex items-center gap-4">
             <h1 className="text-4xl font-black tracking-tight text-foreground">DO #{order.id.split('-')[0].toUpperCase()}</h1>
             <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                isDispatched ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
             )}>
                {order.status}
             </span>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Customer Recipient: <span className="text-foreground font-black">{order.customer.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Items */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
              <h3 className="text-xl font-black text-foreground mb-8 border-b border-border-ghost pb-6 flex items-center gap-3">
                 <Package className="w-6 h-6 text-primary" />
                 Items for Fulfillment
              </h3>
              
              <div className="space-y-6">
                 {order.items.map((item: any) => (
                    <div key={item.id} className="p-6 bg-surface-low/30 rounded-3xl border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-border-ghost flex items-center justify-center font-bold text-primary">
                             {item.item.sku[0]}
                          </div>
                          <div>
                             <p className="font-black text-foreground">{item.item.name}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.item.sku}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-12 text-center">
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Quantity</p>
                             <p className="text-lg font-black text-foreground">{item.quantity} {item.item.unit}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Unit Price</p>
                             <p className="text-lg font-black text-foreground">₹{item.sellingPrice.toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Fulfillment */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
              <h3 className="text-xl font-black text-foreground border-b border-border-ghost pb-4">Consignment Action</h3>
              
              <div className="space-y-6">
                 <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Recipient Entity</p>
                    <p className="text-lg font-black text-indigo-900">{order.customer.name}</p>
                    <p className="text-xs font-medium text-indigo-700/70 mt-1">{order.customer.email || "Verification Pending"}</p>
                 </div>

                 <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Mode of Payment</p>
                    <p className="text-lg font-black text-blue-900">{order.paymentMode || "Cash"}</p>
                 </div>

                 {order.collectedBy && (
                   <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Collected By (Customer)</p>
                      <p className="text-lg font-black text-purple-900">{order.collectedBy}</p>
                   </div>
                 )}

                 {order.dispatchedBy && (
                   <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Dispatched By (Our Staff)</p>
                      <p className="text-lg font-black text-slate-900">{order.dispatchedBy}</p>
                   </div>
                 )}

                 {order.transportMode && (
                   <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Transport Mode</p>
                      <p className="text-lg font-black text-amber-900">{order.transportMode}</p>
                   </div>
                 )}

                 {isDispatched ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                       <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                       <p className="text-sm font-black text-emerald-900">Shipment confirmed and issued.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {error && (
                          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold flex items-center gap-2">
                             <AlertCircle className="w-4 h-4" />
                             {error}
                          </div>
                       )}
                       <button 
                         onClick={handleDispatch}
                         disabled={submitting}
                         className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[15px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                       >
                         {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                         {submitting ? "Processing..." : "Confirm Outward Dispatch"}
                       </button>
                       <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                          Final action: This will deduct stock from inventory.
                       </p>
                    </div>
                 )}
              </div>
           </div>

           <div className="bg-surface-lowest p-8 rounded-[2.5rem] border border-border-ghost shadow-ambient">
              <div className="flex items-center gap-3 mb-4">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Integrity Check</h4>
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
