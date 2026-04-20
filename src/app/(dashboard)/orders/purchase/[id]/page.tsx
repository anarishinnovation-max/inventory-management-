"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ChevronRight,
  PlusCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";

  return `${parsed.toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} | ${parsed.toLocaleTimeString('en-IN', {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })}`;
}

export default function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [receiveForm, setReceiveForm] = useState<{[key: string]: number}>({});

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch("/api/purchase-orders");
        if (res.ok) {
          const orders = await res.json();
          const found = orders.find((o: any) => o.id === id);
          if (found) {
            setOrder(found);
            // Initialize receive form with remaining quantities
            const initialForm: any = {};
            found.items.forEach((item: any) => {
              initialForm[item.itemId] = Math.max(0, item.quantityOrdered - item.quantityReceived);
            });
            setReceiveForm(initialForm);
          } else {
            setError("Order not found.");
          }
        }
      } catch (err) {
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleMarkAllReceived = () => {
    const allForm: any = {};
    order.items.forEach((item: any) => {
      allForm[item.itemId] = Math.max(0, item.quantityOrdered - item.quantityReceived);
    });
    setReceiveForm(allForm);
  };

  const handleReceive = async () => {
    setSubmitting(true);
    setError("");
    
    const itemsToReceive = Object.entries(receiveForm)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, receivedQty]) => ({ itemId, receivedQty }));

    if (itemsToReceive.length === 0) {
      setError("Please specify quantities to receive.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToReceive }),
      });

      if (res.ok) {
        // Refresh correctly
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to receive goods.");
      }
    } catch (err) {
      setError("Network error during receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Retrieving Procurement Audit...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-lg font-bold text-foreground">{error || "Order not found"}</p>
        <Link href="/orders/purchase" className="btn-secondary">Back to List</Link>
      </div>
    );
  }

  const isFullyReceived = order.items.every((i: any) => i.quantityReceived >= i.quantityOrdered);
  const isDelivered = order.status.toUpperCase() === "DELIVERED";

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-4">
          <Link href="/orders/purchase" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Procurement List</span>
          </Link>
          <div className="flex items-center gap-4">
             <h1 className="text-4xl font-black tracking-tight text-foreground">PO #{order.id.split('-')[0].toUpperCase()}</h1>
             <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                (order.status.toUpperCase() === "RECEIVED" || isDelivered) ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
             )}>
                {isDelivered ? "RECEIVED" : order.status}
             </span>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Verified supply source: <span className="text-foreground font-black">{order.vendor.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Line Items */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
              <h3 className="text-xl font-black text-foreground mb-8 border-b border-border-ghost pb-6 flex items-center gap-3">
                 <Package className="w-6 h-6 text-primary" />
                 Inbound Line Items
              </h3>

              {!isFullyReceived && !isDelivered && order.status.toUpperCase() !== "RECEIVED" && (
                 <div className="mb-6 flex justify-end">
                   <button 
                    onClick={handleMarkAllReceived}
                    className="text-xs font-black text-primary hover:text-primary-semibold flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10"
                   >
                     🚀 Mark All Pending as Received
                   </button>
                 </div>
               )}
              
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
                       
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center flex-1 max-w-md">
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ordered</p>
                             <p className="text-lg font-black text-foreground">{item.quantityOrdered}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Received</p>
                             <p className={cn(
                                "text-lg font-black",
                                item.quantityReceived >= item.quantityOrdered ? "text-emerald-600" : "text-orange-500"
                             )}>{item.quantityReceived}</p>
                          </div>
                          <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border-ghost pt-4 md:pt-0">
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Receive Now</p>
                             <input 
                                type="number"
                                disabled={item.quantityReceived >= item.quantityOrdered || isDelivered || order.status.toUpperCase() === "RECEIVED"}
                                value={receiveForm[item.itemId] || 0}
                                onChange={(e) => setReceiveForm({...receiveForm, [item.itemId]: parseFloat(e.target.value)})}
                                className="w-20 bg-white border border-border-ghost rounded-lg px-2 py-1 text-center font-bold text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                             />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Execution */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
              <h3 className="text-xl font-black text-foreground border-b border-border-ghost pb-4">Logistics Action</h3>
              
              <div className="space-y-6">
                 <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Vendor Summary</p>
                    <p className="text-lg font-black text-foreground">{order.vendor.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Ready for inbound verification.</p>
                 </div>

                 <div className="p-6 rounded-2xl bg-surface-low border border-border-ghost space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Meta</p>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Mode</p>
                      <p className="text-sm font-black text-foreground mt-1">{order.paymentMode || "Cash"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expected Delivery</p>
                      <p className="text-sm font-black text-foreground mt-1">{formatDateTime(order.expectedDelivery)}</p>
                    </div>
                  </div>

                 {isFullyReceived ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                       <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                       <p className="text-sm font-black text-emerald-900">Order fully received & synced to inventory.</p>
                    </div>
                 ) : (
                    <button 
                      onClick={handleReceive}
                      disabled={submitting}
                      className="w-full py-4 bg-foreground text-white rounded-2xl font-black text-[15px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5 text-emerald-400" />}
                      {submitting ? "Verifying..." : "Confirm Receipt"}
                    </button>
                 )}
              </div>
           </div>

           <div className="primary-gradient p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <Clock className="w-5 h-5 opacity-80" />
                 <p className="text-[10px] font-black uppercase tracking-widest">In-Transit Sync</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10">
                Receiving these goods will decrement <strong>Quantity In-Transit</strong> and increment <strong>Quantity Available</strong> in the main inventory ledger.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
