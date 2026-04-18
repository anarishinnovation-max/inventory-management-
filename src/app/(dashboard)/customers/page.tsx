import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    Calendar,
    ChevronRight,
    MapPin,
    MoreVertical,
    Phone,
    Users,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { CustomerModal } from "./CustomerModal";
import { CustomerSearch } from "./CustomerSearch";

async function getCustomersWithStats(query?: string) {
  const customers = await prisma.customer.findMany({
    where: query ? {
      name: { contains: query, mode: "insensitive" }
    } : undefined,
    include: {
      transactions: {
        select: {
          id: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return customers.map(c => ({
    id: c.id,
    name: c.name,
    contact: c.contact,
    address: c.address,
    totalTransactions: c.transactions.length,
    lastInteraction: c.transactions[0]?.createdAt || null
  }));
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await getCustomersWithStats(q).catch((e) => {
    console.error("Failed to fetch customers:", e);
    return [];
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
             <span>Home</span>
             <span className="opacity-30">/</span>
             <span className="text-primary">Buyers</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Our Buyers</h1>
          <p className="text-muted-foreground mt-2 font-medium">A list of everyone who buys from us.</p>
        </div>
        <div className="flex items-center gap-3">
            <CustomerSearch />
            <CustomerModal />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <Users className="w-3 h-3 text-primary" />
            Buyers List
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {customers.map(customer => (
              <div key={customer.id} className="p-4 card-premium group hover:border-primary/30 transition-all cursor-pointer bg-white/50">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{customer.name}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest truncate">{customer.contact || "No contact"}</p>
                    </div>
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        {customer.name[0]}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="badge px-2 py-0.5 rounded-md bg-primary/5 text-primary border-primary/10 text-[9px]">
                    {customer.totalTransactions} Orders
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
            {customers.length === 0 && <p className="text-center py-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">No buyers found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
               Buyer Info
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
                      <th className="table-cell-header">Buyer</th>
                      <th className="table-cell-header">Phone/Email</th>
                      <th className="table-cell-header">Address</th>
                      <th className="table-cell-header">Last Order</th>
                      <th className="table-cell-header">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {customers.length > 0 ? customers.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-low/30 transition-all group cursor-pointer border-b border-border-ghost last:border-0">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-primary/20 text-xs">
                               {c.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[9px] font-black text-muted-foreground mt-0.5 uppercase tracking-widest">IDX-{c.id.slice(0, 4).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-bold text-foreground">
                            {c.contact || "—"}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-start gap-2 text-muted-foreground group-hover:text-foreground transition-colors max-w-[200px]">
                             <MapPin className="w-3 h-3 mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                             <span className="text-xs font-medium line-clamp-1">{c.address || "No address yet"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-foreground">{c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : 'Inactive'}</span>
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Last visit</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={cn(
                             "badge rounded-lg gap-1.5 border-none",
                             c.totalTransactions > 10 ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                          )}>
                             <div className="w-1.5 h-1.5 rounded-full bg-current" />
                             {c.totalTransactions > 10 ? 'Big Buyer' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                         <td colSpan={5} className="px-8 py-40 text-center text-muted-foreground font-medium">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <Users className="w-16 h-16" />
                                <p className="text-2xl font-black text-foreground">No buyers found.</p>
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
                    <Users className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter">{customers.length}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total Buyers</p>
                 </div>
              </div>
              <div className="card-premium flex items-center gap-5 group border-success/5">
                 <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter">
                        {customers.filter(c => c.totalTransactions > 0).length}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Regular Buyers</p>
                 </div>
              </div>
              <div className="card-premium bg-error/[0.02] border-error/5 flex items-center gap-5 group">
                 <div className="w-12 h-12 rounded-xl bg-error text-white flex items-center justify-center transition-transform group-hover:rotate-12 shadow-lg shadow-error/10">
                    <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-3xl font-black text-error tracking-tighter">
                        {customers.filter(c => {
                            const last = c.lastInteraction ? new Date(c.lastInteraction) : null;
                            if (!last) return false;
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return last < thirtyDaysAgo;
                        }).length}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-error/60 mt-1">Not visited recently</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
