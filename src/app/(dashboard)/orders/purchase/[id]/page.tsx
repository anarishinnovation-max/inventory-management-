"use client";

import { useTransition, useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  X
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
  const searchParams = useSearchParams();
  const filterItemId = searchParams.get("itemId");
  
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

  const [isPending, startTransition] = useTransition();

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReceive = Object.entries(receiveForm)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, receivedQty]) => ({ itemId, receivedQty }));

    if (itemsToReceive.length === 0) {
      setError("Please specify quantities to receive.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToReceive }),
      });

      if (res.ok) {
        startTransition(() => {
          router.push("/inventory");
        });
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
        <p className="text-muted-foreground font-bold animate-pulse">Retrieving Purchase Order Details...</p>
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
    <div className="min-h-screen bg-surface-lowest">
      {/* Premium Header with Background Glow */}
      <div className="relative overflow-hidden bg-white border-b border-border-ghost">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10 relative z-10">
          <div className="space-y-6">
            <Link href="/orders/purchase" className="group flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest hover:text-primary transition-colors w-fit">
              <div className="p-2 bg-surface-low rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ArrowLeft className="w-3 h-3" />
              </div>
              <span>Back to Purchase Orders</span>
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-black tracking-tight text-foreground">PO #{order.id.split('-')[0].toUpperCase()}</h1>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    (order.status.toUpperCase() === "RECEIVED" || isDelivered) 
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-200" 
                      : order.status.toUpperCase() === "PARTIAL"
                      ? "bg-amber-500 text-white border-amber-400 shadow-amber-200"
                      : "bg-primary text-white border-primary shadow-primary/20"
                  )}>
                    {isDelivered ? "DELIVERED" : order.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                  <p className="flex items-center gap-2">
                    <Truck className="w-4 h-4 opacity-50" />
                    Verified source: <span className="text-foreground font-black">{order.vendor.name}</span>
                  </p>
                  <p className="flex items-center gap-2 border-l border-border-ghost pl-6">
                    <Clock className="w-4 h-4 opacity-50" />
                    Order Date: <span className="text-foreground font-black">{new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-surface-low/50 p-2 rounded-2xl border border-border-ghost backdrop-blur-sm">
                <div className="px-4 py-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Total Value</p>
                  <p className="text-lg font-black text-foreground leading-none">
                    ₹{order.items.reduce((acc: number, item: any) => acc + (item.costPrice * item.quantityOrdered), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Line Items */}
          <div className="lg:col-span-8 space-y-8">
            <div className="card-premium !p-0 overflow-hidden">
              <header className="p-8 border-b border-border-ghost flex items-center justify-between bg-surface-low/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Inbound Line Items</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {filterItemId ? "Showing selected item" : `${order.items.length} items to verify`}
                      {filterItemId && (
                        <button 
                          onClick={() => router.push(`/orders/purchase/${id}`)}
                          className="ml-3 text-primary hover:underline lowercase tracking-normal"
                        >
                          (show all)
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </header>

              <div className="divide-y divide-border-ghost">
                {order.items
                  .filter((item: any) => !filterItemId || item.itemId === filterItemId)
                  .map((item: any) => {
                  const percent = Math.min(100, (item.quantityReceived / item.quantityOrdered) * 100);
                  return (
                    <div key={item.id} className="p-8 hover:bg-surface-low/20 transition-all group">
                      <div className="flex flex-col xl:flex-row xl:items-center gap-8">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-border-ghost flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all shrink-0">
                            <span className="font-black text-primary/40 group-hover:text-primary transition-colors">{item.item.sku[0]}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-foreground text-lg truncate">{item.item.name}</p>
                              {item.quantityReceived >= item.quantityOrdered && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">SKU: {item.item.sku}</p>
                            
                            {/* Progress bar per item */}
                            <div className="mt-4 w-full h-1.5 bg-surface-low rounded-full overflow-hidden border border-border-ghost/50 max-w-xs">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  percent === 100 ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Rate</p>
                            <p className="text-sm font-black text-foreground">₹{Number(item.costPrice).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Order</p>
                            <p className="text-lg font-black text-foreground">{item.quantityOrdered}</p>
                          </div>
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Recv.</p>
                            <p className={cn(
                              "text-lg font-black",
                              item.quantityReceived >= item.quantityOrdered ? "text-emerald-600" : "text-amber-500"
                            )}>{item.quantityReceived}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Execution */}
          <div className="lg:col-span-4 space-y-8">
            <div className="card-premium space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-foreground tracking-tight">Logistics Action</h3>
                <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Truck className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 relative z-10">Vendor Summary</p>
                  <p className="text-xl font-black text-foreground relative z-10">{order.vendor.name}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 relative z-10 uppercase tracking-tight">Verified supply source</p>
                </div>

                {/* Overall Fulfillment Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Receipt Fulfillment</p>
                    <p className="text-[11px] font-black text-foreground">
                      {order.items.reduce((acc: number, i: any) => acc + i.quantityReceived, 0)} / {order.items.reduce((acc: number, i: any) => acc + i.quantityOrdered, 0)}
                    </p>
                  </div>
                  <div className="h-3 bg-surface-low rounded-full overflow-hidden border border-border-ghost">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                      style={{ 
                        width: `${Math.min(100, (order.items.reduce((acc: number, i: any) => acc + i.quantityReceived, 0) / order.items.reduce((acc: number, i: any) => acc + i.quantityOrdered, 0)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface-lowest border border-border-ghost space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-low rounded-lg">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Expected Delivery</p>
                      <p className="text-sm font-black text-foreground leading-none">{formatDateTime(order.expectedDelivery)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-low rounded-lg">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Payment Mode</p>
                      <p className="text-sm font-black text-foreground leading-none">{order.paymentMode || "Cash"}</p>
                    </div>
                  </div>
                </div>

                {!isFullyReceived && !isDelivered && (
                  <Link 
                    href="/orders/supply-inwards"
                    className="w-full py-5 bg-foreground text-white rounded-[2rem] font-black text-base shadow-2xl hover:bg-primary transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/btn active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      <Truck className="w-5 h-5" />
                      Go to Supply Inwards to Receive
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Order Status Note</p>
               </div>
               <p className="text-sm font-medium leading-relaxed opacity-90 italic">
                 {isFullyReceived 
                   ? "This order has been completely fulfilled and inventory has been updated." 
                   : "Items for this order are pending arrival. Please visit Supply Inwards to record delivery receipts."}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Error Toast */}
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
          <div className="bg-error text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-4">
             <AlertCircle className="w-5 h-5" />
             {error}
             <button onClick={() => setError("")} className="ml-4 p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
