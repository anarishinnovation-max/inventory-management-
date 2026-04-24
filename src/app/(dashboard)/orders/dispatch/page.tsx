import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    CheckCircle2,
    Clock,
    Plus
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDispatchOrders(query?: string, companyId?: string) {
  if (!companyId) return [];
  const where: Prisma.DispatchOrderWhereInput = { companyId };
  
  if (query) {
    where.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { customer: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const orders = await prisma.dispatchOrder.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return orders;
}

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  
  const orders = await getDispatchOrders(q, session.companyId).catch(() => []);

  // Calculate stats
  const pendingCount = orders.filter((o: any) => o.status === "pending").length;
  const dispatchedCount = orders.filter((o: any) => o.status === "dispatched").length;

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Selling</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Outgoing items</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Selling Bills</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage selling and sending items to customers.</p>
        </div>
        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <Link href="/orders/dispatch/new" className="btn-primary shadow-glow w-full md:w-auto h-14">
              <Plus className="w-4 h-4" />
              <span>New Sale Order</span>
          </Link>
        )}
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
           <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-warning/10 text-warning transition-transform group-hover:scale-110">
                 <Clock className="w-5 h-5" />
              </div>
           </div>
           <div className="mt-8">
              <h2 className="text-3xl font-black text-foreground tracking-tighter">{pendingCount}</h2>
              <p className="text-[9px] font-black text-warning uppercase tracking-widest mt-1">Waiting to Send</p>
           </div>
        </div>

        <div className="card-premium group border-emerald-500/5 bg-emerald-500/[0.01]">
           <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
           </div>
           <div className="mt-8">
              <h2 className="text-3xl font-black text-foreground tracking-tighter">{dispatchedCount}</h2>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Items Sent</p>
           </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl">
          <SearchInput 
              defaultValue={q}
              placeholder="Search Customer or Order ID..."
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-3 space-y-6">
      <div className="card-premium !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Order ID</th>
                <th className="table-cell-header">Customer Details</th>
                <th className="table-cell-header">Items</th>
                <th className="table-cell-header">Paid By</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {orders.length > 0 ? orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-surface-low/30 transition-all group cursor-pointer border-b border-border-ghost last:border-0">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 shrink-0 rounded-lg bg-surface-low flex items-center justify-center border border-border-ghost text-[10px] font-black text-muted-foreground">SO</div>
                                <div className="flex flex-col">
                                    <span className="font-mono font-black text-foreground text-sm tracking-tight">#{order.id.split('-')[0].toUpperCase()}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        {order.expectedDelivery && (
                                            <>
                                                <div className="w-1 h-1 rounded-full bg-border-ghost" />
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    ETA: {new Date(order.expectedDelivery).toLocaleDateString()}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{order.customer.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{order.customer.email || "Guest account"}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-[10px] font-black text-foreground bg-surface-low px-2 py-1 rounded-md border border-border-ghost">{order.items.length} units</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-xs font-bold text-muted-foreground">{order.paymentMode || "Cash"}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className={cn(
                             "badge border-none rounded-lg",
                             order.status === "pending" ? "bg-warning/10 text-warning" : "bg-emerald-500/10 text-emerald-500"
                           )}>
                              {order.status}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <Link href={`/orders/dispatch/${order.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-low text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm border border-transparent hover:border-primary">
                              View & Send
                           </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-32 text-center text-muted-foreground font-medium italic">
                           No selling orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
