import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, Truck, User, Calendar, Receipt, Search, AlertCircle, TrendingDown, Clock, Users, ArrowUpRight, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import { SupplyOutwardsFilters } from "./SupplyOutwardsFilters";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = "force-dynamic";

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function getSupplyOutwardsData(companyId: string, q?: string, customerId?: string, itemId?: string, startDate?: string, endDate?: string) {
  const whereTx: any = {
    companyId,
    type: "SALE",
  };

  const whereOrder: any = {
    companyId,
    status: "pending",
  };

  if (customerId && customerId !== 'all') {
    whereTx.customerId = customerId;
    whereOrder.customerId = customerId;
  }

  if (itemId && itemId !== 'all') {
    whereTx.itemId = itemId;
    whereOrder.items = { some: { itemId: itemId } };
  }

  if (startDate || endDate) {
    whereTx.createdAt = {};
    whereOrder.createdAt = {};
    if (startDate) {
      whereTx.createdAt.gte = new Date(startDate);
      whereOrder.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      whereTx.createdAt.lte = new Date(endDate);
      whereOrder.createdAt.lte = new Date(endDate);
    }
  }

  if (q) {
    const qTxFilter = [
      { item: { name: { contains: q, mode: 'insensitive' } } },
      { item: { sku: { contains: q, mode: 'insensitive' } } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { referenceId: { contains: q, mode: 'insensitive' } },
    ];
    whereTx.OR = qTxFilter;

    whereOrder.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { items: { some: { item: { name: { contains: q, mode: 'insensitive' } } } } },
      { items: { some: { item: { sku: { contains: q, mode: 'insensitive' } } } } },
    ];
  }

  const [pendingOrders, transactions] = await Promise.all([
    prisma.dispatchOrder.findMany({
      where: whereOrder,
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
    }),
    prisma.inventoryTransaction.findMany({
      where: whereTx,
      include: {
        item: true,
        customer: true,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })
  ]);

  // Flatten pending items
  const pendingItems = pendingOrders.flatMap(order => 
    order.items.map(item => ({
      ...item,
      customer: order.customer,
      orderId: order.id,
      createdAt: order.createdAt,
      expectedDelivery: order.expectedDelivery
    }))
  );

  return { pendingItems, transactions };
}

export default async function SupplyOutwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  const customerId = typeof sParams.customerId === 'string' ? sParams.customerId : 'all';
  const itemId = typeof sParams.itemId === 'string' ? sParams.itemId : 'all';
  const startDate = typeof sParams.startDate === 'string' ? sParams.startDate : undefined;
  const endDate = typeof sParams.endDate === 'string' ? sParams.endDate : undefined;

  const { pendingItems, transactions } = await getSupplyOutwardsData(session.companyId, q, customerId, itemId, startDate, endDate);

  const [customers, items] = await Promise.all([
    prisma.customer.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true, sku: true }, orderBy: { name: 'asc' } }),
  ]);

  const totalPendingUnits = pendingItems.reduce((acc, item) => acc + item.quantity, 0);
  
  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Inventory</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Supply Outwards</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Supply Outwards</h1>
          <p className="text-muted-foreground mt-2 font-medium">Tracking items booked and dispatched to customers.</p>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium group border-primary/5 bg-primary/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-4 transition-transform group-hover:scale-110">
                <Package className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Booked Items</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingItems.length}</h2>
        </div>

        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-warning/10 text-warning mb-4 transition-transform group-hover:scale-110">
                <Clock className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-warning uppercase tracking-widest">Units to Send</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{totalPendingUnits}</h2>
        </div>

        <div className="card-premium group border-success/5 bg-success/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-success/10 text-success mb-4 transition-transform group-hover:scale-110">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-success uppercase tracking-widest">Recent Dispatches</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{transactions.length}</h2>
        </div>

        <div className="card-premium group border-indigo-500/5 bg-indigo-500/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-500 mb-4 transition-transform group-hover:scale-110">
                <Users className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Customers</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
              {new Set([...pendingItems.map(i => i.customer.id), ...transactions.map(t => t.customerId)]).size}
            </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full max-w-2xl">
           <SearchInput 
             defaultValue={q} 
             placeholder="Search Item, Customer or Order..." 
           />
        </div>
        <SupplyOutwardsFilters 
            customers={customers}
            items={items}
            currentCustomerId={customerId}
            currentItemId={itemId}
            currentStartDate={startDate}
            currentEndDate={endDate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main List: Items to Dispatch */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Pending Dispatch Items
            </h3>
            <Link href="/orders/dispatch" className="text-[10px] font-black text-primary hover:underline uppercase">Full Sale List</Link>
          </div>

          <div className="card-premium !p-0 overflow-hidden border-warning/10 shadow-lg shadow-warning/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header bg-warning/[0.02]">
                    <th className="table-cell-header">Item Details</th>
                    <th className="table-cell-header">Recipient</th>
                    <th className="table-cell-header text-right">Quantity</th>
                    <th className="table-cell-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost">
                  {pendingItems.length > 0 ? pendingItems.map((item: any) => (
                    <tr key={item.id} className="group hover:bg-surface-low/30 transition-all border-b border-border-ghost last:border-0">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-border-ghost flex items-center justify-center font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                            {item.item.sku[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground text-sm truncate">{item.item.name}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">SKU: {item.item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-foreground truncate">{item.customer.name}</span>
                          <div className="flex items-center gap-1.5">
                             <span className="text-[9px] font-black text-primary uppercase">DO #{item.orderId.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                           <span className="text-sm font-black text-warning">{item.quantity}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Units Booked</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/orders/dispatch/${item.orderId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Send
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                           <AlertCircle className="w-10 h-10" />
                           <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No pending bookings to dispatch.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Recent Audit Log */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 px-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Audit: Recently Dispatched
          </h3>

          <div className="space-y-4">
            {transactions.length > 0 ? transactions.map((tx: any) => (
              <div key={tx.id} className="card-premium p-4 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/10 flex items-center justify-center text-success shrink-0 group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-black text-foreground truncate">{tx.item.name}</p>
                         <span className="text-xs font-black text-error">-{Math.abs(tx.quantity)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] font-bold text-muted-foreground truncate">{tx.customer?.name || 'Guest'}</p>
                        </div>
                        {tx.referenceType === "DISPATCH" && (
                           <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                              <span className="text-[8px] font-black text-primary uppercase">DO #{tx.referenceId.split('-')[0]}</span>
                           </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ghost">
                         <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60">
                           {formatDate(tx.createdAt)}
                         </span>
                         <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                           {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                   </div>
                </div>
              </div>
            )) : (
              <div className="card-premium p-10 text-center">
                 <p className="text-xs text-muted-foreground font-medium">No recent dispatch activity.</p>
              </div>
            )}
            
            <Link href="/transactions" className="flex items-center justify-center gap-2 py-4 text-[10px] font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]">
               View Full Audit Log
               <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
