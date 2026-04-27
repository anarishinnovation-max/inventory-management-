"use client";

import { clsx, type ClassValue } from "clsx";
import {
  ArrowLeft,
  Loader2,
  Package,
  QrCode,
  Settings,
  ShieldCheck,
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
      rackId: selectedRackId,
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
    <div className="p-8 lg:p-12 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <Link href="/inventory" className="flex items-center gap-2 text-primary font-bold text-sm hover:underline w-fit group">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </Link>
          <h1 className="heading-xl">Register New Item</h1>
          <p className="text-muted-foreground text-lg font-medium">Create a new product entry in your catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Form Fields */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
            <div className="flex items-center gap-4 border-b border-border-ghost pb-6 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="heading-md">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Item Name */}
              <div className="md:col-span-2 group">
                <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest mb-3 block ml-1 transition-colors">Item Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Industrial Valve X-500"
                  className="input-field h-14"
                />
              </div>

              {/* SKU */}
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest transition-colors">SKU / Code</label>
                </div>
                <input
                  name="sku"
                  type="text"
                  required
                  placeholder="e.g. IV-500-RED"
                  className="input-field h-14 font-mono"
                />
              </div>

              {/* Category */}
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest transition-colors">Category</label>
                </div>
                <SearchableSelect 
                  items={categories}
                  value={selectedCategoryId}
                  onChange={(val) => setSelectedCategoryId(val)}
                  placeholder="Select Category"
                />
              </div>

              {/* Unit of Measurement */}
              <div className="group">
                <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest mb-3 block ml-1 transition-colors">Unit of Measurement</label>
                <select 
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="input-field h-14"
                >
                  <option value="Pieces">Pieces (pcs)</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Kgs">Kilograms (kg)</option>
                  <option value="Meters">Meters (m)</option>
                  <option value="Liters">Liters (L)</option>
                </select>
              </div>
            </div>
          </div>


        </div>

        {/* Sidebar: Metadata & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-10">
            <div className="flex items-center gap-4 border-b border-border-ghost pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="heading-md">Settings</h3>
            </div>

            <div className="space-y-8">
              {/* Rack Assignment */}
              <div className="group">
                <label className="text-[10px] font-black text-muted-foreground group-focus-within:text-primary uppercase tracking-widest mb-3 block ml-1 transition-colors">Initial Rack Assignment</label>
                <SearchableSelect 
                  items={racks.map(r => ({ id: r.id, name: `Rack ${r.rackNumber}` }))}
                  value={selectedRackId}
                  onChange={(val) => setSelectedRackId(val)}
                  placeholder="Select Rack Location"
                />
              </div>

              {/* Critical Toggle */}
              <div 
                onClick={() => setIsCritical(!isCritical)}
                className={cn(
                  "flex items-center justify-between p-5 rounded-[1.5rem] border cursor-pointer transition-all",
                  isCritical 
                    ? "bg-error/5 border-error/20 text-error" 
                    : "bg-surface-low/50 border-border-ghost text-muted-foreground hover:bg-surface-low"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isCritical ? "bg-error/10" : "bg-muted/10"
                  )}>
                    <ShieldCheck className={cn("w-5 h-5", isCritical ? "text-error" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Mark as Critical</p>
                    <p className="text-[10px] font-medium opacity-60">High priority monitoring</p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-colors p-1",
                  isCritical ? "bg-error" : "bg-muted/20"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    isCritical ? "left-5" : "left-1"
                  )} />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border-ghost space-y-4">
              {error && (
                <p className="text-xs font-black text-error text-center mb-4 uppercase tracking-widest">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-16"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Register Item"}
              </button>
              <Link
                href="/inventory"
                className="btn btn-neutral w-full h-16 text-center flex items-center justify-center"
              >
                Discard Changes
              </Link>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Quick Tip</h4>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Registering an item only creates the catalog entry. To add physical stock, please create a <strong>Purchase Order</strong> or use the <strong>Inward Supply</strong> tool.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
