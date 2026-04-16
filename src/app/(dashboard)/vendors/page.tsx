import { 
  Truck, 
  TrendingDown, 
  Clock, 
  Star,
  ChevronRight,
  ShieldCheck,
  IndianRupee
} from "lucide-react";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
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
        leadTime: "3-5 Days", // Default
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
          <h1 className="heading-xl">Strategic Sourcing</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage vendor relationships and analyze procurement pricing.</p>
        </div>
        <VendorModal />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Vendor Directory
          </h2>
          <div className="space-y-3">
            {vendors.map((vendor: any) => (
              <div key={vendor.id} className="p-5 bg-surface-lowest rounded-2xl border border-border-ghost shadow-ambient hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground text-lg">{vendor.name}</p>
                    <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">{vendor.preferredPaymentMode || "Cash"}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center font-bold text-primary group-hover:bg-primary/10 transition-colors border border-border-ghost">
                    {vendor.name[0]}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{vendor.items.length} Contracts</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-center py-10 text-muted-foreground italic">No vendors yet.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="heading-lg flex items-center gap-3">
               <TrendingDown className="w-6 h-6 text-success" />
               Pricing Index & Competitive Analysis
             </h2>
           </div>

           <div className="bg-surface-lowest rounded-3xl shadow-ambient border border-border-ghost overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="table-cell-header text-xs">Vendor</th>
                      <th className="table-cell-header text-xs">Item / SKU</th>
                      <th className="table-cell-header text-xs">Price per Unit</th>
                      <th className="table-cell-header text-xs">Lead Time</th>
                      <th className="table-cell-header text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {allCompetitiveItems.length > 0 ? allCompetitiveItems.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-low/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center font-bold text-primary group-hover:bg-primary/10">
                               {entry.vendorName[0]}
                            </div>
                            <span className="font-bold text-foreground">{entry.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-semibold text-foreground">{entry.itemName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{entry.sku}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-1">
                             <IndianRupee className="w-4 h-4 text-success" />
                             <span className="text-lg font-bold text-foreground">{entry.price.toString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                             <Clock className="w-4 h-4" />
                             <span>{entry.leadTime} Days</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {entry.isPreferred ? (
                             <span className="badge-status bg-primary/10 text-primary border-primary/20">
                                <Star className="w-3 h-3 fill-primary mr-1" />
                                Preferred
                             </span>
                          ) : (
                             <span className="badge-status bg-surface-low text-muted-foreground border-border-ghost">
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
              <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-5">
                 <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-blue-900 leading-tight">Cheapest Option</h4>
                    <p className="text-blue-700/80 mt-1 font-medium">Automatically identified for cost optimization.</p>
                 </div>
              </div>
              <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-start gap-5">
                 <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg">
                    <Clock className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-emerald-900 leading-tight">Fastest Delivery</h4>
                    <p className="text-emerald-700/80 mt-1 font-medium">Optimized for just-in-time fulfillment cycles.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
