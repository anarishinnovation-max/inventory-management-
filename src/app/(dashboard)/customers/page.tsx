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
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
             <span>Main</span>
             <span>/</span>
             <span className="text-primary">Customers</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">View and manage customers</p>
        </div>
        <div className="flex items-center gap-3">
            <CustomerSearch />
            <CustomerModal />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Customers
          </h2>
          <div className="space-y-3 max-h-150 overflow-y-auto no-scrollbar pr-2">
            {customers.map(customer => (
              <div key={customer.id} className="p-5 bg-surface-lowest rounded-2xl border border-border-ghost shadow-ambient hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-bold text-foreground text-lg truncate max-w-30">{customer.name}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-1 tracking-widest">{customer.contact || "No Phone"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center font-black text-primary group-hover:bg-primary/10 transition-colors border border-border-ghost">
                        {customer.name[0]}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                    {customer.totalTransactions} Orders
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
            {customers.length === 0 && <p className="text-center py-10 text-muted-foreground italic">No customers found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
               Detailed Accounts Overview
             </h2>
             <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-surface-low text-muted-foreground transition-all">
                    <MoreVertical className="w-5 h-5" />
                </button>
             </div>
           </div>

           <div className="bg-surface-lowest rounded-[2.5rem] shadow-ambient border border-border-ghost overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-low/30 border-b border-border-ghost">
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer Details</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Contact</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Office Address</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Activity</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {customers.length > 0 ? customers.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-low/30 transition-colors group cursor-pointer">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
                               {c.name[0]}
                            </div>
                            <div>
                                <p className="font-black text-foreground text-lg leading-tight group-hover:text-primary transition-colors">{c.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">ID: {c.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-foreground font-black text-sm">
                              <Phone className="w-4 h-4 text-primary opacity-60" />
                              <span>{c.contact || "N/A"}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-start gap-2 text-muted-foreground max-w-50">
                             <MapPin className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
                             <span className="text-sm font-medium line-clamp-2">{c.address || "No address provided"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <Calendar className="w-3 h-3" />
                                <span>Pulse Check</span>
                             </div>
                             <p className="text-sm font-black text-foreground">
                                {c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : 'No activity'}
                             </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                             "text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest",
                             c.totalTransactions > 10 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          )}>
                             {c.totalTransactions > 10 ? 'VIP / Key Entity' : 'Standard'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                         <td colSpan={5} className="px-8 py-40 text-center text-muted-foreground font-medium">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <Users className="w-16 h-16" />
                                <p className="text-2xl font-black text-foreground">No records indexed.</p>
                            </div>
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-4xl bg-surface-lowest border border-border-ghost shadow-ambient space-y-5 group hover:border-primary/30 transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                    <Users className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-4xl font-black text-foreground tracking-tighter">{customers.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Active Accounts Indexed</p>
                 </div>
              </div>
              <div className="p-8 rounded-4xl bg-surface-lowest border border-border-ghost shadow-ambient space-y-5 group hover:border-primary/30 transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110 border border-emerald-100">
                    <Calendar className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-4xl font-black text-foreground tracking-tighter">
                        {customers.filter(c => c.totalTransactions > 0).length}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Accounts with Pulse</p>
                 </div>
              </div>
              <div className="p-8 rounded-4xl bg-orange-50 border border-orange-100 shadow-ambient space-y-5 group hover:scale-[1.02] transition-all">
                 <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-orange-200">
                    <Calendar className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-4xl font-black text-orange-900 tracking-tighter">
                        {customers.filter(c => {
                            const last = c.lastInteraction ? new Date(c.lastInteraction) : null;
                            if (!last) return false;
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return last < thirtyDaysAgo;
                        }).length}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-700 mt-2">Dormant / Needs Outreach</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
