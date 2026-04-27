"use client";

import { clsx, type ClassValue } from "clsx";
import {
  ArrowLeft,
  Loader2,
  Package,
  QrCode,
  Settings,
  ShieldCheck,
  TrendingUp,
  ChevronDown
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NewItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [racks, setRacks] = useState<{id: string, rackNumber: string}[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [unit, setUnit] = useState("Pieces");
  const [selectedRackId, setSelectedRackId] = useState("");
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catRes, rackRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/racks?minimal=true")
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
          if (catData.length > 0) setSelectedCategoryId(catData[0].id);
        }

        if (rackRes.ok) {
          const rackData = await rackRes.json();
          setRacks(rackData);
        }
      } catch (err) {
        console.error("Failed to load form data", err);
      } finally {
        setFetchingCategories(false);
      }
    }
    loadInitialData();
  }, []);

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
      rackId: formData.get("rackId"),
    };

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/inventory");
        router.refresh();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Could not add item");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <Link href="/inventory" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stock</span>
          </Link>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Add New Item</h2>
          <p className="text-muted-foreground font-medium">Fill in the form to add a new item.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-surface-low transition-colors rounded-xl border border-transparent hover:border-border-ghost">
            Discard
          </Link>
          <button type="submit" disabled={loading || fetchingCategories} className="px-8 py-3 text-sm font-black text-white bg-linear-to-r from-primary to-indigo-600 rounded-xl shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Item
          </button>
        </div>
      </div>

      {error && (
         <div className="p-4 mb-6 rounded-2xl bg-error/10 border border-error/20 text-error font-bold flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {error}
         </div>
      )}

      {/* Bento Grid Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Primary Information */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-foreground border-b border-border-ghost pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Package className="w-5 h-5" />
              </div>
              Item Info
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Item Name</label>
                <input required name="name" className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-[15px] font-bold placeholder:text-muted-foreground/50 text-foreground" placeholder="e.g. Motor, Bolt, Wire" type="text" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">SKU</label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input required name="sku" className="w-full pl-12 pr-4 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-[15px] font-bold font-mono text-foreground placeholder:text-muted-foreground/50" placeholder="LXT-9982-A" type="text" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Unit</label>
                  <SearchableSelect 
                    items={[
                      { id: "Pieces", name: "Piece (pcs)" },
                      { id: "Kilograms", name: "Kilogram (kg)" },
                      { id: "Boxes", name: "Box (box)" }
                    ]}
                    value={unit}
                    onChange={(val) => setUnit(val)}
                    placeholder="Select Unit"
                  />
                  <input type="hidden" name="unit" value={unit} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                   {fetchingCategories ? (
                       <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold px-4 py-2">
                           <Loader2 className="w-4 h-4 animate-spin" /> Fetching categories...
                       </div>
                   ) : categories.map(cat => (
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
                   <button type="button" className="px-5 py-2.5 rounded-xl bg-surface-low text-muted-foreground text-xs font-black flex items-center gap-2 hover:bg-surface-high transition-colors">
                    <span>+</span> New
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Operational Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3 text-foreground border-b border-border-ghost pb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                 <Settings className="w-5 h-5" />
              </div>
              Rules
            </h3>
            
            {/* Stock Parameters */}
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Low Stock Warning</label>
                  <span className="text-[10px] font-black text-error bg-error/10 px-2 py-1 rounded-md uppercase tracking-wider">Warning level</span>
                </div>
                <div className="relative">
                  <input required name="minStockLevel" className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-xl focus:ring-2 focus:ring-primary outline-none text-xl font-black font-mono text-right text-foreground" type="number" defaultValue="25" min="0" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 font-bold">We will tell you when items go below this level.</p>
              </div>

              {/* Toggle Component */}
              <div className="flex items-center justify-between p-5 bg-surface-low rounded-2xl border border-border-ghost">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black text-foreground">Critical Item</p>
                    <span className="px-2 py-0.5 rounded-full border border-success/50 text-[10px] font-black text-success uppercase tracking-wider">New</span>
                  </div>
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

              {/* Location Selector (Visual Only) */}
              <div className="pt-4 border-t border-border-ghost">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Main Spot in Rack</label>
                <div className="space-y-2">
                  <SearchableSelect 
                    items={racks.map(r => ({ id: r.id, name: `Rack ${r.rackNumber}` }))}
                    value={selectedRackId}
                    onChange={(val) => setSelectedRackId(val)}
                    placeholder="Select Rack Location"
                  />
                  <input type="hidden" name="rackId" value={selectedRackId} />
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Bottom Sticky Footer */}
      <div className="mt-12 flex flex-col md:flex-row items-center justify-between p-6 bg-surface-lowest rounded-2xl border border-border-ghost shadow-ambient gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/10 text-success rounded-xl">
             <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[15px] font-black text-foreground">Ready to Register</p>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">Please fill all boxes. SKU must be new.</p>
          </div>
        </div>
      </div>

    </form>
  );
}
