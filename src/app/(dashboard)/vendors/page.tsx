import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    ChevronRight,
    Clock,
    IndianRupee,
    ShieldCheck,
    Star,
    TrendingDown,
    Truck
} from "lucide-react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { VendorModal } from "./VendorModal";

async function getVendorsWithPricing() {
  const vendors = await (prisma as any).vendor.findMany({
    include: {
      purchaseOrders: {
        include: {
          items: {
            include: {
              item: true
            }
          }
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  // Map to the legacy structure for now to keep UI working
  return vendors.map((v: any) => ({
    ...v,
    items: v.purchaseOrders.flatMap((po: any) => 
      po.items.map((pi: any) => ({
        ...pi,
        price: pi.costPrice, // mapping costPrice to price for legacy UI
        leadTime: "3-7 Days", // Balanced Indian logistics
        isPreferred: false
      }))
    )
  }));
}

export default async function VendorsPage() {
  const vendors = await getVendorsWithPricing().catch(() => []);

  const allCompetitiveItems: any[] = [];
  vendors.forEach((v: any) => {
    v.items.forEach((vi: any) => {
      allCompetitiveItems.push({
        vendorName: v.name,
        itemName: vi.item.name,
        sku: vi.item.sku,
        price: vi.price,
        leadTime: vi.leadTime,
        isPreferred: vi.isPreferred
      });
    });
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
             <span>Main</span>
             <span className="opacity-30">/</span>
             <span className="text-primary">Supply Network</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Vendors & Prices</h1>
          <p className="text-muted-foreground mt-2 font-medium">Coordinate procurement contracts and supplier performance.</p>
        </div>
        <VendorModal />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <Truck className="w-3 h-3 text-primary" />
            Selection
          </h2>
          <div className="space-y-3">
            {vendors.map((vendor: any) => (
              <div key={vendor.id} className="p-4 card-premium group hover:border-primary/30 transition-all cursor-pointer bg-white/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{vendor.name}</p>
                    <p className="text-[9px] font-black text-primary uppercase mt-1 tracking-widest">{vendor.preferredPaymentMode || "Cash"}</p>
                  </div>
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    {vendor.name[0]}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="badge px-2 py-0.5 rounded-md bg-primary/5 text-primary border-primary/10 text-[9px]">
                    {vendor.items.length} SKUs
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-center py-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">No matching vendors.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
               Pricing index
             </h2>
           </div>

           <div className="card-premium !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="table-cell-header">Vendor identity</th>
                      <th className="table-cell-header">Item / SKU code</th>
                      <th className="table-cell-header text-right">Value scope</th>
                      <th className="table-cell-header">Logistics flow</th>
                      <th className="table-cell-header">Contract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {allCompetitiveItems.length > 0 ? allCompetitiveItems.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-low/30 transition-all group border-b border-border-ghost last:border-0">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                               {entry.vendorName[0]}
                            </div>
                            <span className="font-bold text-foreground text-sm leading-tight">{entry.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-bold text-foreground text-sm">{entry.itemName}</p>
                            <p className="text-[9px] font-black text-muted-foreground tracking-widest mt-0.5 uppercase">{entry.sku}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1">
                                <span className="text-[9px] font-black text-muted-foreground opacity-50 uppercase">INR</span>
                                <span className="text-sm font-black text-foreground tracking-tighter">{Number(entry.price).toLocaleString()}</span>
                             </div>
                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Fixed cost</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                             <Clock className="w-3.5 h-3.5 opacity-50" />
                             <span>{entry.leadTime} Days</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {entry.isPreferred ? (
                             <span className="badge rounded-lg gap-1.5 bg-primary/10 text-primary border-none text-[9px]">
                                <Star className="w-3 h-3 fill-current" />
                                Preferred
                             </span>
                          ) : (
                             <span className="badge rounded-lg gap-1.5 bg-surface-low text-muted-foreground border-none text-[9px]">
                                Secondary
                             </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                         <td colSpan={5} className="px-8 py-32 text-center text-muted-foreground font-medium">
                            No vendor contracts found. Link items to vendors to see price comparisons.
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card-premium flex items-start gap-5 group border-primary/5 bg-primary/[0.01]">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 shadow-inner">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Optimized Sourcing</h4>
                     <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">System identifies the lowest variance contracts for maximum margin protection.</p>
                  </div>
               </div>
               <div className="card-premium flex items-start gap-5 group border-success/5 bg-success/[0.01]">
                  <div className="p-3 rounded-xl bg-success/10 text-success transition-transform group-hover:scale-110 shadow-inner">
                     <Clock className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Agile Fulfillment</h4>
                     <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Lead-time analysis ensures just-in-time inventory cycles for critical asset classes.</p>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
