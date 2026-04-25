"use client";

import { useState, useEffect, Suspense } from "react";
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
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StockBreakdownPopup } from "./StockBreakdownPopup";

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
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [selectedVendor, setSelectedVendor] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantityOrdered: 1, costPrice: 0 }
  ]);
  const [breakdownData, setBreakdownData] = useState<{ name: string; total: number; batches: any[] } | null>(null);

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

          // Auto-fill from query params
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
          setError("Failed to load item lists.");
        }
      } catch (err) {
        setError("Network error while getting data.");
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

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!selectedVendor) {
      setError("Please select a vendor source.");
      return;
    }
    if (lineItems.some(i => !i.itemId || i.quantityOrdered <= 0 || i.costPrice <= 0)) {
      setError("Please ensure all line items have a valid quantity and a cost price greater than zero.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const normalizedExpectedDelivery = expectedDelivery
        ? new Date(expectedDelivery).toISOString()
        : null;

      if (expectedDelivery && Number.isNaN(new Date(expectedDelivery).getTime())) {
        setError("Please provide a valid expected delivery date and time.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendor,
          items: lineItems,
          paymentMode,
          expectedDelivery: normalizedExpectedDelivery
        }),
      });

      if (res.ok) {
        router.push("/orders/purchase");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Buying items failed.");
      }
    } catch (err) {
      setError("Internal server link failure.");
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <Link href="/orders/purchase" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Purchase Orders</span>
          </Link>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Buy New Items</h1>
          <p className="text-muted-foreground text-lg font-medium">Set up a new order from vendors.</p>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/orders/purchase" className="px-6 py-3.5 text-sm font-bold text-muted-foreground hover:bg-surface-low rounded-2xl border border-transparent transition-all">
             Cancel
           </Link>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="px-8 py-3.5 text-sm font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
             {loading ? "Saving..." : "Confirm Order"}
           </button>
        </div>
      </div>

      {error && (
        <div className="p-5 mb-8 rounded-[1.5rem] bg-error/10 border border-error/20 text-error font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
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
                    <Truck className="w-5 h-5" />
                 </div>
                 Items to Buy
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
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-surface-low/30 rounded-3xl border border-border-ghost group relative hover:border-primary/20 transition-all">
                  <div className="md:col-span-12 lg:col-span-5 relative">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Item Details</label>
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
                          "mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-top-1",
                          isLow 
                            ? "bg-error/5 border-error/20 text-error" 
                            : "bg-success/5 border-success/20 text-success"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isLow ? "bg-error" : "bg-success")} />
                          <div className="flex items-center gap-2">
                            <span>
                              {isLow ? "Low Stock Alert" : "Stable Stock"}: {stock.toLocaleString()} Units Available
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setBreakdownData({
                                  name: selectedItem.name,
                                  total: stock,
                                  batches: selectedItem.inventory?.batches || []
                                });
                              }}
                              className="p-1 hover:bg-black/5 rounded-md transition-colors"
                              title="View breakdown"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="opacity-40 ml-auto">Min Rqd: {selectedItem?.minStockLevel || 0}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantityOrdered}
                      onChange={(e) => updateLineItem(index, "quantityOrdered", e.target.value)}
                      className="input-field font-mono font-bold text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Unit Cost (₹)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      value={item.costPrice}
                      onChange={(e) => updateLineItem(index, "costPrice", e.target.value)}
                      className="input-field font-mono font-bold text-sm"
                      placeholder="0.00"
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
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Vendor & Summary */}
        {/* Sidebar: Vendor & Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-10">
              <div className="flex items-center gap-4 border-b border-border-ghost pb-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-black text-foreground tracking-tight">Order Details</h3>
              </div>
              
              <div className="space-y-6">
                <div className="group">
                   <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest transition-colors">Vendor Source</label>
                   </div>
                   <SearchableSelect 
                     items={vendors}
                     value={selectedVendor}
                     onChange={(val) => setSelectedVendor(val)}
                     placeholder="Select Vendor"
                   />
                </div>

                <div className="group">
                   <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest transition-colors">Payment Method</label>
                   </div>
                   <SearchableSelect 
                     items={[...PAYMENT_MODE_OPTIONS, ...(!PAYMENT_MODE_OPTIONS.includes(paymentMode) ? [paymentMode] : [])].map(m => ({ id: m, name: m }))}
                     value={paymentMode}
                     onChange={(val) => setPaymentMode(val)}
                     placeholder="Select Payment Method"
                   />
                </div>

                <div className="group">
                   <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest transition-colors">Expected Delivery</label>
                   </div>
                   <input
                     type="datetime-local"
                     value={expectedDelivery}
                     onChange={(e) => setExpectedDelivery(e.target.value)}
                     className="w-full bg-surface-low border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-surface-lowest hover:border-primary/20"
                   />
                </div>
              </div>

              <div className="pt-8 border-t border-border-ghost space-y-5">
                 <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                    <span>Items in Order</span>
                    <span className="text-foreground">{lineItems.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">Total Units</span>
                    <span className="text-[15px] font-black text-foreground">{lineItems.reduce((acc, curr) => acc + curr.quantityOrdered, 0)} Units</span>
                 </div>
                 <div className="pt-8 border-t border-border-ghost">
                    <div className="flex justify-between items-baseline mb-4">
                       <span className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Payable Amount</span>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Cost (Excl. GST)</span>
                          <span className="text-4xl font-black text-foreground tracking-tighter">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="primary-gradient p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <CheckCircle2 className="w-5 h-5 opacity-80" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Order Quality</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10">
                Confirming this order will automatically update <strong>Items on the way</strong> values and notify the warehouse dock for incoming items.
              </p>
           </div>
        </div>
      </div>

      <StockBreakdownPopup 
        isOpen={!!breakdownData}
        onClose={() => setBreakdownData(null)}
        itemName={breakdownData?.name || ""}
        totalStock={breakdownData?.total || 0}
        batches={breakdownData?.batches || []}
      />
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
