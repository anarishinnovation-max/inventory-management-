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

export default function InventoryStockManager({ itemId, userRole }: { itemId: string; userRole?: string }) {
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
    <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost space-y-8">
      <div className="flex items-center justify-between border-b border-border-ghost pb-6">
        <h3 className="heading-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
             <MapPin className="w-5 h-5" />
          </div>
          Storage Locations
        </h3>
        {userRole !== 'EMPLOYEE' && (
          <button 
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-neutral h-10 px-4 text-xs"
          >
            {showAddForm ? "Cancel" : <><Plus className="w-4 h-4" /> Add Spot</>}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-black flex items-center gap-2 uppercase tracking-widest">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-black flex items-center gap-2 uppercase tracking-widest">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Add New Location Form */}
        {showAddForm && (
          <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-6 animate-in fade-in slide-in-from-top-2">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Target Rack</label>
                   <select 
                      value={newRackId}
                      onChange={(e) => setNewRackId(e.target.value)}
                      className="input-field h-14"
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
                className="btn btn-primary w-full h-14"
             >
                {updatingId === "new" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Confirm Rack Assignment
             </button>
          </div>
        )}

        {/* Existing Stock List */}
        {stocks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {stocks.map((stock) => (
              <div key={stock.id} className="p-5 bg-surface-low/30 rounded-[1.5rem] border border-border-ghost flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="w-12 h-12 rounded-xl bg-surface-lowest border border-border-ghost flex items-center justify-center text-primary shadow-sm">
                      <span className="text-xs font-black text-foreground">{stock.rackNumber}</span>
                   </div>
                   <div>
                      <p className="text-sm font-black text-foreground">Rack {stock.rackNumber}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Physical Placement</p>
                   </div>
                </div>

                {userRole !== 'EMPLOYEE' && (
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
                        className="btn btn-ghost h-10 w-10 !p-0 rounded-xl bg-error/5 text-error hover:bg-error/10 border-error/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !showAddForm && (
          <div className="p-16 border-2 border-dashed border-border-ghost rounded-[2.5rem] flex flex-col items-center text-center">
             <div className="w-20 h-20 rounded-full bg-surface-low flex items-center justify-center text-muted-foreground mb-6">
                <SquareStack className="w-10 h-10 opacity-20" />
             </div>
             <p className="text-lg font-black text-foreground">No Locations Assigned</p>
             <p className="text-sm font-medium text-muted-foreground mt-2 max-w-xs leading-relaxed">This item hasn't been assigned to a physical rack yet. Use the button above to add a storage spot.</p>
          </div>
        )}
      </div>
    </div>
  );
}

