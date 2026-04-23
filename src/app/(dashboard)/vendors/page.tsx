export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    ChevronRight,
    Clock,
    IndianRupee,
    ShieldCheck,
    Star,
    Truck,
    MapPin,
    MoreVertical,
    BarChart3,
    Calendar,
    Users
} from "lucide-react";
import { twMerge } from "tailwind-merge";

import { VendorModal } from "./VendorModal";
import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getVendorsWithPricing(query?: string) {
  const where: any = {};
  
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { contactPerson: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { purchaseOrders: { some: { items: { some: { item: { name: { contains: query, mode: 'insensitive' } } } } } } },
      { purchaseOrders: { some: { items: { some: { item: { sku: { contains: query, mode: 'insensitive' } } } } } } },
    ];
  }

  const vendors = await (prisma as any).vendor.findMany({
    where,
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

  return vendors.map((v: any) => ({
    ...v,
    items: v.purchaseOrders.flatMap((po: any) => 
      po.items.map((pi: any) => ({
        ...pi,
        price: pi.costPrice,
        leadTime: "3-7 Days",
        isPreferred: false
      }))
    )
  }));
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';

  const vendors = await getVendorsWithPricing(q).catch(() => []);

  const allCompetitiveItems: any[] = [];
  vendors.forEach((v: any) => {
    v.items.forEach((vi: any) => {
      if (!q || 
          v.name.toLowerCase().includes(q.toLowerCase()) || 
          vi.item.name.toLowerCase().includes(q.toLowerCase()) || 
          vi.item.sku.toLowerCase().includes(q.toLowerCase())) {
        allCompetitiveItems.push({
          vendorName: v.name,
          itemName: vi.item.name,
          sku: vi.item.sku,
          price: vi.price,
          leadTime: vi.leadTime,
          isPreferred: vi.isPreferred,
          vendorEmail: v.email,
          vendorAddress: v.address || 'India'
        });
      }
    });
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary">Vendors</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Vendors & Prices</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage your vendors and how much they charge.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-80">
                <SearchInput 
                    defaultValue={q}
                    placeholder="Search Vendor, Item or SKU..."
                />
            </div>
            <VendorModal />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <BarChart3 className="w-3 h-3 text-primary" />
            Vendors List
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {vendors.map((vendor: any) => (
              <div key={vendor.id} className="p-4 card-premium group hover:border-primary/30 transition-all cursor-pointer bg-white/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{vendor.name}</p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest truncate">{vendor.email || vendor.contactPerson || "No contact"}</p>
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
            {vendors.length === 0 && <p className="text-center py-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">No vendors found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
               Price List
             </h2>
             <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-surface-low text-muted-foreground transition-all border border-transparent hover:border-border-ghost">
                    <MoreVertical className="w-4 h-4" />
                </button>
             </div>
           </div>

           <div className="card-premium !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="table-cell-header">Vendor</th>
                      <th className="table-cell-header">Item & SKU</th>
                      <th className="table-cell-header text-right">Price</th>
                      <th className="table-cell-header">Time to Send</th>
                      <th className="table-cell-header">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {allCompetitiveItems.length > 0 ? allCompetitiveItems.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-low/30 transition-all group border-b border-border-ghost last:border-0">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-primary/20 text-xs">
                               {entry.vendorName[0]}
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{entry.vendorName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-muted-foreground opacity-50" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{entry.vendorAddress}</span>
                                </div>
                            </div>
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
                             <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Per piece</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                             <Clock className="w-3.5 h-3.5 opacity-50" />
                             <span>{entry.leadTime}</span>
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
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                Secondary
                             </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                         <td colSpan={5} className="px-8 py-40 text-center text-muted-foreground font-medium">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <BarChart3 className="w-16 h-16" />
                                <p className="text-2xl font-black text-foreground">No prices found matching your search.</p>
                            </div>
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-premium flex items-center gap-5 group border-primary/5">
                 <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <BarChart3 className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter">{vendors.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total Vendors</p>
                 </div>
              </div>
              <div className="card-premium flex items-center gap-5 group border-success/5">
                 <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter">{allCompetitiveItems.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Tracked SKUs</p>
                 </div>
              </div>
              <div className="card-premium flex items-center gap-5 group border-warning/5">
                 <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <Star className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter">
                        {vendors.filter((v: any) => v.preferredPaymentMode === "CREDIT").length}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Credit Partners</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
