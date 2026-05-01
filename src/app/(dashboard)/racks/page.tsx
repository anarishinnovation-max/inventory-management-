export const dynamic = 'force-dynamic';

import SearchInput from "@/components/SearchInput";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Filter,
  MapPin,
  MoreVertical,
  Printer,
  TrendingUp
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import AddRackButton from "./AddRackButton";
import { cacheQuery } from "@/lib/cache";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getRacksRaw(query?: string, companyId?: string) {
  if (!companyId) return [];
  const where: any = { companyId };

  if (query) {
    where.AND = [
      {
        OR: [
          { rackNumber: { contains: query, mode: 'insensitive' } },
          { zone: { contains: query, mode: 'insensitive' } },
          { stocks: { some: { item: { name: { contains: query, mode: 'insensitive' } } } } },
          { stocks: { some: { item: { sku: { contains: query, mode: 'insensitive' } } } } },
        ]
      }
    ];
  }

  const racks = await (prisma as any).rack.findMany({
    where,
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

const getRacks = (query?: string, companyId?: string) =>
  cacheQuery(
    () => getRacksRaw(query, companyId),
    ["racks", query || "none", companyId || "none"],
    60
  )();

export default async function RacksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';

  const racks = await getRacks(q, session.companyId).catch((e: any) => {
    console.error("Failed to fetch racks:", e);
    return [];
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Inventory Room</span>
          </nav>
          <h2 className="heading-xl tracking-tight">Rack List</h2>
          <p className="text-muted-foreground mt-2 font-medium">See where all your items are stored.</p>
        </div>
        <div className="flex gap-3">
          {(session.role === 'OWNER' || session.role === 'MANAGER') && <AddRackButton />}
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Rack Status</span>
            <TrendingUp className="w-3 h-3 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-foreground">Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest leading-none">Ready for operations.</p>
        </div>

        <div className="card-premium group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Total Racks</span>
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground">{racks.length}</span>
          <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Racks in use</p>
        </div>

        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Empty Spots</span>
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
          </div>
          <span className="text-3xl font-black tracking-tighter text-foreground">12</span>
          <p className="text-[10px] text-warning/70 mt-4 font-bold uppercase tracking-widest leading-none">Space available for use.</p>
        </div>

        <div className="card-premium group border-primary/10 bg-primary/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary">Storage Rating</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tracking-tighter text-primary">A++</span>
            <div className="badge bg-primary text-white text-[9px] border-none shadow-glow py-0 px-2 h-5">GOOD</div>
          </div>
          <p className="text-[10px] text-primary/60 mt-4 font-bold uppercase tracking-widest leading-none">Everything in the right place.</p>
        </div>
      </div>

      <div className="flex-1 max-w-2xl">
        <SearchInput
          defaultValue={q}
          placeholder="Search Rack Number, Zone or Item..."
        />
      </div>

      {/* Control Strip */}
      <div className="card-premium !p-0 overflow-hidden">
        <div className="px-8 py-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-black text-foreground uppercase tracking-wider">Rack Items</span>
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
                <th className="table-cell-header">Rack Number</th>
                <th className="table-cell-header">Area</th>
                <th className="table-cell-header">Items in Rack</th>
                <th className="table-cell-header text-right">Items Count</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {racks.length > 0 ? racks.map((row: any) => {
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
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Main Spot</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-surface-low border border-border-ghost px-3 py-1.5 rounded-lg text-[10px] font-black text-foreground uppercase tracking-widest">
                        {row.zone || "Main Hall"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-muted-foreground font-medium truncate max-w-[250px]" title={itemList}>
                        {itemList}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-black text-foreground tabular-nums">{totalQty}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Units</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"><Edit className="w-4 h-4" /></button>
                        <button className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                    No racks found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 bg-surface-low/30 border-t border-border-ghost flex items-center justify-between">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Showing {racks.length} Racks</span>
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
