"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Tag, Trash2, Loader2, X } from "lucide-react";
import { showToast } from "@/lib/toast";

export function CategoryManager() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        showToast(`Category "${newName.trim()}" created`, "success");
        setNewName("");
        fetchCategories();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create category", "error");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast(`Category "${name}" deleted`, "success");
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to delete category", "error");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Cutting Tools, Fasteners..."
            className="input-field h-12 pl-11 w-full"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="btn btn-primary h-12 px-6 shrink-0"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </form>

      {/* Category list */}
      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center py-10 text-xs font-black text-muted-foreground uppercase tracking-widest">
            No categories yet. Add one above.
          </p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-low border border-border-ghost group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={deletingId === cat.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-all"
              >
                {deletingId === cat.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

