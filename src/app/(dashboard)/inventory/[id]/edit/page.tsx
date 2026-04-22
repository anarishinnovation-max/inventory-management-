"use client";

import InventoryStockManager from "@/app/(dashboard)/inventory/InventoryStockManager";
import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  History,
  Loader2,
  Package,
  QrCode,
  Settings,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [itemData, setItemData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes, catRes] = await Promise.all([
            fetch(`/api/items/${id}`),
            fetch("/api/categories")
        ]);

        if (itemRes.ok && catRes.ok) {
          const item = await itemRes.json();
          const cats = await catRes.json();
          
          setItemData(item);
          setCategories(cats);
          setSelectedCategoryId(item.categoryId);
          setIsCritical(item.isCritical);
        } else {
          setError("Failed to fetch necessary data.");
        }
      } catch (_err) {
        setError("An unexpected error occurred while fetching data.");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      categoryId: selectedCategoryId,
      unit: formData.get("unit"),
      minStockLevel: parseFloat(formData.get("minStockLevel") as string),
      isCritical: isCritical,
    };

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/inventory");
        router.refresh();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Could not save changes");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold animate-pulse">Retrieving Item Specification...</p>
      </div>
    );
  }

  if (error && !itemData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center">
        <div className="p-6 rounded-full bg-error/10 text-error">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Record Not Found</h2>
          <p className="text-muted-foreground mt-2 font-medium">{error}</p>
        </div>
        <Link href="/inventory" className="px-6 py-3 bg-surface-low text-foreground font-bold rounded-xl border border-border-ghost hover:bg-surface-high transition-all">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <Link href="/inventory" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </Link>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Edit Item</h2>
          <p className="text-muted-foreground font-medium">Update item details</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-surface-low transition-colors rounded-xl border border-transparent hover:border-border-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="px-8 py-3 text-sm font-black text-white bg-linear-to-r from-primary to-indigo-600 rounded-xl shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
         <div className="p-4 mb-6 rounded-2xl bg-error/10 border border-error/20 text-error font-bold flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-foreground border-b border-border-ghost pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Package className="w-5 h-5" />
              </div>
              Item Details
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Item Name</label>
                <input required name="name" defaultValue={itemData?.name} className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-[15px] font-bold placeholder:text-muted-foreground/50 text-foreground" placeholder="e.g. Motor, Bolt, Wire" type="text" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">SKU / Part Number</label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input required name="sku" defaultValue={itemData?.sku} className="w-full pl-12 pr-4 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-[15px] font-bold font-mono text-foreground placeholder:text-muted-foreground/50" placeholder="LXT-9982-A" type="text" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Unit</label>
                  <select name="unit" defaultValue={itemData?.unit} required className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-[15px] font-bold appearance-none cursor-pointer text-foreground">
                    <option value="Pieces">Pieces (pcs)</option>
                    <option value="Kilograms">Kilograms (kg)</option>
                    <option value="Boxes">Boxes (box)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                   {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                           "px-5 py-2.5 rounded-xl text-xs font-black transition-colors border",
                           selectedCategoryId === cat.id 
                               ? "border-primary bg-primary/10 text-primary" 
                               : "border-border-ghost text-muted-foreground hover:bg-surface-low"
                        )}
                      >
                         {cat.name}
                      </button>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-low/50 p-8 rounded-4xl border-2 border-dashed border-border-ghost flex flex-col items-center justify-center min-h-50 text-center group cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 duration-300 mb-4">
                <Camera className="w-6 h-6 " />
            </div>
            <p className="text-[15px] font-black text-foreground">Update Imagery</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Refresh high-res product photos</p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-foreground border-b border-border-ghost pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                 <Settings className="w-5 h-5" />
              </div>
              Operational Rules
            </h3>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Minimum Stock Level</label>
                  <span className="text-[10px] font-black text-error bg-error/10 px-2 py-1 rounded-md uppercase tracking-wider">Alert Threshold</span>
                </div>
                <div className="relative">
                  <input required name="minStockLevel" defaultValue={itemData?.minStockLevel} className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary outline-none text-xl font-black font-mono text-right pr-16 text-foreground" type="number" min="0" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">PCS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-surface-low rounded-2xl border border-border-ghost">
                <div>
                  <p className="text-[15px] font-black text-foreground">Critical Item</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">Flag for priority replenishment</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsCritical(!isCritical)}
                  className={cn(
                     "w-14 h-7 rounded-full relative transition-colors duration-300",
                     isCritical ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                     "absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300",
                     isCritical ? "right-1" : "left-1"
                  )}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="primary-gradient p-8 rounded-4xl text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="flex items-start justify-between mb-6 relative z-10">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">Optimization Info</span>
            </div>
            <p className="text-[15px] font-medium leading-relaxed relative z-10">
               Stock analytics show that items in this category have increased turnover recently. Consider increasing safety thresholds.
            </p>
          </div>

          {/* Last Purchase Info */}
          {itemData?.inventory?.batches?.[0] && (
            <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-6">
              <h3 className="text-xl font-black flex items-center gap-3 text-foreground border-b border-border-ghost pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                   <History className="w-5 h-5" />
                </div>
                Last Purchase
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vendor</span>
                  <span className="text-sm font-bold text-foreground">{itemData.inventory.batches[0].vendor?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</span>
                  <span className="text-sm font-bold text-foreground">{new Date(itemData.inventory.batches[0].purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cost Per Unit</span>
                  <span className="text-sm font-black font-mono text-primary">₹{itemData.inventory.batches[0].costPerUnit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Units Bought</span>
                  <span className="text-sm font-bold text-foreground">{itemData.inventory.batches[0].quantity} {itemData.unit}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InventoryStockManager itemId={id} />

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between p-6 bg-surface-lowest rounded-2xl border border-border-ghost shadow-ambient gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-xl">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[15px] font-black text-foreground">Integrity Sync Active</p>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">Specifications will be updated across all warehouse modules instantly.</p>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full md:w-auto px-10 py-4 text-[15px] font-black text-white bg-foreground rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2">
           {loading ? "Syncing..." : "Apply Global Changes"}
        </button>
      </div>
    </form>
  );
}
