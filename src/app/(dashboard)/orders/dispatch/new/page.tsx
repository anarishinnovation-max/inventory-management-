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
  X,
  Layers,
  Building2,
  Calendar,
  CreditCard,
  IndianRupee
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PremiumDateTimePicker } from "@/components/DateTimePicker";
import { ItemBreakdownModal } from "@/app/(dashboard)/inventory/ItemBreakdownModal";
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



import { showToast } from "@/lib/toast";

export default function NewDispatchOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, InventoryItem>>(new Map());
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [orderDate, setOrderDate] = useState(new Date().toISOString());
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantity: 1, sellingPrice: 0 }
  ]);
  const [itemSearches, setItemSearches] = useState<Record<number, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  const [shortageInfo, setShortageInfo] = useState<ShortageInfo | null>(null);
  const [breakdownItem, setBreakdownItem] = useState<any | null>(null);

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
          showToast("Failed to load reference labels.", "error");
        }
      } catch (err) {
        showToast("Network failure while fetching master data.", "error");
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
      }
    }
    return { isValid: true, needsPopup: false };
  };

  const handleItemSelect = (index: number, itemId: string, itemName: string) => {
    updateLineItem(index, "itemId", itemId);
    setItemSearches({ ...itemSearches, [index]: itemName });
    setOpenDropdowns({ ...openDropdowns, [index]: false });
  };

  const handleSubmit = async (e?: React.FormEvent, customStatus?: string) => {
    if (e) e.preventDefault();
    if (!selectedCustomer) {
      showToast("Please select a customer recipient.", "info");
      return;
    }
    if (lineItems.some(i => !i.itemId || i.quantity <= 0 || i.sellingPrice <= 0)) {
      showToast("Please ensure all items have a valid quantity and selling price.", "info");
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
        showToast("Fulfillment logic error.", "error");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/dispatch-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          paymentMode: paymentMode,
          orderDate: orderDate,
          expectedDelivery: expectedDelivery || null,
          items: lineItems,
          status: customStatus || "pending"
        }),
      });

      if (res.ok) {
        showToast("Sale order confirmed successfully.", "success");
        router.push("/orders/dispatch");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Fulfillment creation failed.", "error");
      }
    } catch (err) {
      showToast("Internal server link failure.", "error");
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs animate-pulse">Synchronizing items...</p>
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
      {breakdownItem && (
        <ItemBreakdownModal 
          isOpen={!!breakdownItem}
          onClose={() => setBreakdownItem(null)}
          itemId={breakdownItem.id}
          itemName={breakdownItem.name}
          totalStock={getAvailableStock(breakdownItem.id)}
          incomingQty={getIncomingStock(breakdownItem.id)}
          reservedQty={breakdownItem.reservedQty || 0}
          minStockLevel={breakdownItem.minStockLevel || 0}
          unit={breakdownItem.unit}
        />
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-6">
          <Link href="/orders/dispatch" className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sales List</span>
          </Link>
          <h1 className="heading-xl tracking-tight">Sell & Send Items</h1>
          <p className="text-muted-foreground text-lg font-medium">Set up a new order for a customer.</p>
        </div>
        <div className="flex items-center gap-6">
           <Link href="/orders/dispatch" className="btn btn-ghost h-14 px-8 text-xs font-black uppercase tracking-widest">
             Cancel
           </Link>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="btn btn-primary h-14 px-10 shadow-glow-primary min-w-[180px]"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
             {loading ? "Saving..." : "Confirm Sale"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content: Line Items */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost">
            <div className="flex items-center justify-between mb-10 border-b border-border-ghost pb-8">
               <h3 className="heading-md flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                     <Package className="w-6 h-6" />
                  </div>
                  Items to Sell
               </h3>
               <button 
                 onClick={addLineItem}
                 type="button" 
                 className="btn btn-primary h-10 px-6 !text-[10px] !rounded-xl"
               >
                 <Plus className="w-4 h-4" /> Add Item
               </button>
            </div>

            <div className="space-y-8">
              {lineItems.map((item, index) => {
                const available = getAvailableStock(item.itemId);
                const isExceeding = item.itemId && item.quantity > available;
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end" key={index}>
                    <div className="md:col-span-6 relative">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Item Details</label>
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
                               <span className="text-sm font-black truncate">{i.name}</span>
                            </div>
                            <div className={`badge !text-[9px] !px-2.5 !py-1 ml-4 shrink-0 ${
                              getAvailableStock(i.id) > 0 
                                ? 'badge-success' 
                                : 'badge-error'
                            }`}>
                              {getAvailableStock(i.id)} U
                            </div>
                          </div>
                        )}
                      />
                      
                      {item.itemId && (() => {
                        const selectedItem = items.find(i => i.id === item.itemId);
                        const stock = available;
                        const minStock = selectedItem?.minStockLevel || 0;
                        const isCritical = stock <= 0;
                        const isLow = !isCritical && stock < minStock;
                        
                        const invData = getInventoryData(item.itemId);
                        const batches = invData?.batches || [];
                        const totalRemaining = batches.reduce((acc, b) => acc + b.remainingQty, 0);
                        const avgPrice = totalRemaining > 0 
                          ? batches.reduce((acc, b) => acc + (b.remainingQty * b.costPerUnit), 0) / totalRemaining 
                          : 0;
                        const latestPrice = batches.length > 0 ? batches[0].costPerUnit : 0;

                        return (
                          <div className={cn(
                            "mt-5 flex items-center justify-between px-6 py-3 rounded-[2rem] border text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 shadow-sm",
                            isCritical ? "bg-error/5 border-error/20 text-error" :
                            isLow ? "bg-warning/5 border-warning/20 text-warning" :
                            "bg-success/5 border-success/20 text-success"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-3 h-3 rounded-full shadow-sm",
                                isCritical ? "bg-error" : isLow ? "bg-warning" : "bg-success"
                              )} />
                              <div className="flex flex-col leading-tight">
                                <span className="tabular-nums">
                                  {isCritical ? "Out of Stock" : isLow ? "Low Stock Alert" : "Stable Stock"}: {stock.toLocaleString()} U
                                </span>
                                <span className="opacity-80">Available</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 border-l border-current/10 pl-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setBreakdownItem(selectedItem);
                                }}
                                className="w-10 h-10 rounded-2xl bg-white/90 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-sm border border-current/5"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <div className="flex flex-col items-start leading-[1.1] min-w-[30px]">
                                 <span className="opacity-60 text-[8px]">MIN:</span>
                                 <span className="text-[11px] tabular-nums">{minStock}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        className={cn(
                          "input-field !h-12 !font-mono !text-sm",
                          isExceeding && "!border-error !text-error focus:!ring-error/20"
                        )}
                      />
                      {isExceeding && (
                        <p className="text-[9px] text-error font-black uppercase tracking-widest mt-2">⚠️ Over-Stock</p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Selling Rate (₹)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={item.sellingPrice}
                        onChange={(e) => updateLineItem(index, "sellingPrice", e.target.value)}
                        className="input-field !h-12 !font-mono !text-sm"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                      <button 
                        onClick={() => removeLineItem(index)}
                        className="w-12 h-12 rounded-2xl bg-error/5 text-error flex items-center justify-center hover:bg-error/10 transition-colors border border-transparent hover:border-error/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Customer & Summary */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost space-y-8">
              <h3 className="heading-md border-b border-border-ghost pb-6">Sale Logistics</h3>
              
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Customer Name</label>
                   <SearchableSelect 
                     items={customers}
                     value={selectedCustomer}
                     onChange={(val) => setSelectedCustomer(val)}
                     placeholder="Select Recipient"
                   />
                </div>

                <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Payment Method</label>
                   <SearchableSelect 
                     items={["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Check", "Digital Wallet", "UPI"].map(m => ({ id: m, name: m }))}
                     value={paymentMode}
                     onChange={(val) => setPaymentMode(val)}
                     placeholder="Select Method"
                   />
                </div>

                <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Order Date</label>
                   <PremiumDateTimePicker 
                     value={orderDate}
                     onChange={(val) => setOrderDate(val)}
                     placeholder="Select Order Date"
                     minDate={new Date()}
                   />
                </div>

                <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Expected Delivery</label>
                   <PremiumDateTimePicker 
                     value={expectedDelivery}
                     onChange={(val) => setExpectedDelivery(val)}
                     placeholder="Select Delivery Date"
                     minDate={new Date()}
                   />
                </div>
              </div>

              <div className="pt-8 border-t border-border-ghost space-y-6">
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Line Items</span>
                    <span className="text-foreground tabular-nums">{lineItems.length}</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Total Units</span>
                    <span className="text-foreground tabular-nums">{lineItems.reduce((acc, curr) => acc + curr.quantity, 0)} Units</span>
                 </div>
                 <div className="pt-8 border-t border-border-ghost flex justify-between items-end">
                    <span className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Total Bill</span>
                    <div className="text-right">
                       <span className="text-4xl font-black text-foreground tracking-tighter tabular-nums">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       <p className="text-[9px] font-black text-muted-foreground mt-2 uppercase tracking-widest opacity-60">Excluding Taxes</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-premium bg-indigo-600 p-10 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <CheckCircle2 className="w-5 h-5" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Selling Flow</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10 opacity-90">
                Confirming this order will set aside items. Stock levels are only finalized once the order is marked as dispatched.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

