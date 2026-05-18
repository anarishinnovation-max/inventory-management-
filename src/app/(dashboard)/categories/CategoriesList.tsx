"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchInput from "@/components/SearchInput";
import { useConfirm } from "@/hooks/use-confirm";
import { showToast } from "@/lib/toast";
import {
  Download,
  Edit,
  FolderOpen,
  FolderPlus,
  Loader2,
  MoreVertical,
  Plus,
  Printer,
  Tag,
  Trash2,
  TrendingUp,
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CategoryItem {
  id: string;
  name: string;
  itemsCount: number;
}

interface CategoriesListProps {
  initialCategories: CategoryItem[];
  metrics: {
    totalCategories: number;
    activeCategories: number;
    emptyCategories: number;
    topCategoryName: string;
    topCategoryCount: number;
  };
  session: {
    role: string;
    companyId: string;
  };
}

export default function CategoriesList({
  initialCategories,
  metrics: initialMetrics,
  session,
}: CategoriesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const confirm = useConfirm();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  // Add Category Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        });

        if (res.ok) {
          const newCat = await res.json();
          const updatedCats = [...categories, { id: newCat.id, name: newCat.name, itemsCount: 0 }].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setCategories(updatedCats);
          
          // Re-calculate local metrics
          setMetrics({
            ...metrics,
            totalCategories: updatedCats.length,
            emptyCategories: metrics.emptyCategories + 1,
          });

          showToast(`Category "${newName.trim()}" created successfully`, "success");
          setNewName("");
          setIsAddOpen(false);
          router.refresh();
        } else {
          const data = await res.json();
          showToast(data.error || "Failed to create category", "error");
        }
      } catch (error) {
        showToast("Network error. Please try again.", "error");
      }
    });
  };

  // Delete Category Handler
  const handleDelete = async (id: string, name: string, itemsCount: number) => {
    if (session.role !== "OWNER" && session.role !== "MANAGER") {
      showToast("Access denied. Owners and Managers only.", "error");
      return;
    }

    let msg = `Are you sure you want to delete category "${name}"?`;
    if (itemsCount > 0) {
      msg = `CRITICAL WARNING: The category "${name}" contains ${itemsCount} active products. Deleting it will leave these products uncategorized or may cause issues. Are you sure you want to proceed?`;
    }

    const ok = await confirm(
      "Confirm Deletion",
      msg,
      itemsCount > 0 ? "error" : "primary"
    );

    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const updatedCats = categories.filter((c) => c.id !== id);
        setCategories(updatedCats);

        // Recalculate metrics
        const total = updatedCats.length;
        const active = updatedCats.filter((c) => c.itemsCount > 0).length;
        const empty = updatedCats.filter((c) => c.itemsCount === 0).length;
        
        let topName = "None";
        let topCount = 0;
        if (updatedCats.length > 0) {
          const sorted = [...updatedCats].sort((a, b) => b.itemsCount - a.itemsCount);
          if (sorted[0] && sorted[0].itemsCount > 0) {
            topName = sorted[0].name;
            topCount = sorted[0].itemsCount;
          }
        }

        setMetrics({
          totalCategories: total,
          activeCategories: active,
          emptyCategories: empty,
          topCategoryName: topName,
          topCategoryCount: topCount,
        });

        showToast(`Category "${name}" deleted successfully`, "success");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete category", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Inventory Room</span>
          </nav>
          <h2 className="heading-xl tracking-tight">Categories</h2>
          <p className="text-muted-foreground mt-2 font-medium">Manage product groups and classifications.</p>
        </div>
        
        <div className="flex gap-3">
          {(session.role === "OWNER" || session.role === "MANAGER") && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn btn-primary h-14 px-8 shadow-glow-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Categories */}
        <div className="card-premium group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-black tracking-widest text-muted-foreground">Total Categories</span>
            <FolderOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-foreground">{metrics.totalCategories}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-bold uppercase tracking-widest leading-none">Defined inside system</p>
        </div>

        {/* Active Categories */}
        <div className="card-premium group border-success/15 bg-success/[0.01]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-black tracking-widest text-success">Active Groups</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-success">{metrics.activeCategories}</span>
          </div>
          <p className="text-xs text-success/70 mt-4 font-bold uppercase tracking-widest leading-none">Contains active items</p>
        </div>

        {/* Empty Categories */}
        <div className="card-premium group border-warning/15 bg-warning/[0.01]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-black tracking-widest text-warning">Empty Groups</span>
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-warning">{metrics.emptyCategories}</span>
          </div>
          <p className="text-xs text-warning/70 mt-4 font-bold uppercase tracking-widest leading-none">No active items linked</p>
        </div>

        {/* Top Category */}
        <div className="card-premium group border-primary/15 bg-primary/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-black tracking-widest text-primary">Largest Group</span>
            <span className="badge bg-primary text-white text-[10px] border-none shadow-glow py-0 px-2 h-5 font-black uppercase">LEADER</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-black truncate max-w-[200px] text-foreground" title={metrics.topCategoryName}>
              {metrics.topCategoryName}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {metrics.topCategoryCount} Items Linked
            </span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex-1 max-w-2xl">
        <SearchInput
          defaultValue={query}
          placeholder="Search Category Name..."
        />
      </div>

      {/* Categories Table/List Grid */}
      <div className="card-premium !p-0 overflow-hidden">
        {/* Table Control Header */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-black text-foreground uppercase tracking-wider">Classification List</span>
          </div>
          <div className="flex gap-1">
            <button className="p-2 hover:bg-white rounded-lg transition-all text-muted-foreground border border-transparent hover:border-border-ghost"><Download className="w-3.5 h-3.5" /></button>
            <button className="p-2 hover:bg-white rounded-lg transition-all text-muted-foreground border border-transparent hover:border-border-ghost"><Printer className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Category Name</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Items count</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const isActive = cat.itemsCount > 0;
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface-low/40 transition-all group cursor-pointer border-b border-border-ghost last:border-0"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground group-hover:text-primary transition-all">
                              {cat.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                              ID: {cat.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {isActive ? (
                          <span className="bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg text-xs font-black text-success uppercase tracking-widest">
                            Active
                          </span>
                        ) : (
                          <span className="bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg text-xs font-black text-warning uppercase tracking-widest">
                            Empty
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-black text-foreground tabular-nums">
                            {cat.itemsCount}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Linked Products
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {(session.role === "OWNER" || session.role === "MANAGER") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(cat.id, cat.name, cat.itemsCount);
                              }}
                              disabled={deletingId === cat.id}
                              className="text-muted-foreground hover:bg-error/10 hover:text-error rounded-xl transition-colors p-2 disabled:opacity-50"
                              title="Delete Category"
                            >
                              {deletingId === cat.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-error" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                    No categories found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Page Indicators */}
        <div className="px-8 py-5 bg-surface-low/30 border-t border-border-ghost flex items-center justify-between">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Showing {filteredCategories.length} Categories
          </span>
        </div>
      </div>

      {/* Floating Add Category Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            onClick={() => !isPending && setIsAddOpen(false)}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm transition-all"
          ></div>
          
          {/* Modal content */}
          <div className="relative w-full max-w-md card-premium bg-white shadow-ambient rounded-3xl p-8 border border-border-ghost z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-foreground">Create Category</h3>
                  <p className="text-xs text-muted-foreground font-medium">Add a new item classification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
                className="p-2 hover:bg-surface-low rounded-xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border-ghost"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Category Name
                </label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Cutting Tools, Carbide Endmills..."
                    disabled={isPending}
                    required
                    autoFocus
                    className="input-field h-12 pl-11 w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isPending}
                  className="btn btn-ghost h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newName.trim()}
                  className="btn btn-primary h-12 px-6 shadow-glow-primary rounded-xl flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
