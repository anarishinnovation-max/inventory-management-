"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Package, 
  Truck, 
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LineItem {
  itemId: string;
  quantity: number;
  sellingPrice: number;
}

export default function NewDispatchOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { itemId: "", quantity: 1, sellingPrice: 0 }
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cMsg, iMsg] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/inventory") // Need inventory to show available quantity if desired, but items route exists. Let's use items.
        ]);
        
        let fetchedCustomers = [];
        let fetchedItems = [];

        if (cMsg.ok) {
           fetchedCustomers = await cMsg.json();
        } else {
           // If customers fetch fails (maybe no route yet), we will just have empty. 
           // Wait, is there a /api/customers route? Yes, from the audit list.
        }

        if (iMsg.ok) {
           fetchedItems = await iMsg.json();
           // since we hit /api/inventory, we might get the inventory mapped structs. Let's hit /api/items instead.
        }
        
        const cRes = await fetch("/api/customers");
        const iRes = await fetch("/api/items");

        if (cRes.ok && iRes.ok) {
          setCustomers(await cRes.json());
          setItems(await iRes.json());
        } else {
          setError("Failed to initialize order catalogs.");
        }
      } catch (err) {
        setError("Network failure while fetching master data.");
      } finally {
        setFetching(false);
      }
    }
    fetchData();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Please select a customer recipient.");
      return;
    }
    if (lineItems.some(i => !i.itemId || i.quantity <= 0)) {
      setError("Please ensure all line items have valid specifications.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dispatch-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          items: lineItems
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

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Initializing Fulfillment catalogs...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <Link href="/orders/dispatch" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dispatch List</span>
          </Link>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Initiate Fulfillment</h1>
          <p className="text-muted-foreground text-lg font-medium">Configure a new Dispatch Order for a registered customer.</p>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/orders/dispatch" className="px-6 py-3.5 text-sm font-bold text-muted-foreground hover:bg-surface-low rounded-2xl border border-transparent transition-all">
             Abort
           </Link>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="px-8 py-3.5 text-sm font-black text-white bg-foreground rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             {loading ? "Processing..." : "Create Dispatch Order"}
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
                    <Package className="w-5 h-5" />
                 </div>
                 Dispatch Line Items
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
                  <div className="md:col-span-5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Item Specification</label>
                    <select 
                      value={item.itemId}
                      onChange={(e) => updateLineItem(index, "itemId", e.target.value)}
                      className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Item</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                      className="w-full bg-surface-lowest border border-border-ghost rounded-xl px-4 py-3 font-mono font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
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
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Customer & Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
              <h3 className="text-xl font-black text-foreground border-b border-border-ghost pb-4">Dispatch Meta</h3>
              
              <div>
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Recipient Customer</label>
                 <select 
                   value={selectedCustomer}
                   onChange={(e) => setSelectedCustomer(e.target.value)}
                   className="w-full bg-surface-low border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer appearance-none"
                 >
                   <option value="">Select Recipient</option>
                   {customers.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
              </div>

              <div className="pt-6 border-t border-border-ghost space-y-5">
                 <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                    <span>Active Line Items</span>
                    <span className="text-foreground">{lineItems.length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">Total Logistics Volume</span>
                    <span className="text-[15px] font-black text-foreground">{lineItems.reduce((acc, curr) => acc + curr.quantity, 0)} Units</span>
                 </div>
                 <div className="pt-6 border-t border-border-ghost flex justify-between items-baseline">
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Total Billable</span>
                    <div className="text-right">
                       <span className="text-3xl font-black text-foreground tracking-tighter">₹{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Excluding Tax</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <CheckCircle2 className="w-5 h-5 opacity-80" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Fulfillment Flow</p>
              </div>
              <p className="text-sm font-medium leading-relaxed relative z-10">
                Confirming this order will pre-reserve stock in the warehouse. Final deduction happens on physical dispatch confirmation.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
