"use client";

import {
    Calendar,
    History,
    Layers,
    Loader2,
    Package,
    ShieldCheck,
    Truck,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  isOpen, 
  onClose 
}: { 
  itemId: string; 
  itemName: string; 
  totalStock: number;
  incomingQty: number;
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<BreakdownEntry[]>([]);
  const [incomingPOs, setIncomingPOs] = useState<IncomingPOEntry[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderEntry[]>([]);
  const [totalVisibility, setTotalVisibility] = useState(0);

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

            setBreakdown(
              batchesRaw.map((batch: any) => ({
                vendor: batch.vendor?.name || "Unknown",
                quantity: Number(batch.quantity || 0),
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
        <header className="px-10 py-8 bg-surface-lowest border-b border-border-ghost sticky top-0 z-20 flex items-start justify-between shrink-0">
          <div className="flex gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0 rotate-2 group-hover:rotate-0 transition-transform">
               <Layers className="w-8 h-8" />
            </div>
            <div>
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">
                  <span>Stock</span>
                  <span className="opacity-30">/</span>
                  <span className="text-muted-foreground">Item Details</span>
               </nav>
               <h2 className="text-3xl font-black text-foreground tracking-tighter leading-tight mb-3">{itemName}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-lg border border-border-ghost shadow-sm">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black text-foreground">{totalStock} Items here</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-lg border border-border-ghost shadow-sm">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-black text-foreground">{incomingQty} On the way</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-lg shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-tighter">Total Count: {totalVisibility}</span>
                  </div>
                </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-surface-low text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border-ghost"
          >
             <X className="w-7 h-7" />
          </button>
        </header>
  
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
           {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg font-black text-muted-foreground animate-pulse">Loading Details...</p>
             </div>
           ) : (breakdown.length > 0 || incomingPOs.length > 0 || customerOrders.length > 0) ? (
             <div className="space-y-12">
                {breakdown.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-ghost pb-4">
                      <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-black text-foreground tracking-tight">Buying History</h3>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60">Ordered by Date</span>
                    </div>

                    <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden">
                      <table className="w-full text-left">
                          <thead>
                            <tr className="bg-surface-low/50 border-b border-border-ghost text-muted-foreground">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Vendor</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Received By</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em]">Quantity</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-right">Price</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-ghost">
                            {breakdown.map((entry, idx) => (
                              <tr key={idx} className="group hover:bg-white transition-all duration-300">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-[10px] border border-primary/10">
                                      {entry.vendor?.[0] || "V"}
                                    </div>
                                    <span className="font-bold text-foreground text-[14px]">{entry.vendor}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-[12px] font-bold text-muted-foreground">{entry.receivedBy}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="px-3 py-1 bg-surface-lowest rounded-lg border border-border-ghost font-black text-xs text-foreground">
                                      {entry.quantity} Units
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-foreground tabular-nums text-[14px]">
                                  {Number(entry.costPerUnit || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end gap-2 text-[12px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                    <Calendar className="w-4 h-4 opacity-40" />
                                    {new Date(entry.purchaseDate).toLocaleDateString('en-IN', { month: "short", day: "2-digit", year: "numeric" })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                      </table>
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {customerOrders.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-border-ghost pb-4">
                        <Package className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-black text-foreground tracking-tight">Selling to Customers</h3>
                      </div>
                      <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden divide-y divide-border-ghost">
                        {customerOrders.map((order) => (
                          <div key={order.orderId} className="px-6 py-5 flex items-center justify-between hover:bg-white transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm">{order.customer}</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 font-mono tracking-tighter">ORDER #{order.orderId.split("-")[0].toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-sm font-black text-foreground">{order.quantity} Units</span>
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {incomingPOs.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-border-ghost pb-4">
                        <Truck className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-black text-foreground tracking-tight">Coming from Vendors</h3>
                      </div>
                      <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden divide-y divide-border-ghost">
                        {incomingPOs.map((po) => (
                          <div key={po.poId} className="px-6 py-5 flex items-center justify-between hover:bg-white transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm">{po.vendor}</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">ETA: {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN') : 'TBD'}</span>
                            </div>
                            <span className="text-sm font-black text-primary">+{po.quantity} Units</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
             </div>
           ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center gap-8 opacity-30 group">
                <div className="w-24 h-24 rounded-full bg-surface-low flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Layers className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">No Details Yet</h3>
                  <p className="text-sm font-bold mt-2 max-w-xs mx-auto">No history or upcoming orders for this item.</p>
                </div>
             </div>
           )}
        </div>
  
        <footer className="px-10 py-8 bg-surface-low/30 border-t border-border-ghost shrink-0 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground italic">
              <ShieldCheck className="w-5 h-5 text-success" />
              Activity Log Active
           </div>
           <button 
             onClick={onClose}
             className="w-full sm:w-auto px-10 py-3 bg-foreground text-surface-lowest rounded-xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
           >
              Go Back
           </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
