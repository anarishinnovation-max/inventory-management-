"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Save,
  SquareStack,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";

interface Stock {
  id: string;
  quantity: number;
  rackId: string;
  rackNumber: string;
}

interface Rack {
  id: string;
  rackNumber: string;
}

export default function InventoryStockManager({ itemId }: { itemId: string }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [allRacks, setAllRacks] = useState<Rack[]>([]);
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRackId, setNewRackId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, rackRes] = await Promise.all([
        fetch(`/api/items/${itemId}`),
        fetch("/api/racks")
      ]);

      if (stockRes.ok && rackRes.ok) {
        const item = await stockRes.json();
        const racks = await rackRes.json();
        setStocks(item.stocks);
        setAllRacks(racks);
      }
    } catch (_err) {
      setError("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStock = async (rackId: string, quantity: number, currentStockId?: string) => {
    setUpdatingId(currentStockId || "new");
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/items/${itemId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rackId, quantity, remarks: "Manual adjustment via Item Edit" }),
      });

      if (res.ok) {
        setMessage("Stock updated");
        setShowAddForm(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Update failed");
      }
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-lowest p-8 rounded-4xl border border-border-ghost flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-lowest p-8 rounded-4xl shadow-ambient border border-border-ghost space-y-8">
      <div className="flex items-center justify-between border-b border-border-ghost pb-4">
        <h3 className="text-xl font-black flex items-center gap-3 text-foreground">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
             <MapPin className="w-5 h-5" />
          </div>
          Where Items Are
        </h3>
        <button 
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-low hover:bg-surface-high rounded-xl text-xs font-black transition-colors border border-border-ghost text-foreground"
        >
          {showAddForm ? "Cancel" : <><Plus className="w-4 h-4" /> Add New Spot</>}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Add New Location Form */}
        {showAddForm && (
          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Rack Number</label>
                   <select 
                      value={newRackId}
                      onChange={(e) => setNewRackId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-border-ghost rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                   >
                      <option value="">Choose Rack...</option>
                      {allRacks
                        .filter(r => !stocks.some(s => s.rackId === r.id))
                        .map(r => (
                          <option key={r.id} value={r.id}>Rack {r.rackNumber}</option>
                        ))}
                   </select>
                </div>
             </div>
             <button 
                type="button"
                disabled={!newRackId || updatingId === "new"}
                onClick={() => handleUpdateStock(newRackId, 0)}
                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20   transition-all disabled:opacity-50 flex items-center justify-center gap-2"
             >
                {updatingId === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Finish Adding
             </button>
          </div>
        )}

        {/* Existing Stock List */}
        {stocks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {stocks.map((stock) => (
              <div key={stock.id} className="p-5 bg-surface-low rounded-2xl border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="w-12 h-12 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-primary shadow-sm">
                      <span className="text-xs font-black text-foreground">{stock.rackNumber}</span>
                   </div>
                   <div>
                      <p className="text-sm font-black text-foreground">Rack {stock.rackNumber}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Rack Spot</p>
                   </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                   <div className="h-8 w-px bg-border-ghost hidden md:block"></div>
                   <button 
                      type="button"
                      title="Remove from this rack"
                      onClick={async () => {
                        if (await confirm("Remove from Rack", "Are you sure you want to remove this item from this rack? This will NOT delete the actual stock, just the location mapping.")) {
                           handleUpdateStock(stock.rackId, 0, stock.id);
                        }
                      }}
                      className="p-2.5 hover:bg-error/10 text-muted-foreground hover:text-error rounded-xl transition-all"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : !showAddForm && (
          <div className="p-12 border-2 border-dashed border-border-ghost rounded-4xl flex flex-col items-center text-center">
             <div className="w-16 h-16 rounded-full bg-surface-low flex items-center justify-center text-muted-foreground mb-4">
                <SquareStack className="w-8 h-8 opacity-20" />
             </div>
             <p className="font-black text-foreground">No Rack spots yet.</p>
             <p className="text-sm font-medium text-muted-foreground mt-1 max-w-xs">Add this item to a Rack to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}

