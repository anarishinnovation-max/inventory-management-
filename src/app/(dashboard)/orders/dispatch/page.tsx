import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    CheckCircle2,
    Clock,
    Plus,
    Download,
    Eye
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { DispatchFilters } from "./DispatchFilters";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDispatchOrders(query?: string, companyId?: string, searchParams?: any) {
  if (!companyId) return [];
  const where: Prisma.DispatchOrderWhereInput = { companyId };
  
  if (query) {
    where.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { customer: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const sParams: any = await searchParams;
  if (sParams.status && sParams.status !== 'all') {
    where.status = sParams.status;
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
  const sParams = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const q = typeof sParams.q === 'string' ? sParams.q : '';
  
  const orders = await getDispatchOrders(q, session.companyId, sParams).catch(() => []);

  // Calculate stats
  const pendingCount = orders.filter((o: any) => o.status === "pending").length;
  const dispatchedCount = orders.filter((o: any) => o.status === "dispatched").length;

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <span>Selling</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Outgoing items</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Selling Bills</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage selling and sending items to customers.</p>
        </div>
        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <Link href="/orders/dispatch/new" className="btn btn-primary h-14 px-8 shadow-glow-primary">
              <Plus className="w-5 h-5" />
              <span>New Sale Order</span>
          </Link>
        )}
      </header>

      {/* Stats row */}
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning border border-warning/10">
                <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-warning uppercase tracking-[0.15em]">Waiting to Send</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{pendingCount}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-success/5 text-success border border-success/10">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-success uppercase tracking-[0.15em]">Items Sent</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{dispatchedCount}</h2>
            </div>
        </div>

        {/* Empty Bento Slots for Balance */}
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient opacity-40 border-dashed">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Growth Track</p>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient opacity-40 border-dashed">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Revenue Flow</p>
        </div>
      </div>

      <DispatchFilters 
        searchQuery={q}
        currentStatus={typeof sParams.status === 'string' ? sParams.status : 'all'}
      />

      <div className="space-y-8">

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-cell-header">Order ID</th>
                  <th className="table-cell-header">Customer Details</th>
                  <th className="table-cell-header">Quantity</th>
                  <th className="table-cell-header">Total Value</th>
                  <th className="table-cell-header">Method</th>
                  <th className="table-cell-header">Status</th>
                  <th className="table-cell-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {orders.length > 0 ? orders.map((order: any) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-low flex items-center justify-center border border-border-ghost text-xs font-black text-muted-foreground group-hover:border-primary/20 transition-all">SO</div>
                            <div className="flex flex-col">
                                <span className="font-mono font-black text-foreground text-sm tracking-tight">#{order.id.split('-')[0].toUpperCase()}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                                    {order.expectedDelivery && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-border-ghost" />
                                            <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                ETA: {new Date(order.expectedDelivery).toLocaleDateString('en-IN')}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="table-cell">
                       <div className="flex flex-col">
                          <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{order.customer.name}</span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mt-0.5">{order.customer.email || "Guest account"}</span>
                       </div>
                    </td>
                    <td className="table-cell">
                       <span className="badge badge-neutral !text-xs !px-2.5 !py-1">{order.items.length} Units</span>
                    </td>
                    <td className="table-cell">
                       <span className="text-sm font-black text-foreground tabular-nums">
                         ₹{order.items.reduce((acc: number, curr: any) => acc + (Number(curr.sellingPrice) * Number(curr.quantity)), 0).toLocaleString('en-IN')}
                       </span>
                    </td>
                    <td className="table-cell">
                       <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{order.paymentMode || "Cash"}</span>
                    </td>
                    <td className="table-cell">
                       <span className={cn(
                         "badge !text-xs !px-3 !py-1",
                         order.status === "pending" ? "badge-warning" : "badge-success"
                       )}>
                          {order.status}
                       </span>
                    </td>
                     <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/orders/dispatch/${order.id}/bill`} 
                            target="_blank"
                            className="btn btn-neutral h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-success/5 hover:text-success transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Bill
                          </Link>
                          <Link href={`/orders/dispatch/${order.id}`} className="btn btn-primary h-10 px-5 text-xs font-black uppercase tracking-widest rounded-xl">
                             <Eye className="w-4 h-4" />
                             View
                          </Link>
                        </div>
                     </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Plus className="w-12 h-12" />
                        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No selling orders found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


