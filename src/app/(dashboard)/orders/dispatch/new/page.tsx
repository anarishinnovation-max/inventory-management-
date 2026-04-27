"use client";

import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Package,
  Plus,
  Search,
  Send,
  Trash2,
  ChevronDown,
  X
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PremiumDateTimePicker } from "@/components/DateTimePicker";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LineItem {
  itemId: string;
  quantity: number;
  sellingPrice: number;
}

interface InventoryBatch {
  id: string;
  vendor?: { name: string };
  quantity: number;
  remainingQty: number;
  costPerUnit: number;
  purchaseDate: string;
}

interface InventoryItem {
  id: string;
  itemId?: string;
  quantityAvailable: number;
  incomingQty: number;
  reservedQty: number;
  status: string;
  batches?: InventoryBatch[];
}

interface ShortageInfo {
  index: number;
  item: any;
  requested: number;
  current: number;
  incoming: number;
}

function ShortagePopup({ 
  info, 
  onClose, 
  onAction 
}: { 
  info: ShortageInfo; 
  onClose: () => void; 
  onAction: (action: "PO" | "LATER" | "ANYWAY") => void 
}) {
  const totalAvailable = info.current + info.incoming;
  const shortageAmount = info.requested - totalAvailable;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-inner">
               <AlertCircle className="w-8 h-8" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">Items Running Low</h2>
               <p className="text-muted-foreground font-bold mt-2 uppercase text-[10px] tracking-widest">Need more items to finish this.</p>
            </div>
          </div>

          <div className="bg-surface-low/50 rounded-3xl p-6 border border-border-ghost space-y-4">
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Order Quantity</span>
                <span className="text-foreground">{info.requested} Units</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="text-foreground">{info.current} Units</span>
             </div>
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground">Incoming Stock</span>
                <span className="text-foreground">{info.incoming} Units</span>
             </div>
             <div className="pt-4 border-t border-border-ghost flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-error">Amount Missing</span>
                <span className="text-2xl font-black text-error">{shortageAmount} Units</span>
             </div>
          </div>

          <div className="space-y-3">
             <button 
               onClick={() => onAction("PO")}
               className="w-full py-4 bg-foreground text-white rounded-2xl font-black text-sm shadow-xl   transition-all flex items-center justify-center gap-3"
             >
               <Package className="w-4 h-4" />
               Buy Items Now
             </button>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => onAction("LATER")}
                 className="py-4 bg-surface-low text-foreground border border-border-ghost rounded-2xl font-black text-xs hover:bg-surface-lowest transition-all"
               >
                 Do Later
               </button>
               <button 
                 onClick={() => onAction("ANYWAY")}
                 className="py-4 bg-surface-low text-foreground border border-border-ghost rounded-2xl font-black text-xs hover:bg-surface-lowest transition-all"
               >
                 Finish Anyway
               </button>
             </div>
          </div>
        </div>
        <footer className="px-10 py-6 bg-surface-low border-t border-border-ghost flex justify-center">
           <button onClick={onClose} className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
             Cancel Order
           </button>
        </footer>
      </div>
    </div>
  );
}

