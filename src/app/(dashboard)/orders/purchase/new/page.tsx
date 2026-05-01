"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Truck, 
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  Check,
  Eye,
  Building2,
  CreditCard,
  Calendar,
  Layers
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ItemBreakdownModal } from "@/app/(dashboard)/inventory/ItemBreakdownModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LineItem {
  itemId: string;
  quantityOrdered: number;
  costPrice: number;
}

const PAYMENT_MODE_OPTIONS = ["Cash", "Bank Transfer", "UPI", "Credit"];

import { SearchableSelect } from "@/components/SearchableSelect";


function NewPurchaseOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(true);
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [selectedVendor, setSelectedVendor] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 16));
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantityOrdered: 1, costPrice: 0 }
  ]);
  const [breakdownItem, setBreakdownItem] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [vMsg, iMsg] = await Promise.all([
          fetch("/api/vendors?minimal=true"),
          fetch("/api/items?minimal=true")
        ]);
        
        if (vMsg.ok && iMsg.ok) {
          const vendorsData = await vMsg.json();
          const itemsData = await iMsg.json();
          setVendors(vendorsData);
          setItems(itemsData);

          const bulkItems = searchParams.get("bulk");
          const qItemId = searchParams.get("itemId");
          const qQuantity = searchParams.get("quantity");
          
          if (bulkItems) {
            try {
              const decoded = JSON.parse(decodeURIComponent(bulkItems));
              if (Array.isArray(decoded)) {
                setLineItems(decoded.map(item => ({
                  itemId: item.id,
                  quantityOrdered: item.q || 1,
                  costPrice: 0
                })));
              }
            } catch (e) {
              console.error("Bulk parse error:", e);
            }
          } else if (qItemId) {
            setLineItems([{ 
              itemId: qItemId, 
              quantityOrdered: qQuantity ? parseFloat(qQuantity) : 1, 
              costPrice: 0 
            }]);
          }
        } else {
          showToast("Failed to load reference metadata.", "error");
        }
      } catch (err) {
        showToast("Network failure while fetching procurement data.", "error");
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedVendor) return;
    const vendor = vendors.find((entry) => entry.id === selectedVendor);
    if (vendor?.preferredPaymentMode) {
      setPaymentMode(vendor.preferredPaymentMode);
    }
  }, [selectedVendor, vendors]);

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: "", quantityOrdered: 1, costPrice: 0 }]);
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
    return lineItems.reduce((acc, curr) => acc + (curr.quantityOrdered * curr.costPrice), 0);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedVendor) {
      showToast("Please select a vendor source.", "info");
      return;
    }
    if (lineItems.some(i => !i.itemId || i.quantityOrdered <= 0 || i.costPrice <= 0)) {
      showToast("Please ensure all line items have a valid quantity and a unit cost.", "info");
      return;
    }

    setLoading(true);

    try {
      const normalizedExpectedDelivery = expectedDelivery ? new Date(expectedDelivery).toISOString() : null;
      
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendor,
          items: lineItems,
          paymentMode,
          orderDate,
          expectedDelivery: normalizedExpectedDelivery
        }),
      });

      if (res.ok) {
        showToast("Purchase order confirmed successfully.", "success");
        startTransition(() => {
          router.push("/orders/purchase");
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Buying items failed.", "error");
      }
    } catch (err) {
      showToast("Internal server link failure.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs animate-pulse">Syncing procurement data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-6">
          <Link href="/orders/purchase" className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity w-fit group">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Purchase Orders</span>
          </Link>
          <h1 className="heading-xl tracking-tight">Buy New Items</h1>
          <p className="text-muted-foreground text-lg font-medium">Set up a new order from vendors.</p>
        </div>
        <div className="flex items-center gap-6">
           <Link href="/orders/purchase" className="btn btn-ghost h-14 px-8 text-xs font-black uppercase tracking-widest">
             Cancel
           </Link>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="btn btn-primary h-14 px-10 shadow-glow-primary min-w-[180px]"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
             {loading ? "Saving..." : "Confirm Order"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost">
            <div className="flex items-center justify-between mb-10 border-b border-border-ghost pb-8">
               <h3 className="heading-md flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                     <Truck className="w-6 h-6" />
                  </div>
                  Items to Buy
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
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-surface-low/30 rounded-[2rem] border border-border-ghost group">
                  <div className="md:col-span-12 lg:col-span-6 relative">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block ml-1">Item Details</label>
                    <SearchableSelect 
                      items={items.filter(i => 
                        !lineItems.some((li, liIndex) => liIndex !== index && li.itemId === i.id)
                      )}
                      value={item.itemId}
                      onChange={(val) => updateLineItem(index, "itemId", val)}
                      placeholder="Select Item from List"
                    />
                    
                    {item.itemId && (() => {
                      const selectedItem = items.find(i => i.id === item.itemId);
                      const stock = selectedItem?.inventory?.quantityAvailable || 0;
                      const isLow = stock < (selectedItem?.minStockLevel || 0);
                      
                      return (
                        <div className={cn(
                          "mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2",
                          isLow 
                            ? "bg-error/5 border-error/20 text-error" 
                            : "bg-success/5 border-success/20 text-success"
                        )}>
                          <div className={cn("w-2 h-2 rounded-full", isLow ? "bg-error" : "bg-success")} />
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums">
                              {isLow ? "Low Stock Alert" : "Stable Stock"}: {stock.toLocaleString()} U Available
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                  setBreakdownItem(selectedItem);
                              }}
                              className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center hover:bg-white transition-all border border-transparent hover:border-border-ghost"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="opacity-40 ml-auto tabular-nums">Min: {selectedItem?.minStockLevel || 0}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block ml-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantityOrdered}
                      onChange={(e) => updateLineItem(index, "quantityOrdered", e.target.value)}
                      className="input-field !h-12 !font-mono !text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block ml-1">Unit Cost (₹)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      value={item.costPrice}
                      onChange={(e) => updateLineItem(index, "costPrice", e.target.value)}
                      className="input-field !h-12 !font-mono !text-sm"
                      placeholder="0.00"
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
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] shadow-ambient border border-border-ghost space-y-8">
              <div className="flex items-center gap-4 border-b border-border-ghost pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                    <Layers className="w-6 h-6" />
                 </div>
                 <h3 className="heading-md">Order Details</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                   <div className="flex items-center gap-2 mb-3 ml-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Vendor Source</label>
                   </div>
                   <SearchableSelect 
                     items={vendors}
                     value={selectedVendor}
                     onChange={(val) => setSelectedVendor(val)}
                     placeholder="Select Vendor"
                   />
                </div>

                <div>
                   <div className="flex items-center gap-2 mb-3 ml-1">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payment Method</label>
                   </div>
                   <SearchableSelect 
                     items={[...PAYMENT_MODE_OPTIONS, ...(!PAYMENT_MODE_OPTIONS.includes(paymentMode) ? [paymentMode] : [])].map(m => ({ id: m, name: m }))}
                     value={paymentMode}
                     onChange={(val) => setPaymentMode(val)}
                     placeholder="Select Payment Method"
                   />
                </div>

                <div>
                   <div className="flex items-center gap-2 mb-3 ml-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Order Date</label>
                   </div>
                   <input
                     type="datetime-local"
                     value={orderDate}
                     min={new Date().toISOString().slice(0, 16)}
                     onChange={(e) => setOrderDate(e.target.value)}
                     className="input-field !h-12"
                   />
                </div>

                <div>
                   <div className="flex items-center gap-2 mb-3 ml-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Expected Delivery</label>
                   </div>
                   <input
                     type="datetime-local"
                     value={expectedDelivery}
                     min={orderDate || new Date().toISOString().slice(0, 16)}
                     onChange={(e) => setExpectedDelivery(e.target.value)}
                     className="input-field !h-12"
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
                    <span className="text-foreground tabular-nums">{lineItems.reduce((acc, curr) => acc + curr.quantityOrdered, 0)} Units</span>
                 </div>
                 <div className="pt-8 border-t border-border-ghost flex justify-between items-end">
                    <span className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Total Bill</span>
                    <div className="text-right">
                       <span className="text-4xl font-black text-foreground tracking-tighter tabular-nums">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       <p className="text-[9px] font-black text-muted-foreground mt-2 uppercase tracking-widest opacity-60">Excluding GST</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-premium !bg-primary p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <CheckCircle2 className="w-5 h-5 opacity-80" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Procurement</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10 opacity-90">
                Confirming this order will update <strong>Items on the way</strong> values and notify the warehouse dock for incoming assets.
              </p>
           </div>
        </div>
      </div>

      {breakdownItem && (
        <ItemBreakdownModal 
          isOpen={!!breakdownItem}
          onClose={() => setBreakdownItem(null)}
          itemId={breakdownItem.id}
          itemName={breakdownItem.name}
          totalStock={breakdownItem.inventory?.quantityAvailable || 0}
          incomingQty={breakdownItem.inventory?.incomingQty || 0}
          minStockLevel={breakdownItem.minStockLevel || 0}
          unit={breakdownItem.unit}
        />
      )}
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Loading...</p>
      </div>
    }>
      <NewPurchaseOrderForm />
    </Suspense>
  );
}

