"use client";

import {
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    History,
    Layers,
    Loader2,
    Package,
    ShieldCheck,
    Truck,
    X,
    XCircle,
    ShoppingCart
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PurchaseHistoryEntry {
  vendor: string;
  quantity: number;
  remainingQty: number;
  costPerUnit: number;
  date: string;
  receivedBy: string;
}

interface SellingHistoryEntry {
  id: string;
  customer: string;
  quantity: number;
  price: number;
  date: string;
}

interface BreakdownEntry {
  vendor: string;
  quantity: number;
  costPerUnit: number;
  purchaseDate: string;
  receivedBy: string;
}

interface IncomingPOEntry {
  poId: string;
  vendor: string;
  quantity: number;
  status: string;
  expectedDelivery: string | null;
}

interface CustomerOrderEntry {
  orderId: string;
  customer: string;
  quantity: number;
  status: string;
  orderDate: string;
}

export function ItemBreakdownModal({ 
  itemId, 
  itemName, 
  totalStock,
  incomingQty,
  minStockLevel,
  isOpen, 
  onClose 
}: { 
  itemId: string; 
  itemName: string; 
  totalStock: number;
  incomingQty: number;
  minStockLevel: number;
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<BreakdownEntry[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryEntry[]>([]);
  const [sellingHistory, setSellingHistory] = useState<SellingHistoryEntry[]>([]);
  const [incomingPOs, setIncomingPOs] = useState<IncomingPOEntry[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderEntry[]>([]);
  const [totalVisibility, setTotalVisibility] = useState(0);
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      async function fetchBreakdown() {
        setLoading(true);
        try {
          const res = await fetch(`/api/inventory/${itemId}`);
          if (res.ok) {
            const root: any = await res.json();
            const inventory = root.inventory || {};

            const batchesRaw = Array.isArray(inventory.batches) ? inventory.batches : [];
            const incomingOrdersRaw = Array.isArray(root.incomingPurchaseOrders) ? root.incomingPurchaseOrders : [];
            const customerOrdersRaw = Array.isArray(root.linkedCustomerOrders) ? root.linkedCustomerOrders : [];

            setTotalVisibility(root.totalVisibility || 0);

            setPurchaseHistory(root.purchaseHistory || []);
            setSellingHistory(root.sellingHistory || []);
            setBreakdown(
              batchesRaw.map((batch: any) => ({
                vendor: batch.vendor?.name || "Unknown",
                quantity: Number(batch.remainingQty || 0),
                costPerUnit: Number(batch.costPerUnit || 0),
                purchaseDate: batch.purchaseDate,
                receivedBy: batch.receivedBy?.name || "System",
              }))
            );
            setIncomingPOs(
              incomingOrdersRaw.map((po: any) => ({
                poId: po.poId,
                vendor: po.vendor,
                quantity: po.quantity,
                status: po.status,
                expectedDelivery: po.expectedDelivery,
              }))
            );
            setCustomerOrders(
              customerOrdersRaw.map((order: any) => ({
                orderId: order.orderId,
                customer: order.customer,
                quantity: order.quantity,
                status: order.status,
                orderDate: order.orderDate,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch breakdown:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchBreakdown();
    }
  }, [isOpen, itemId]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <header className="px-12 py-10 bg-white border-b border-border-ghost sticky top-0 z-20 flex items-start justify-between shrink-0">
          <div className="flex gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-foreground text-white flex items-center justify-center shadow-2xl shrink-0">
               <Layers className="w-10 h-10" />
            </div>
            <div>
               <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">
                  <span className="opacity-50">Stock</span>
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  <span className="text-primary/80">Asset Breakdown</span>
               </nav>
               <h2 className="heading-xl leading-tight mb-4">{itemName}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 rounded-2xl shadow-sm">
                    <Package className="w-4 h-4" />
                    <span className="text-[12px] font-black">{totalStock} Units On Hand</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-primary/5 border border-primary/10 text-primary rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Avg Purchase Price</span>
                    <span className="text-[12px] font-black">
                      ₹{(() => {
                        const totalRemaining = breakdown.reduce((acc, b) => acc + b.quantity, 0);
                        if (totalRemaining === 0) return "0";
                        const weightedSum = breakdown.reduce((acc, b) => acc + (b.quantity * b.costPerUnit), 0);
                        return (weightedSum / totalRemaining).toLocaleString(undefined, { maximumFractionDigits: 0 });
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-low rounded-2xl border border-border-ghost shadow-sm">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[12px] font-black text-muted-foreground">{incomingQty} Pipeline</span>
                  </div>
                </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost h-14 w-14 !p-0 rounded-2xl group"
          >
             <X className="w-8 h-8 transition-colors" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-surface-lowest/50">
           {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                   <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                   <Layers className="w-6 h-6 text-primary absolute inset-0 m-auto" />
                </div>
                <p className="text-lg font-black text-muted-foreground animate-pulse tracking-tight">Synchronizing data...</p>
             </div>
           ) : (breakdown.length > 0 || incomingPOs.length > 0 || customerOrders.length > 0 || purchaseHistory.length > 0 || sellingHistory.length > 0) ? (
             <div className="space-y-12">
                {/* Modern Tab System */}
                <div className="flex items-center gap-1.5 bg-surface-low/30 p-1.5 rounded-3xl border border-border-ghost w-fit mx-auto sm:mx-0">
                   <button 
                     onClick={() => setActiveTab("buying")}
                     className={cn(
                       "flex items-center gap-3 px-12 py-3.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all",
                       activeTab === "buying" 
                         ? "bg-white text-primary shadow-lg shadow-primary/5 border border-border-ghost" 
                         : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                     )}
                   >
                     <ArrowDownLeft className="w-4 h-4" />
                     <span>Buying</span>
                     <span className={`badge ${activeTab === "buying" ? "badge-primary" : "badge-neutral"}`}>
                        {purchaseHistory.length + incomingPOs.length}
                     </span>
                   </button>

                   <button 
                     onClick={() => setActiveTab("selling")}
                     className={cn(
                       "flex items-center gap-3 px-12 py-3.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all",
                       activeTab === "selling" 
                         ? "bg-white text-error shadow-lg shadow-error/5 border border-border-ghost" 
                         : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                     )}
                   >
                     <ArrowUpRight className="w-4 h-4" />
                     <span>Selling</span>
                     <span className={`badge ${activeTab === "selling" ? "badge-error" : "badge-neutral"}`}>
                        {sellingHistory.length + customerOrders.length}
                     </span>
                   </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {activeTab === "buying" && (
                    <div className="space-y-16">
                      {/* Section 1: Inward Journal */}


                      {/* Section 2: Supply Pipeline (Incoming POs) */}
                      <section className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-border-ghost pb-6 px-2 text-emerald-600">
                          <Truck className="w-6 h-6" />
                          <h3 className="heading-md uppercase">Supply Pipeline</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {incomingPOs.length > 0 ? incomingPOs.map((po) => (
                            <div key={po.poId} className="bg-surface-lowest p-8 rounded-[2.5rem] border border-border-ghost shadow-ambient transition-all group relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Truck className="w-12 h-12 text-emerald-600 rotate-12" />
                              </div>
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  <span className="badge badge-primary">PO #{po.poId.split("-")[0].toUpperCase()}</span>
                                  <h4 className="text-xl font-black text-foreground mt-4 tracking-tight">{po.vendor}</h4>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="badge badge-success text-[10px]">
                                       ETA: {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN', { month: "short", day: "2-digit", year: "numeric" }) : 'CONFIRMING'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-8 flex items-end justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Expected</span>
                                      <span className="text-2xl font-black text-emerald-600">+{po.quantity} Units</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="badge badge-neutral text-[10px]">{po.status}</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="col-span-full bg-surface-low/30 rounded-[2.5rem] border border-border-ghost border-dashed py-16 text-center">
                               <Truck className="w-12 h-12 text-muted-foreground opacity-10 mx-auto mb-4" />
                               <p className="text-xs font-bold text-muted-foreground italic tracking-tight">No incoming shipments scheduled.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "selling" && (
                    <div className="space-y-16">
                      {/* Section 1: Outward Journal */}
                      <section className="space-y-8">
                        <div className="flex items-end justify-between border-b border-border-ghost pb-6 px-2">
                          <div>
                            <h3 className="heading-md flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center text-error border border-error/10">
                                 <ArrowUpRight className="w-5 h-5" />
                               </div>
                               Outward Journal
                            </h3>
                            <p className="text-xs font-bold text-muted-foreground mt-2 tracking-tight">Log of all dispatches and inventory deductions.</p>
                          </div>
                          <span className="badge badge-neutral opacity-40">COMPLETED DISPATCHES</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {sellingHistory.length > 0 ? sellingHistory.map((entry, idx) => (
                            <div key={idx} className="group bg-surface-lowest p-6 rounded-[2rem] border border-border-ghost shadow-ambient transition-all duration-500">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 rounded-2xl bg-error/5 flex items-center justify-center font-black text-error text-lg border border-error/10 transition-all duration-500">
                                    {entry.customer?.[0] || "C"}
                                  </div>
                                  <div>
                                    <span className="font-black text-foreground text-lg tracking-tight block">{entry.customer}</span>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                       <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-40" /> {new Date(entry.date).toLocaleDateString('en-IN', { month: "short", day: "2-digit", year: "numeric" })}</span>
                                       <div className="w-1 h-1 rounded-full bg-border-ghost" />
                                       <span className="badge badge-success text-[10px]">Verified</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-6 md:gap-12">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-50">Quantity</span>
                                    <span className="text-lg font-black text-error tabular-nums">-{entry.quantity}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-50">Sale Price</span>
                                    <span className="text-lg font-black text-foreground tabular-nums">₹{Number(entry.price || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="bg-surface-low/30 rounded-[2.5rem] border border-border-ghost border-dashed py-16 text-center">
                               <ArrowUpRight className="w-12 h-12 text-muted-foreground opacity-10 mx-auto mb-4" />
                               <p className="text-xs font-bold text-muted-foreground italic tracking-tight">No outward history recorded.</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Section 2: Open Reservations (Customer Orders) */}
                      <section className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-border-ghost pb-6 px-2 text-primary">
                          <ShoppingCart className="w-6 h-6" />
                          <h3 className="heading-md uppercase">Open Reservations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {customerOrders.length > 0 ? customerOrders.map((order) => (
                            <div key={order.orderId} className="bg-surface-lowest p-8 rounded-[2.5rem] border border-border-ghost shadow-ambient transition-all group relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                 <ShoppingCart className="w-12 h-12 text-primary -rotate-12" />
                              </div>
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  <span className="badge badge-primary">ORDER #{order.orderId.split("-")[0].toUpperCase()}</span>
                                  <h4 className="text-xl font-black text-foreground mt-4 tracking-tight">{order.customer}</h4>
                                  <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">
                                     <Calendar className="w-3.5 h-3.5 opacity-40" /> Booked on {new Date(order.orderDate).toLocaleDateString('en-IN', { month: "short", day: "2-digit" })}
                                  </p>
                                </div>
                                
                                <div className="mt-8 flex items-end justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Reserved</span>
                                      <span className="text-2xl font-black text-foreground">{order.quantity} Units</span>
                                   </div>
                                   <div className="flex flex-col items-end">
                                      <span className={`badge ${order.status === 'pending' ? 'badge-warning' : 'badge-primary'}`}>
                                         {order.status}
                                      </span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="col-span-full bg-surface-low/30 rounded-[2.5rem] border border-border-ghost border-dashed py-16 text-center">
                               <ShoppingCart className="w-12 h-12 text-muted-foreground opacity-10 mx-auto mb-4" />
                               <p className="text-xs font-bold text-muted-foreground italic tracking-tight">No active reservations.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
             </div>
           ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center gap-8 group">
                <div className="w-24 h-24 rounded-[2rem] bg-surface-low border border-border-ghost flex items-center justify-center transition-all duration-700">
                  <Layers className="w-12 h-12 opacity-20" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Digital Vault Empty</h3>
                  <p className="text-sm font-bold mt-3 text-muted-foreground max-w-xs mx-auto leading-relaxed">No transactional footprints detected for this asset. Start by adding stock or creating a purchase order.</p>
                </div>
             </div>
           )}
        </div>
  
        <footer className="px-12 py-10 bg-white border-t border-border-ghost shrink-0 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/10">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-wider">Blockchain Verified</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 italic">Real-time inventory ledger active</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="btn btn-primary px-12 h-14"
           >
              Dismiss Breakdown
           </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

