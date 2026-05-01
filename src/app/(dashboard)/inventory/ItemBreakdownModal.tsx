"use client";

import { clsx, type ClassValue } from "clsx";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  History,
  Layers,
  Package,
  ShieldCheck,
  ShoppingCart,
  Truck,
  TrendingUp,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeUnit(unit: string) {
  const u = unit?.toLowerCase().trim();
  if (!u) return "PCS";
  if (u === "pieces" || u === "piece" || u === "pcs") return "PCS";
  return unit.toUpperCase();
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
  costPerUnit: number;
}

interface CustomerOrderEntry {
  orderId: string;
  customer: string;
  quantity: number;
  status: string;
  orderDate: string;
  price: number;
}

export function ItemBreakdownModal({
  itemId,
  itemName,
  totalStock,
  incomingQty,
  reservedQty,
  minStockLevel,
  unit,
  isOpen,
  onClose
}: {
  itemId: string;
  itemName: string;
  totalStock: number;
  incomingQty: number;
  reservedQty: number;
  minStockLevel: number;
  unit: string;
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
                costPerUnit: po.costPrice || 0,
              }))
            );
            setCustomerOrders(
              customerOrdersRaw.map((order: any) => ({
                orderId: order.orderId,
                customer: order.customer,
                quantity: order.quantity,
                status: order.status,
                orderDate: order.orderDate,
                price: order.price || 0,
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
        <header className="px-8 py-6 bg-white border-b border-border-ghost sticky top-0 z-20 flex items-start justify-between shrink-0">
          <div className="flex gap-6">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-white flex items-center justify-center shadow-lg shrink-0">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                <span className="opacity-50">Stock</span>
                <div className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="text-primary/80">Asset Breakdown</span>
              </nav>
              <h2 className="text-2xl font-black leading-tight mb-2">{itemName}</h2>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const stockRemaining = Math.max(0, totalStock);
                  const pipelineRemaining = incomingPOs.reduce((acc, p) => acc + p.quantity, 0);
                  const totalUnits = stockRemaining + pipelineRemaining;
                  const stockValue = breakdown.reduce((acc, b) => acc + (b.quantity * b.costPerUnit), 0);
                  const pipelineValue = incomingPOs.reduce((acc, p) => acc + (p.quantity * p.costPerUnit), 0);
                  const totalValue = stockValue + pipelineValue;
                  const avgPrice = totalUnits === 0 ? 0 : (totalValue / totalUnits);
                  const latestPrice = breakdown.length > 0 ? breakdown[0].costPerUnit : 0;

                  const netAvailable = (totalStock + pipelineRemaining) - reservedQty;
                  const isUrgent = netAvailable < 0;

                  return (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-400 border border-blue-500/50 text-blue-950 rounded-xl shadow-sm">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-black">+{pipelineRemaining}</span>
                      </div>
                      
                      {reservedQty > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400 border border-yellow-500/50 text-yellow-900 rounded-xl shadow-sm">
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black">+{reservedQty}</span>
                        </div>
                      )}

                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-sm",
                        isUrgent ? "bg-error/5 border border-error/10 text-error animate-bounce" : "bg-primary/5 border border-primary/10 text-primary"
                      )}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-black">
                          {loading ? "..." : netAvailable} Net {isUrgent ? "(Urgent)" : "Available"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-xl border border-border-ghost shadow-sm">
                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Avg Price</span>
                        <span className="text-[11px] font-black text-foreground">
                          ₹{loading ? "..." : avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-xl border border-border-ghost shadow-sm">
                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Latest</span>
                        <span className="text-[11px] font-black text-foreground">
                          ₹{loading ? "..." : latestPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-low rounded-xl border border-border-ghost shadow-sm">
                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Min Req</span>
                        <span className="text-[11px] font-black text-foreground">
                          {minStockLevel}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost h-10 w-10 !p-0 rounded-xl group"
          >
            <X className="w-5 h-5 transition-colors" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-surface-lowest/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                <Layers className="w-5 h-5 text-primary absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-black text-muted-foreground animate-pulse tracking-tight">Synchronizing data...</p>
            </div>
          ) : (breakdown.length > 0 || incomingPOs.length > 0 || customerOrders.length > 0 || purchaseHistory.length > 0 || sellingHistory.length > 0) ? (
            <div className="space-y-8">
              {/* Modern Tab System */}
              <div className="flex items-center gap-1.5 bg-surface-low/30 p-1 rounded-2xl border border-border-ghost w-fit mx-auto sm:mx-0">
                <button
                  onClick={() => setActiveTab("buying")}
                  className={cn(
                    "flex items-center gap-2.5 px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    activeTab === "buying"
                      ? "bg-white text-primary shadow-lg shadow-primary/5 border border-border-ghost"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  )}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Buying</span>
                  <span className={`badge ${activeTab === "buying" ? "badge-primary" : "badge-neutral"}`}>
                    {purchaseHistory.length + incomingPOs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("selling")}
                  className={cn(
                    "flex items-center gap-2.5 px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    activeTab === "selling"
                      ? "bg-white text-error shadow-lg shadow-error/5 border border-border-ghost"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  )}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Selling</span>
                  <span className={`badge ${activeTab === "selling" ? "badge-error" : "badge-neutral"}`}>
                    {sellingHistory.length + customerOrders.length}
                  </span>
                </button>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === "buying" && (
                  <div className="space-y-8">
                    {/* Section 1: Inward Journal */}
                    <section className="space-y-6">
                      <div className="border-b border-border-ghost mb-4" />

                      <div className="table-container !bg-transparent !shadow-none !border-none">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-header !bg-transparent">
                                <th className="table-cell-header !py-3">Vendor</th>
                                <th className="table-cell-header !py-3">Date & Time</th>
                                <th className="table-cell-header !py-3">Logistics</th>
                                <th className="table-cell-header !py-3 text-right">Quantity</th>
                                <th className="table-cell-header !py-3 text-right">Unit Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-ghost/50">
                              {breakdown.length > 0 ? breakdown.map((entry, idx) => (
                                <tr key={idx} className="group hover:bg-white/50 transition-colors">
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-xs border border-primary/10">
                                        {entry.vendor?.[0] || "V"}
                                      </div>
                                      <span className="font-bold text-foreground text-xs">{entry.vendor}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-foreground">{new Date(entry.purchaseDate).toLocaleDateString('en-IN', { month: "short", day: "2-digit", year: 'numeric' })}</span>
                                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{new Date(entry.purchaseDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                      <History className="w-3.5 h-3.5 opacity-30" />
                                      <span>By {entry.receivedBy}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-primary tabular-nums">{entry.quantity}</span>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-foreground tabular-nums">₹{Number(entry.costPerUnit || 0).toLocaleString()}</span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} className="py-10 text-center">
                                    <ArrowDownLeft className="w-8 h-8 text-muted-foreground opacity-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-muted-foreground italic tracking-tight">No active stock batches found.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>

                    {/* Section 2: Supply Pipeline (Incoming POs) */}
                    <section className="space-y-6">
                      <div className="border-b border-border-ghost mb-4" />
                      <div className="table-container !bg-transparent !shadow-none !border-none">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-header !bg-transparent">
                                <th className="table-cell-header !py-3">Pipeline Asset</th>
                                <th className="table-cell-header !py-3">ETA & Status</th>
                                <th className="table-cell-header !py-3 text-right">Quantity</th>
                                <th className="table-cell-header !py-3 text-right">Unit Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-ghost/50">
                              {incomingPOs.length > 0 ? incomingPOs.map((po) => (
                                <tr key={po.poId} className="group hover:bg-white/50 transition-colors">
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center font-black text-emerald-600 text-xs border border-emerald-500/10">
                                        {po.vendor?.[0] || "V"}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-xs leading-tight">{po.vendor}</span>
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">PO #{po.poId.split("-")[0].toUpperCase()}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Calendar className="w-3 h-3 opacity-40" />
                                        <span>{po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString('en-IN', { month: "short", day: "2-digit" }) : 'CONFIRMING'}</span>
                                      </div>
                                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{po.status}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-emerald-600 tabular-nums">{po.quantity}</span>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-foreground tabular-nums">₹{Number(po.costPerUnit || 0).toLocaleString()}</span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="py-10 text-center">
                                    <Truck className="w-8 h-8 text-muted-foreground opacity-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-muted-foreground italic tracking-tight">No incoming shipments scheduled.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "selling" && (
                  <div className="space-y-8">
                    {/* Section 1: Outward Journal */}
                    <section className="space-y-8">
                      <div className="border-b border-border-ghost mb-4" />

                      <div className="table-container !bg-transparent !shadow-none !border-none">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-header !bg-transparent">
                                <th className="table-cell-header !py-3">Customer</th>
                                <th className="table-cell-header !py-3">Date & Time</th>
                                <th className="table-cell-header !py-3 text-right">Quantity</th>
                                <th className="table-cell-header !py-3 text-right">Selling Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-ghost/50">
                              {sellingHistory.length > 0 ? sellingHistory.map((entry, idx) => (
                                <tr key={idx} className="group hover:bg-white/50 transition-colors">
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-error/5 flex items-center justify-center font-black text-error text-xs border border-error/10">
                                        {entry.customer?.[0] || "C"}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-xs leading-tight">{entry.customer}</span>
                                        <span className="badge badge-success !text-[7px] !px-1.5 !py-0 w-fit mt-1">Verified</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-foreground">{new Date(entry.date).toLocaleDateString('en-IN', { month: "short", day: "2-digit", year: 'numeric' })}</span>
                                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{new Date(entry.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-error tabular-nums">{entry.quantity}</span>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-foreground tabular-nums">₹{Number(entry.price || 0).toLocaleString()}</span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="py-10 text-center">
                                    <ArrowUpRight className="w-8 h-8 text-muted-foreground opacity-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-muted-foreground italic tracking-tight">No outward history recorded.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>

                    {/* Section 2: Open Reservations (Customer Orders) */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Pending Customer Deliveries</h4>
                        <div className="h-px flex-1 bg-border-ghost ml-4" />
                      </div>
                      <div className="table-container !bg-transparent !shadow-none !border-none">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="table-header !bg-transparent">
                                <th className="table-cell-header !py-3">Customer Order</th>
                                <th className="table-cell-header !py-3">Booking Date</th>
                                <th className="table-cell-header !py-3 text-right">Reserved</th>
                                <th className="table-cell-header !py-3 text-right">Selling Price</th>
                                <th className="table-cell-header !py-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-ghost/50">
                              {customerOrders.length > 0 ? customerOrders.map((order) => (
                                <tr key={order.orderId} className="group hover:bg-white/50 transition-colors">
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-primary text-xs border border-primary/10">
                                        {order.customer?.[0] || "C"}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-xs leading-tight">{order.customer}</span>
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">ORDER #{order.orderId.split("-")[0].toUpperCase()}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                      <Calendar className="w-3 h-3 opacity-40" />
                                      <span>{new Date(order.orderDate).toLocaleDateString('en-IN', { month: "short", day: "2-digit" })}</span>
                                    </div>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-foreground tabular-nums">{order.quantity} Units</span>
                                  </td>
                                  <td className="table-cell !py-3 text-right">
                                    <span className="text-sm font-black text-foreground tabular-nums">₹{Number(order.price || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="table-cell !py-3 text-center">
                                    <span className={`badge !text-[8px] !px-2 !py-0.5 ${order.status === 'pending' ? 'badge-warning' : 'badge-primary'}`}>
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} className="py-10 text-center">
                                    <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-muted-foreground italic tracking-tight">No pending customer deliveries.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
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

        <footer className="px-8 py-6 bg-white border-t border-border-ghost shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success border border-success/10">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Blockchain Verified</p>
              <p className="text-[9px] font-bold text-muted-foreground mt-0.5 italic leading-none">Real-time inventory ledger active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary px-8 h-10 text-xs"
          >
            Dismiss Breakdown
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

