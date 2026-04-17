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

interface BreakdownEntry {
  vendor: string;
  quantity: number;
  costPerUnit: number;
  purchaseDate: string;
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
  const [reservedQty, setReservedQty] = useState(0);
  const [netAvailable, setNetAvailable] = useState(0);

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

            setReservedQty(root.reservedQty || 0);
            setNetAvailable(root.netAvailable || 0);

            setBreakdown(
              batchesRaw.map((batch: any) => ({
                vendor: batch.vendor?.name || "Unknown",
                quantity: Number(batch.quantity || 0),
                costPerUnit: Number(batch.costPerUnit || 0),
                purchaseDate: batch.purchaseDate,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="px-12 pt-12 pb-8 flex items-start justify-between border-b border-border-ghost">
          <div className="flex gap-6">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <Layers className="w-8 h-8" />
            </div>
            <div>
               <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  <span className="text-primary/60">Stock</span>
                  <span className="opacity-30">/</span>
                  <span>History</span>
               </nav>
               <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none">{itemName}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-low rounded-lg border border-border-ghost">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-black text-foreground">
                      {totalStock} Units on Hand
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-low rounded-lg border border-border-ghost">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-black text-foreground">
                      {incomingQty} Incoming
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-low rounded-lg border border-border-ghost">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-black text-foreground">
                      {reservedQty} Reserved
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
                    netAvailable < 0 
                      ? 'bg-error/10 border-error/20 text-error' 
                      : 'bg-success/10 border-success/20 text-success'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Net Available: {netAvailable}
                    </span>
                  </div>
                </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 rounded-2xl hover:bg-surface-low text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border-ghost"
          >
             <X className="w-8 h-8" />
          </button>
        </header>

        <div className="p-12 overflow-y-auto max-h-[60vh] no-scrollbar">
           {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg font-bold text-muted-foreground animate-pulse">Loading stock details...</p>
             </div>
           ) : (breakdown.length > 0 || incomingPOs.length > 0 || customerOrders.length > 0) ? (
             <div className="space-y-12">
                {breakdown.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                          <History className="w-5 h-5 text-primary" />
                          Stock Breakdown
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground italic">Current stock from all sources</span>
                    </div>

                    <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden">
                      <table className="w-full text-left">
                          <thead>
                            <tr className="bg-surface-low/50 border-b border-border-ghost">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor Name</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Cost per Unit</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Purchase Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-ghost">
                            {breakdown.map((entry, idx) => {
                              return (
                                <tr key={idx} className="group hover:bg-white transition-colors">
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-[10px] border border-primary/10">
                                        {entry.vendor?.[0] || "V"}
                                      </div>
                                      <span className="font-bold text-foreground text-sm">{entry.vendor}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-surface-lowest rounded-lg border border-border-ghost font-black text-xs text-foreground">
                                        {entry.quantity}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-right font-black text-foreground">
                                    {Number(entry.costPerUnit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                                      <Calendar className="w-4 h-4 text-primary opacity-40" />
                                      {new Date(entry.purchaseDate).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {customerOrders.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                          <Package className="w-5 h-5 text-indigo-600" />
                          Linked Customer Orders (Reserved)
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground italic">Current demand for this item</span>
                    </div>

                    <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden">
                      <table className="w-full text-left">
                          <thead>
                            <tr className="bg-surface-low/50 border-b border-border-ghost">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-ghost">
                            {customerOrders.map((order) => (
                              <tr key={order.orderId} className="group hover:bg-white transition-colors">
                                <td className="px-8 py-6 font-mono font-bold text-xs text-foreground">#{order.orderId.split("-")[0].toUpperCase()}</td>
                                <td className="px-8 py-6 font-bold text-sm text-foreground">{order.customer}</td>
                                <td className="px-8 py-6 font-black text-sm text-foreground">{order.quantity}</td>
                                <td className="px-8 py-6">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                    order.status === 'Backordered' ? 'bg-error/10 text-error' : 
                                    order.status === 'Pending Procurement' ? 'bg-warning/10 text-warning' :
                                    'bg-surface-low text-muted-foreground'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-foreground">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {incomingPOs.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                          <Truck className="w-5 h-5 text-primary" />
                          Incoming Purchase Orders
                      </h3>
                    </div>
                    <div className="bg-surface-low/30 rounded-3xl border border-border-ghost overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-surface-low/50 border-b border-border-ghost">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">PO ID</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Delivery</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-ghost">
                          {incomingPOs.map((po) => (
                            <tr key={po.poId} className="group hover:bg-white transition-colors">
                              <td className="px-8 py-6 font-mono font-bold text-xs text-foreground">#{po.poId.split("-")[0].toUpperCase()}</td>
                              <td className="px-8 py-6 font-bold text-sm text-foreground">{po.vendor}</td>
                              <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-surface-lowest rounded-lg border border-border-ghost font-black text-xs text-foreground">
                                  {po.quantity}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{po.status}</span>
                              </td>
                              <td className="px-8 py-6 text-sm font-bold text-foreground">
                                {po.expectedDelivery
                                  ? new Date(po.expectedDelivery).toLocaleString([], { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
             </div>
           ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center gap-6 opacity-30">
                <div className="w-24 h-24 rounded-full bg-surface-low flex items-center justify-center">
                  <Truck className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">No Active Operations</h3>
                  <p className="font-medium mt-2 max-w-sm">There are no linked customer orders or purchase orders for this item.</p>
                </div>
             </div>
           )}
        </div>

        <footer className="px-12 py-10 bg-surface-low/30 border-t border-border-ghost flex justify-between items-center text-sm font-bold text-muted-foreground italic">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Fully Audit-Compliant Records
           </div>
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-foreground text-surface-lowest rounded-2xl font-black shadow-xl hover:scale-[1.05] active:scale-95 transition-all text-[12px] uppercase tracking-widest"
           >
              Close Ledger
           </button>
        </footer>
      </div>
    </div>
  );
}
