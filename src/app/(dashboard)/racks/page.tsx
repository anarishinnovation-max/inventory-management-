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
  ChevronRight,
  MapPin
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import prisma from "@/lib/prisma";
import AddRackButton from "./AddRackButton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getRacks() {
  const racks = await (prisma as any).rack.findMany({
    include: {
      stocks: {
        where: {
          quantity: { gt: 0 }
        },
        include: {
          item: true
        }
      }
    },
    orderBy: {
      rackNumber: 'asc'
    }
  });

  return racks.map((r: any) => ({
    id: r.id,
    rackNumber: r.rackNumber,
    zone: r.zone,
    items: (r.stocks || []).map((s: any) => ({
        name: s.item.name,
        quantity: s.quantity
    }))
  }));
}

export default async function RacksPage() {
  const racks = await getRacks().catch((e) => {
    console.error("Failed to fetch racks:", e);
    return [];
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Main</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Warehouse Control</span>
          </nav>
          <h2 className="heading-xl tracking-tight">Rack Topography</h2>
          <p className="text-muted-foreground mt-2 font-medium">Coordinate storage layout and spatial optimization.</p>
        </div>
        <div className="flex gap-3">
            <button className="btn-secondary">
                <MapPin className="w-4 h-4 text-primary" />
                View 3D Map
            </button>
            <AddRackButton />
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Volumetric Fill</span>
            <TrendingUp className="w-3 h-3 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-foreground">72.4%</span>
            <span className="text-[10px] font-bold text-success">+2.1%</span>
          </div>
          <div className="w-full bg-surface-low h-1.5 rounded-full mt-4 overflow-hidden shadow-inner">
             <div className="bg-primary h-full w-[72%] shadow-[0_0_8px_oklch(0.55_0.18_250)]"></div>
          </div>
        </div>
        
        <div className="card-premium group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Provisioned Slots</span>
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground">{racks.length}</span>
          <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Active nodes in Zone A</p>
        </div>
        
        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Cold Spots</span>
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground">12</span>
          <p className="text-[10px] text-warning/70 mt-4 font-bold uppercase tracking-widest leading-none">Unallocated storage</p>
        </div>
        
        <div className="card-premium group border-primary/10 bg-primary/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary">Efficiency Index</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tracking-tighter text-primary">A++</span>
            <div className="badge bg-primary text-white text-[9px] border-none shadow-glow py-0 px-2 h-5">LEAN</div>
          </div>
          <p className="text-[10px] text-primary/60 mt-4 font-bold uppercase tracking-widest leading-none">Optimal Pathing enabled</p>
        </div>
      </div>

      {/* Control Strip */}
      <div className="card-premium !p-0 overflow-hidden">
        <div className="px-8 py-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-black text-foreground uppercase tracking-wider">Spatial Inventory</span>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-border-ghost text-[9px] font-black text-muted-foreground uppercase tracking-widest shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                <Filter className="w-3 h-3 text-primary" />
                Refine View
            </div>
          </div>
          <div className="flex gap-1">
            <button className="p-2 hover:bg-white rounded-lg transition-all text-muted-foreground border border-transparent hover:border-border-ghost"><Download className="w-3.5 h-3.5" /></button>
            <button className="p-2 hover:bg-white rounded-lg transition-all text-muted-foreground border border-transparent hover:border-border-ghost"><Printer className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Location ID</th>
                <th className="table-cell-header">Zone Assignment</th>
                <th className="table-cell-header">Allocated Assets</th>
                <th className="table-cell-header text-right">Fill Factor</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {racks.map((row: any) => {
                const totalQty = row.items ? row.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0) : 0;
                const fillPercent = Math.min(totalQty / 100, 100); 
                const itemList = row.items && row.items.length > 0 ? row.items.map((it: any) => it.name).join(", ") : "Empty";
                
                return (
                  <tr key={row.id} className="hover:bg-surface-low/40 transition-all group cursor-pointer border-b border-border-ghost last:border-0">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xs border border-primary/20 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                           {row.rackNumber}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground group-hover:text-primary transition-all">Rack {row.rackNumber}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Primary Storage</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="bg-surface-low border border-border-ghost px-3 py-1.5 rounded-lg text-[10px] font-black text-foreground uppercase tracking-widest">
                          {row.zone || "Main Hall"}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs text-muted-foreground font-medium truncate max-w-62.5" title={itemList}>
                          {itemList}
                       </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{Math.round(fillPercent)}% Full</span>
                        <div className="w-20 bg-surface-low border border-border-ghost h-1 rounded-full overflow-hidden shadow-inner">
                          <div className={cn(
                            "h-full transition-all duration-700 ease-out shadow-[0_0_8px_currentColor]",
                            fillPercent > 90 ? "bg-error" : fillPercent > 50 ? "bg-primary" : "bg-success"
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
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Showing {racks.length} Rack Locations</span>
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
