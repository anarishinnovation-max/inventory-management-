import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, Truck, User, Calendar, Receipt, Search, AlertCircle, TrendingDown, Clock, Users, ArrowUpRight, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { SupplyOutwardsFilters } from "./SupplyOutwardsFilters";
import SupplyOutwardsList from "./SupplyOutwardsList";
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
    if (startDate && startDate.trim() !== "") {
      const sDate = new Date(startDate);
      whereTx.createdAt.gte = sDate;
      whereOrder.createdAt.gte = sDate;
    }
    if (endDate && endDate.trim() !== "") {
      const eDate = new Date(endDate);
      whereTx.createdAt.lte = eDate;
      whereOrder.createdAt.lte = eDate;
    }

    if (Object.keys(whereTx.createdAt).length === 0) delete whereTx.createdAt;
    if (Object.keys(whereOrder.createdAt).length === 0) delete whereOrder.createdAt;
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
      expectedDelivery: order.expectedDelivery,
      collectedBy: order.collectedBy,
      dispatchedBy: order.dispatchedBy,
      transportMode: order.transportMode
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary transition-colors border border-primary/10">
                <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Booked Items</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingItems.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning transition-colors border border-warning/10">
                <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Units to Send</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{totalPendingUnits}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-success/5 text-success transition-colors border border-success/10">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-success uppercase tracking-[0.15em]">Recent Dispatches</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{transactions.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-indigo-500/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-indigo-500/5 text-indigo-500 transition-colors border border-indigo-500/10">
                <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">Active Customers</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
                {new Set([...pendingItems.map(i => i.customer.id), ...transactions.map(t => t.customerId)]).size}
              </h2>
            </div>
        </div>
      </div>

      <SupplyOutwardsList 
        items={pendingItems}
        searchQuery={q}
        customers={customers}
        allItems={items}
        currentCustomerId={customerId}
        currentItemId={itemId}
        currentStartDate={startDate}
        currentEndDate={endDate}
      />

      {/* Recent Audit Log - Moved to Bottom */}
      <div className="space-y-6 pt-10 border-t border-border-ghost">
        <h3 className="heading-md uppercase tracking-widest flex items-center gap-2 px-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Audit: Recently Dispatched
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transactions.length > 0 ? transactions.map((tx: any) => (
            <div key={tx.id} className="card-premium p-6 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-success/5 border border-success/10 flex items-center justify-center text-success shrink-0 transition-colors">
                    <ArrowUpRight className="w-6 h-6" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <p className="text-sm font-black text-foreground truncate">{tx.item.name}</p>
                       <span className="text-sm font-black text-error">-{Math.abs(tx.quantity)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-[10px] font-bold text-muted-foreground truncate">{tx.customer?.name || 'Guest'}</p>
                      </div>
                      {tx.referenceType === "DISPATCH" && (
                         <div className="badge badge-primary">
                            DO #{tx.referenceId.split('-')[0]}
                         </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-ghost">
                       <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                         {formatDate(tx.createdAt)}
                       </span>
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                         {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                 </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full card-premium p-10 text-center">
               <p className="text-xs text-muted-foreground font-medium">No recent dispatch activity.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <Link href="/transactions" className="btn btn-ghost h-12 px-6">
             View Full Audit Log
             <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