function StockBreakdownPopup({ 
  itemName, 
  batches, 
  onClose 
}: { 
  itemName: string; 
  batches: InventoryBatch[]; 
  onClose: () => void; 
}) {
  const totalQty = batches.reduce((acc, b) => acc + b.remainingQty, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">Stock Breakdown</h2>
               <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{itemName}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-surface-low text-muted-foreground hover:bg-surface-high hover:text-foreground transition-all "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="card-premium !p-6 bg-primary/5 border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Total Available</p>
                <p className="text-3xl font-black text-primary mt-1">{totalQty} <span className="text-sm font-medium opacity-60">Units</span></p>
             </div>
             <div className="card-premium !p-6 bg-surface-low border-border-ghost">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Batches</p>
                <p className="text-3xl font-black text-foreground mt-1">{batches.length} <span className="text-sm font-medium opacity-60">Sources</span></p>
             </div>
          </div>

          <div className="bg-surface-low/50 rounded-3xl border border-border-ghost overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-low border-b border-border-ghost">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor & Source</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Purchase Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost/50">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-white transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{batch.vendor?.name || 'Stock Adjustment'}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">#{batch.id.split('-')[0].toUpperCase()}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-bold text-muted-foreground">
                            {new Date(batch.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-mono font-black text-primary text-sm">₹{batch.costPerUnit}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">Per Unit</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm font-black text-foreground">{batch.remainingQty}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <footer className="px-10 py-6 bg-surface-low border-t border-border-ghost flex justify-between items-center">
           <p className="text-[10px] font-bold text-muted-foreground italic max-w-[250px]">
             * Batches are processed on a First-In-First-Out (FIFO) basis during dispatch.
           </p>
           <button 
             onClick={onClose} 
             className="px-8 py-3 bg-foreground text-white rounded-xl font-black text-xs shadow-lg   transition-all"
           >
             Close Details
           </button>
        </footer>
      </div>
    </div>
  );
}

export default function NewDispatchOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, InventoryItem>>(new Map());
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [orderDate, setOrderDate] = useState(new Date().toISOString());
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [dispatchedBy, setDispatchedBy] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantity: 1, sellingPrice: 0 }
  ]);
  const [itemSearches, setItemSearches] = useState<Record<number, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  const [shortageInfo, setShortageInfo] = useState<ShortageInfo | null>(null);
  const [activeBreakdown, setActiveBreakdown] = useState<{ itemName: string, batches: InventoryBatch[] } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cRes, iRes, invRes, userRes] = await Promise.all([
          fetch("/api/customers?minimal=true"),
          fetch("/api/items?minimal=true"),
          fetch("/api/inventory?minimal=true"),
          fetch("/api/auth/me")
        ]);

        if (cRes.ok && iRes.ok && invRes.ok) {
          setCustomers(await cRes.json());
          setItems(await iRes.json());
          
          if (userRes.ok) {
            const userData = await userRes.json();
            setDispatchedBy(userData.name);
          }

          // Build inventory map for quick lookup
          const inventoryData = await invRes.json();
          const map = new Map<string, InventoryItem>();
          inventoryData.forEach((inv: any) => {
            map.set(inv.itemId || inv.id, {
              id: inv.itemId || inv.id,
              quantityAvailable: inv.quantityAvailable || 0,
              incomingQty: inv.incomingQty || 0,
              reservedQty: inv.quantityReserved || 0,
              status: inv.status,
              batches: inv.batches || []
            });
          });
          setInventoryMap(map);
        } else {
          setError("Failed to load labels.");
        }
      } catch (err) {
        setError("Network failure while fetching master data.");
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-item-search]')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: "", quantity: 1, sellingPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems];
    if (field === "itemId") {
      newItems[index].itemId = value as string;
    } else {
      newItems[index][field] = Number(value);
    }
    setLineItems(newItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((acc, curr) => acc + (curr.quantity * curr.sellingPrice), 0);
  };

  const getInventoryData = (itemId: string): InventoryItem | undefined => {
    return inventoryMap.get(itemId);
  };

  const getAvailableStock = (itemId: string) => {
    return getInventoryData(itemId)?.quantityAvailable || 0;
  };

  const getIncomingStock = (itemId: string) => {
    return getInventoryData(itemId)?.incomingQty || 0;
  };

  const checkStockAvailability = () => {
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.itemId) continue;
      
      const available = getAvailableStock(item.itemId);
      const incoming = getIncomingStock(item.itemId);
      const totalAvailable = available + incoming;

      if (item.quantity > totalAvailable) {
        const itemObj = items.find(it => it.id === item.itemId);
        return {
          isValid: false,
          needsPopup: true,
          shortageInfo: {
            index: i,
            item: itemObj,
            requested: item.quantity,
            current: available,
            incoming: incoming
          }
        };
      } else if (item.quantity > available) {
        // Technically has enough (current + incoming), but might still want to warn?
        // Let's stick to the prompt: shortage if exceeds (current + incoming)
      }
    }
    return { isValid: true, needsPopup: false };
  };

  const getFilteredItems = (searchQuery: string) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.sku.toLowerCase().includes(query) || 
      item.name.toLowerCase().includes(query)
    );
  };

  const handleItemSelect = (index: number, itemId: string, itemName: string) => {
    updateLineItem(index, "itemId", itemId);
    setItemSearches({ ...itemSearches, [index]: itemName });
    setOpenDropdowns({ ...openDropdowns, [index]: false });
  };

  const handleSearchChange = (index: number, query: string) => {
    setItemSearches({ ...itemSearches, [index]: query });
    setOpenDropdowns({ ...openDropdowns, [index]: true });
  };

  const handleSubmit = async (e?: React.FormEvent, customStatus?: string) => {
    if (e) e.preventDefault();
    if (!selectedCustomer) {
      setError("Please select a customer recipient.");
      return;
    }
    if (lineItems.some(i => !i.itemId || i.quantity <= 0)) {
      setError("Please ensure all line items have valid specifications.");
      return;
    }

    if (!customStatus) {
      // Check stock availability before submitting
      const stockCheck = checkStockAvailability();
      if (!stockCheck.isValid) {
        if (stockCheck.needsPopup) {
            setShortageInfo(stockCheck.shortageInfo as ShortageInfo);
            return;
        }
        setError("Fulfillment logic error.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dispatch-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          paymentMode: paymentMode,
          orderDate: orderDate,
          expectedDelivery: expectedDelivery || null,
          collectedBy: collectedBy,
          dispatchedBy: dispatchedBy,
          transportMode: transportMode,
          items: lineItems,
          status: customStatus || "pending"
        }),
      });

      if (res.ok) {
        router.push("/orders/dispatch");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Fulfillment creation failed.");
      }
    } catch (err) {
      setError("Internal server link failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleShortageAction = (action: "PO" | "LATER" | "ANYWAY") => {
    const info = shortageInfo;
    setShortageInfo(null);
    if (!info) return;

    if (action === "PO") {
        const itemId = info.item.id;
        const totalAvail = info.current + info.incoming;
        const shortage = info.requested - totalAvail;
        router.push(`/orders/purchase/new?itemId=${itemId}&quantity=${shortage}`);
    } else if (action === "LATER") {
        handleSubmit(undefined, "Pending Procurement");
    } else if (action === "ANYWAY") {
        handleSubmit(undefined, "Backordered");
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto pb-24">
      {shortageInfo && (
        <ShortagePopup 
          info={shortageInfo} 
          onClose={() => setShortageInfo(null)}
          onAction={handleShortageAction}
        />
      )}
      {activeBreakdown && (
        <StockBreakdownPopup 
          itemName={activeBreakdown.itemName}
          batches={activeBreakdown.batches}
          onClose={() => setActiveBreakdown(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <Link href="/orders/dispatch" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sales List</span>
          </Link>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Sell & Send Items</h1>
          <p className="text-muted-foreground text-lg font-medium">Set up a new order for a customer.</p>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/orders/dispatch" className="px-6 py-3.5 text-sm font-bold text-muted-foreground hover:bg-surface-low rounded-2xl border border-transparent transition-all">
             Cancel
           </Link>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="px-8 py-3.5 text-sm font-black text-white bg-foreground rounded-2xl shadow-xl   transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             {loading ? "Saving..." : "Confirm Sale"}
           </button>
        </div>
      </div>

      {error && (
        <div className="p-5 mb-8 rounded-3xl bg-error/10 border border-error/20 text-error font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content: Line Items */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
            <div className="flex items-center justify-between mb-8 border-b border-border-ghost pb-6">
               <h3 className="text-xl font-black flex items-center gap-3 text-foreground">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="w-5 h-5" />
                 </div>
                 Items to Sell
               </h3>
               <button 
                 onClick={addLineItem}
                 type="button" 
                 className="flex items-center gap-2 text-xs font-black text-primary hover:underline bg-primary/5 px-4 py-2 rounded-xl transition-colors"
               >
                 <Plus className="w-4 h-4" /> Add Item
               </button>
            </div>

            <div className="space-y-6">
              {lineItems.map((item, index) => {
                const available = getAvailableStock(item.itemId);
                const isExceeding = item.itemId && item.quantity > available;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end" key={index}>
                    <div className="md:col-span-5 relative">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Item Details</label>
                      <SearchableSelect 
                        items={items}
                        value={item.itemId}
                        onChange={(val) => {
                          const i = items.find(it => it.id === val);
                          handleItemSelect(index, val, i ? `${i.sku} - ${i.name}` : "");
                        }}
                        placeholder="Search items..."
                        renderItem={(i) => (
                          <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col min-w-0">
                               <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5 truncate">{i.sku}</span>
                               <span className="text-sm font-bold truncate">{i.name}</span>
                            </div>
                            <div className={`text-[10px] font-black px-2 py-1 rounded-lg ml-3 shrink-0 ${
                              getAvailableStock(i.id) > 0 
                                ? 'bg-emerald-500/10 text-emerald-700' 
                                : 'bg-error/10 text-error'
                            }`}>
                              {getAvailableStock(i.id)} units
                            </div>
                          </div>
                        )}
                      />
                      
                      {item.itemId && (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                             <div className="flex flex-col gap-1 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-tighter">Total Available</span>
                                <span className="text-xs font-black text-emerald-700">{available} units</span>
                             </div>
                             {(() => {
                                const data = getInventoryData(item.itemId);
                                const batches = data?.batches || [];
                                const totalRemaining = batches.reduce((acc, b) => acc + b.remainingQty, 0);
                                const avgPrice = totalRemaining > 0 
                                  ? batches.reduce((acc, b) => acc + (b.remainingQty * b.costPerUnit), 0) / totalRemaining 
                                  : 0;
                                const latestPrice = batches.length > 0 ? batches[0].costPerUnit : 0;

                                return (
                                  <>
                                    <div className="flex flex-col gap-1 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl">
                                       <span className="text-[9px] font-black text-primary/60 uppercase tracking-tighter">Avg Rate</span>
                                       <span className="text-xs font-black text-primary">₹{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                       <span className="text-[9px] font-black text-indigo-600/60 uppercase tracking-tighter">Latest Rate</span>
                                       <span className="text-xs font-black text-indigo-700">₹{latestPrice.toLocaleString()}</span>
                                    </div>
                                  </>
                                );
                             })()}
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {item.itemId && (
                               <button
                                 type="button"
                                 onClick={() => {
                                   const data = getInventoryData(item.itemId);
                                   if (data && data.batches) {
                                      setActiveBreakdown({
                                         itemName: itemSearches[index] || "Selected Item",
                                         batches: data.batches
                                      });
                                   }
                                 }}
                                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-low text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest border border-border-ghost"
                               >
                                 <Eye className="w-3 h-3" />
                                 View Breakdown
                               </button>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        className={`w-full bg-surface-lowest border rounded-xl px-4 py-3 font-mono font-bold text-sm focus:ring-2 outline-none ${
                          isExceeding 
                            ? 'border-error/50 focus:ring-error/50' 
                            : 'border-border-ghost focus:ring-primary'
                        }`}
                      />
                      {isExceeding && (
                        <p className="text-[10px] text-error font-bold mt-1">⚠️ Exceeds available stock</p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Selling Price (₹)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={item.sellingPrice}
                        onChange={(e) => updateLineItem(index, "sellingPrice", e.target.value)}
                        className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3 font-mono font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                      <button 
                        onClick={() => removeLineItem(index)}
                        className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Customer & Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
              <h3 className="text-xl font-black text-foreground border-b border-border-ghost pb-4">Sale Details</h3>
              
              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Customer Name</label>
                 <SearchableSelect 
                   items={customers}
                   value={selectedCustomer}
                   onChange={(val) => setSelectedCustomer(val)}
                   placeholder="Select Customer"
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">How they paid</label>
                 <SearchableSelect 
                   items={["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Check", "Digital Wallet", "UPI"].map(m => ({ id: m, name: m }))}
                   value={paymentMode}
                   onChange={(val) => setPaymentMode(val)}
                   placeholder="Select Payment Method"
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Collected By (Customer Side)</label>
                 <input 
                   type="text"
                   value={collectedBy}
                   onChange={(e) => setCollectedBy(e.target.value)}
                   placeholder="Who is picking it up?"
                   className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Dispatched By (Our Staff)</label>
                 <input 
                   type="text"
                   value={dispatchedBy}
                   readOnly
                   placeholder="Who is sending it?"
                   className="w-full bg-surface-low border border-border-ghost rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-not-allowed opacity-70"
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Transport Mode</label>
                 <SearchableSelect 
                   items={["Self Pickup", "Delivery Truck", "Courier", "Rickshaw", "Bike", "Other"].map(m => ({ id: m, name: m }))}
                   value={transportMode}
                   onChange={(val) => setTransportMode(val)}
                   placeholder="Select Transport"
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Order Date</label>
                 <PremiumDateTimePicker 
                   value={orderDate}
                   onChange={(val) => setOrderDate(val)}
                   placeholder="Select Order Date"
                   minDate={new Date()}
                 />
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Expected Delivery</label>
                 <PremiumDateTimePicker 
                   value={expectedDelivery}
                   onChange={(val) => setExpectedDelivery(val)}
                   placeholder="Select Delivery Date & Time"
                   minDate={new Date()}
                 />
              </div>

              <div className="pt-6 border-t border-border-ghost space-y-5">
                 <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                    <span>Items in Order</span>
                    <span className="text-foreground">{lineItems.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">Total Units</span>
                    <span className="text-[15px] font-black text-foreground">{lineItems.reduce((acc, curr) => acc + curr.quantity, 0)} Units</span>
                 </div>
                 <div className="pt-6 border-t border-border-ghost flex justify-between items-baseline">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Total Bill</span>
                    <div className="text-right">
                       <span className="text-3xl font-black text-foreground tracking-tighter">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Excluding GST</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl  transition-all duration-700"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <CheckCircle2 className="w-5 h-5 opacity-80" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Selling Flow</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10">
                Confirming this order will set aside items. We remove items from stock only after you confirm they are sent.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

