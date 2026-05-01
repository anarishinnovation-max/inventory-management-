"use client";

import InventoryStockManager from "@/app/(dashboard)/inventory/InventoryStockManager";
import { clsx, type ClassValue } from "clsx";
import {
  AlertCircle,
  Loader2,
  Package,
  QrCode,
  Settings,
  ShieldCheck
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

  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes, catRes, sessionRes] = await Promise.all([
          fetch(`/api/items/${id}`),
          fetch("/api/categories"),
          fetch("/api/auth/session")
        ]);

        if (itemRes.ok && catRes.ok) {
          const item = await itemRes.json();
          const cats = await catRes.json();
          const session = sessionRes.ok ? await sessionRes.json() : null;

          setItemData(item);
          setCategories(cats);
          setSelectedCategoryId(item.categoryId);
          setIsCritical(item.isCritical);
          setUserRole(session?.role || "");
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

  const isEmployee = userRole === "EMPLOYEE";

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
        <p className="text-muted-foreground font-black animate-pulse uppercase tracking-widest text-[10px]">Retrieving Item Specification...</p>
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
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-border-ghost pb-10">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <Link href="/inventory" className="hover:text-primary transition-colors">Inventory</Link>
            <div className="w-1 h-1 rounded-full bg-primary/40" />
            <span className="text-primary/80">Refining Record</span>
          </nav>
          <h1 className="heading-xl">Edit Item</h1>
        </div>

        {!isEmployee ? (
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="btn btn-neutral h-12 px-6">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary h-12 px-8">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <Link href="/inventory" className="btn btn-neutral h-12 px-6">
            Back to Inventory
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
            <h3 className="heading-md flex items-center gap-3 border-b border-border-ghost pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                <Package className="w-5 h-5" />
              </div>
              Core Specifications
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Item Name</label>
                {isEmployee ? (
                  <div className="text-xl font-black text-foreground py-1">{itemData?.name}</div>
                ) : (
                  <input required name="name" defaultValue={itemData?.name} className="input-field h-14" placeholder="e.g. Industrial Motor, Copper Wire" type="text" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Unique SKU Identifier</label>
                  {isEmployee ? (
                    <div className="text-lg font-black font-mono text-primary py-1">{itemData?.sku}</div>
                  ) : (
                    <div className="relative">
                      <input required name="sku" defaultValue={itemData?.sku} className="input-field pl-5 h-14 font-mono" placeholder="LXT-9982-A" type="text" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Measurement Unit</label>
                  <div className={cn(
                    "text-lg font-black text-foreground py-1",
                    !isEmployee && "input-field h-14 flex items-center bg-surface-low/30 border-dashed"
                  )}>
                    {itemData?.unit}
                  </div>
                  <input type="hidden" name="unit" value={itemData?.unit} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Operational Category</label>
                <div className="flex flex-wrap gap-2">
                  {isEmployee ? (
                    <div className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/10">
                      {categories.find(cat => cat.id === selectedCategoryId)?.name || "Uncategorized"}
                    </div>
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          selectedCategoryId === cat.id
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border-ghost text-muted-foreground hover:bg-surface-low"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
            <h3 className="heading-md flex items-center gap-3 border-b border-border-ghost pb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                <Settings className="w-5 h-5" />
              </div>
              Reordering Rules
            </h3>

            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buffer Threshold</label>
                  <span className="badge badge-error uppercase">Refill Level</span>
                </div>
                {isEmployee ? (
                  <div className="text-5xl font-black font-mono text-foreground pt-4">{itemData?.minStockLevel}</div>
                ) : (
                  <div className="relative">
                    <input required name="minStockLevel" defaultValue={itemData?.minStockLevel} className="input-field h-20 text-3xl font-black font-mono text-center" type="number" min="0" />
                  </div>
                )}
                {!isEmployee && <p className="text-[10px] text-muted-foreground px-1 font-bold italic leading-relaxed">Automated alerts will be triggered when available stock drops below this specific count.</p>}
              </div>

              <div className="flex items-center justify-between p-6 bg-surface-low/30 rounded-[1.5rem] border border-border-ghost">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground">Critical Status</p>
                    {isCritical && <span className="badge badge-error !px-2 !py-0.5">CRITICAL</span>}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Priority Flagging</p>
                </div>
                {!isEmployee && (
                  <button
                    type="button"
                    onClick={() => setIsCritical(!isCritical)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      isCritical ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                      isCritical ? "right-1" : "left-1"
                    )}></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <InventoryStockManager itemId={id} userRole={userRole} />

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between p-8 bg-surface-low/30 rounded-[2.5rem] border border-border-ghost shadow-ambient gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Real-time Synchronization Active</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Changes propagate across global modules instantly</p>
          </div>
        </div>
        <div className="h-px w-full md:w-px md:h-12 bg-border-ghost" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Last synchronized: {new Date().toLocaleTimeString()}</p>
      </div>
    </form>
  );
}
