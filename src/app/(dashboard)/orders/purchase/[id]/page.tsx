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
  AlertCircle,
  CreditCard,
  ChevronRight,
  Download
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { showToast } from "@/lib/toast";

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

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch("/api/purchase-orders");
        if (res.ok) {
          const orders = await res.json();
          const found = orders.find((o: any) => o.id === id);
          if (found) {
            setOrder(found);
          } else {
            showToast("Purchase order record not found.", "error");
          }
        }
      } catch (err) {
        showToast("Failed to load order details.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] animate-pulse">Retrieving Purchase Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-lg font-black text-foreground uppercase tracking-widest">Order not found</p>
        <Link href="/orders/purchase" className="btn btn-neutral h-12 px-8">Back to List</Link>
      </div>
    );
  }

  const totalOrdered = order.items.reduce((acc: number, item: any) => acc + item.quantityOrdered, 0);
  const totalReceived = order.items.reduce((acc: number, item: any) => acc + item.quantityReceived, 0);
  const progressPercent = Math.min(100, Math.round((totalReceived / totalOrdered) * 100));
  const isFullyReceived = totalReceived >= totalOrdered;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Link 
            href="/orders/purchase"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Procurement
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="heading-xl tracking-tighter">PO #{order.id.split('-')[0].toUpperCase()}</h1>
            <span className={cn(
              "badge text-xs py-1 px-3",
              isFullyReceived ? "badge-success" : "badge-warning"
            )}>
              {isFullyReceived ? "Inbound Complete" : "Partial Receipt"}
            </span>
          </div>
          <p className="text-muted-foreground font-medium">Tracking procurement from {order.vendor?.name}</p>
        </div>

        <div className="flex items-center gap-3">
           <Link 
             href={`/orders/purchase/${order.id}/bill`}
             target="_blank"
             className="btn btn-neutral h-12 px-6 !rounded-xl flex items-center gap-2"
           >
             <Download className="w-4 h-4" />
             Download Bill
           </Link>
           {!isFullyReceived && (
             <Link 
               href="/orders/supply-inwards"
               className="btn btn-primary h-12 px-8 shadow-glow-primary !rounded-xl"
             >
               <Truck className="w-4 h-4" />
               Process Inward
             </Link>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="card-premium !p-10 shadow-ambient border-border-ghost">
            <div className="flex items-center justify-between mb-10">
               <div className="space-y-1">
                 <h2 className="heading-md">Inbound Line Items</h2>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Verified stock arrivals</p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Fulfillment</p>
                  <p className="text-xl font-black text-primary tabular-nums">{progressPercent}%</p>
               </div>
            </div>

            <div className="w-full h-3 bg-surface-low rounded-full overflow-hidden mb-12 border border-border-ghost">
               <div 
                 className="h-full bg-linear-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out"
                 style={{ width: `${progressPercent}%` }}
               />
            </div>

            <div className="table-container !border-0 !shadow-none !bg-transparent">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-ghost">
                    <th className="py-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Item Specification</th>
                    <th className="py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Ordered</th>
                    <th className="py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Received</th>
                    <th className="py-4 text-right text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost/50">
                  {order.items.map((item: any) => {
                    const isItemFulfilled = item.quantityReceived >= item.quantityOrdered;
                    const itemPercent = Math.min(100, Math.round((item.quantityReceived / item.quantityOrdered) * 100));
                    
                    return (
                      <tr key={item.id} className="group">
                        <td className="py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-surface-low border border-border-ghost flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-foreground text-sm tracking-tight">{item.item.name}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.item.sku}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 text-right font-black text-foreground tabular-nums">
                          {item.quantityOrdered} <span className="text-xs text-muted-foreground font-bold ml-1">{item.item.unit}</span>
                        </td>
                        <td className="py-6 text-right font-black text-primary tabular-nums">
                          {item.quantityReceived}
                        </td>
                        <td className="py-6 text-right">
                          <span className={cn(
                            "badge !py-0.5 !px-2 !text-xs",
                            isItemFulfilled ? "badge-success" : "badge-warning"
                          )}>
                            {isItemFulfilled ? "Completed" : `${itemPercent}%`}
                          </span>
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
               Logistics & Vendor
            </h3>

            <div className="space-y-8">
              <div className="p-6 rounded-[2.5rem] bg-surface-low/30 border border-border-ghost space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Procurement Vendor</p>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-30" />
                </div>
                <div>
                  <p className="text-base font-black text-foreground tracking-tight">{order.vendor?.name}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">{order.vendor?.email || "No contact info"}</p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-surface-low/30 border border-border-ghost space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6 text-muted-foreground opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Expected Delivery</p>
                    <p className="text-sm font-black text-foreground tracking-tight">{formatDateTime(order.expectedDelivery)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-border-ghost flex items-center justify-center shadow-sm">
                    <CreditCard className="w-6 h-6 text-muted-foreground opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Payment Method</p>
                    <p className="text-sm font-black text-foreground tracking-tight">{order.paymentMode || "Standard Net"}</p>
                  </div>
                </div>
              </div>

              {!isFullyReceived && (
                <Link 
                  href="/orders/supply-inwards"
                  className="btn btn-primary w-full h-16 shadow-glow-primary !text-[15px] !rounded-[1.5rem]"
                >
                  <Truck className="w-5 h-5" />
                  Process Supply Inward
                </Link>
              )}
            </div>
          </div>

          <div className="card-premium !p-10 bg-surface-low border-border-ghost shadow-ambient">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-primary shadow-sm">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Fulfillment Note</p>
             </div>
             <p className="text-[13px] font-medium leading-relaxed text-muted-foreground italic">
               {isFullyReceived 
                 ? "Asset acquisition complete. Inventory registers have been updated and synchronized." 
                 : "Line items for this order are pending physical arrival. Use the Supply Inwards module to record receipts."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
