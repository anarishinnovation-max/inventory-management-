import { 
  Filter, 
  Download, 
  Printer,
  Edit,
  MoreVertical,
  TrendingUp,
  SquareStack,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import pool from "@/lib/db";

async function getRacks() {
  const query = `
    SELECT 
      r.id,
      r."rackName",
      r.zone,
      r.shelf,
      r.bin,
      (
        SELECT json_agg(json_build_object('name', i.name, 'quantity', s.quantity))
        FROM "Stock" s
        JOIN "Item" i ON s."itemId" = i.id
        WHERE s."rackId" = r.id AND s.quantity > 0
      ) as items
    FROM "Rack" r
    ORDER BY r."rackName" ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export default async function RacksPage() {
  const racks = await getRacks().catch(() => []);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
            <span>Main</span>
            <span>/</span>
            <span className="text-primary">Architecture</span>
          </nav>
          <h2 className="text-4xl font-black text-foreground tracking-tight mb-1">Rack Management</h2>
          <p className="text-muted-foreground text-sm font-medium">Configure and monitor storage hierarchy across all zones.</p>
        </div>
        <button className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          Add New Rack
        </button>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-lowest p-6 rounded-2xl flex flex-col gap-1 border border-border-ghost shadow-ambient">
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Total Capacity</span>
          <span className="text-3xl font-black tracking-tighter text-primary mt-1">84.2%</span>
          <div className="w-full bg-surface-low h-1.5 rounded-full mt-3 overflow-hidden">
             <div className="bg-primary h-full w-[84%]"></div>
          </div>
        </div>
        
        <div className="bg-surface-lowest p-6 rounded-2xl flex flex-col gap-1 border border-border-ghost shadow-ambient">
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Active Racks</span>
          <span className="text-3xl font-black tracking-tighter text-foreground mt-1">{racks.length}</span>
          <span className="text-[10px] text-success flex items-center gap-1 mt-2 font-black tracking-widest uppercase">
             <TrendingUp className="w-3 h-3" /> +12 this month
          </span>
        </div>
        
        <div className="bg-surface-lowest p-6 rounded-2xl flex flex-col gap-1 border border-border-ghost shadow-ambient">
          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Empty Bins</span>
          <span className="text-3xl font-black tracking-tighter text-foreground mt-1">412</span>
          <span className="text-[10px] text-muted-foreground mt-2 font-black tracking-widest uppercase">Ready for allocation</span>
        </div>
        
        <div className="bg-surface-lowest p-6 rounded-2xl flex flex-col gap-1 border border-error/20 bg-error/5 shadow-ambient">
          <span className="text-[10px] uppercase font-black tracking-widest text-error">Maintenance Required</span>
          <span className="text-3xl font-black tracking-tighter text-error mt-1">03</span>
          <span className="text-[10px] text-error flex items-center gap-1 mt-2 font-black tracking-widest uppercase">Priority Critical</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-lowest rounded-[2rem] overflow-hidden shadow-ambient border border-border-ghost">
        <div className="px-8 py-5 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-black text-foreground">Global Warehouse Zones</span>
            <div className="flex items-center gap-2 bg-surface hover:bg-surface-high transition-colors cursor-pointer px-3 py-1.5 rounded-lg border border-border-ghost text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <Filter className="w-3 h-3" />
                Filter
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-low rounded-xl transition-colors text-muted-foreground"><Download className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-surface-low rounded-xl transition-colors text-muted-foreground"><Printer className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-low/30">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rack Details</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shelf Config</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Storage Criteria</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Capacity Index</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {racks.map((row: any, i: number) => {
                const fillPercent = row.items ? Math.min(row.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0) / 5, 100) : 0; // Mock fill calculation
                const itemList = row.items ? row.items.map((it: any) => it.name).join(", ") : "Empty";
                
                return (
                  <tr key={row.id} className="hover:bg-surface-low/40 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-sm border border-primary/20">
                           {row.rackName}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">Storage Rack {row.rackName}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[200px]" title={itemList}>{itemList}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="bg-surface-low border border-border-ghost px-3 py-1.5 rounded-lg text-[10px] font-black text-foreground uppercase tracking-widest">
                           Shelf {row.shelf}
                        </span>
                        <span className="bg-surface-low border border-border-ghost px-3 py-1.5 rounded-lg text-[10px] font-black text-foreground uppercase tracking-widest">
                           Zone {row.zone}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                         <SquareStack className="w-4 h-4 text-muted-foreground" />
                         Bin {row.bin}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs font-black text-foreground">{Math.round(fillPercent)}%</span>
                        <div className="w-24 bg-surface-low border border-border-ghost h-2 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full transition-all duration-500",
                            fillPercent > 80 ? "bg-error" : fillPercent > 50 ? "bg-primary" : "bg-success"
                          )} style={{ width: `${fillPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"><Edit className="w-4 h-4" /></button>
                         <button className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="px-8 py-5 bg-surface-low/30 border-t border-border-ghost flex items-center justify-between">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Showing {racks.length} of {racks.length} racks</span>
          <div className="flex gap-1.5">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-low text-muted-foreground hover:bg-surface-high transition-colors" disabled>
               <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white text-xs font-black shadow-md">1</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low border border-transparent hover:border-border-ghost text-muted-foreground text-xs font-black transition-colors">2</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-low text-muted-foreground hover:bg-surface-high transition-colors border border-transparent hover:border-border-ghost">
               <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
