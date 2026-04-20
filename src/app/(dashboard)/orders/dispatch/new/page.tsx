"use client";

import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Search,
  Send,
  Trash2
} from "lucide-react";
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

interface InventoryItem {
  id: string;
  itemId?: string;
  quantityAvailable: number;
  incomingQty: number;
  reservedQty: number;
  status: string;
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
               className="w-full py-4 bg-foreground text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
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
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantity: 1, sellingPrice: 0 }
  ]);
  const [itemSearches, setItemSearches] = useState<Record<number, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  const [shortageInfo, setShortageInfo] = useState<ShortageInfo | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cRes, iRes, invRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/items"),
          fetch("/api/inventory")
        ]);

        if (cRes.ok && iRes.ok && invRes.ok) {
          setCustomers(await cRes.json());
          setItems(await iRes.json());
          
          // Build inventory map for quick lookup
          const inventoryData = await invRes.json();
          const map = new Map<string, InventoryItem>();
          inventoryData.forEach((inv: any) => {
            map.set(inv.itemId || inv.id, {
              id: inv.itemId || inv.id,
              quantityAvailable: inv.quantityAvailable || 0,
              incomingQty: inv.incomingQty || 0,
              reservedQty: inv.quantityReserved || 0,
              status: inv.status
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
          expectedDelivery: expectedDelivery || null,
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
             className="px-8 py-3.5 text-sm font-black text-white bg-foreground rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
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
                    <div className="md:col-span-5 relative" data-item-search>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Item Details</label>
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 text-muted-foreground pointer-events-none">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search items..."
                          value={itemSearches[index] || ""}
                          onChange={(e) => handleSearchChange(index, e.target.value)}
                          onFocus={() => setOpenDropdowns({ ...openDropdowns, [index]: true })}
                          className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-10 py-3 font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                        
                        {/* Dropdown List */}
                        {openDropdowns[index] && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-lowest border border-border-ghost rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                            {getFilteredItems(itemSearches[index] || "").length > 0 ? (
                              getFilteredItems(itemSearches[index] || "").map(i => (
                                <button
                                  key={i.id}
                                  onClick={() => handleItemSelect(index, i.id, `${i.sku} - ${i.name}`)}
                                  className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border-ghost/50 last:border-b-0 transition-colors font-bold text-sm"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-bold">{i.sku} - {i.name}</div>
                                      <div className="text-xs text-muted-foreground">{i.unit}</div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                                      getAvailableStock(i.id) > 0 
                                        ? 'bg-emerald-500/10 text-emerald-700' 
                                        : 'bg-error/10 text-error'
                                    }`}>
                                      {getAvailableStock(i.id)} units
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                No items found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {item.itemId && (
                        <div className="mt-2 text-xs font-bold">
                          <span className={`inline-block px-3 py-1 rounded-lg ${
                            available > 0 
                              ? 'bg-emerald-500/10 text-emerald-700' 
                              : 'bg-error/10 text-error'
                          }`}>
                            Available: {available} units
                          </span>
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
                 <select 
                   value={selectedCustomer}
                   onChange={(e) => setSelectedCustomer(e.target.value)}
                   className="w-full bg-surface-low border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none"
                 >
                   <option value="">Select Customer</option>
                   {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">How they paid</label>
                 <select 
                   value={paymentMode}
                   onChange={(e) => setPaymentMode(e.target.value)}
                   className="w-full bg-surface-low border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none"
                 >
                   <option value="Cash">Cash</option>
                   <option value="Credit Card">Credit Card</option>
                   <option value="Debit Card">Debit Card</option>
                   <option value="Bank Transfer">Bank Transfer</option>
                   <option value="Check">Check</option>
                   <option value="Digital Wallet">Digital Wallet</option>
                   <option value="UPI">UPI</option>
                 </select>
              </div>

              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Expected Delivery</label>
                 <input 
                   type="datetime-local"
                   value={expectedDelivery}
                   onChange={(e) => setExpectedDelivery(e.target.value)}
                   className="w-full bg-surface-low border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none"
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
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
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
