import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Package, Truck, User, Calendar, Receipt, Search, AlertCircle, TrendingDown, Clock, Users } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/SearchInput";
import { SupplyOutwardsFilters } from "@/app/(dashboard)/inventory/supply-outwards/SupplyOutwardsFilters";

export const dynamic = "force-dynamic";

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function getSupplyOutwardsData(companyId: string, q?: string, customerId?: string, itemId?: string, startDate?: string, endDate?: string) {
  const where: any = {
    dispatchOrder: {
      companyId,
      status: "dispatched",
    }
  };

  if (customerId && customerId !== 'all') {
    where.dispatchOrder.customerId = customerId;
  }

  if (itemId && itemId !== 'all') {
    where.itemId = itemId;
  }

  if (startDate || endDate) {
    where.dispatchOrder.createdAt = {};
    if (startDate) where.dispatchOrder.createdAt.gte = new Date(startDate);
    if (endDate) where.dispatchOrder.createdAt.lte = new Date(endDate);
  }

  if (q) {
    where.OR = [
      { item: { name: { contains: q, mode: 'insensitive' } } },
      { item: { sku: { contains: q, mode: 'insensitive' } } },
      { dispatchOrder: { customer: { name: { contains: q, mode: 'insensitive' } } } },
      { dispatchOrder: { id: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const dispatchedItems = await prisma.dispatchItem.findMany({
    where,
    include: {
      item: true,
      dispatchOrder: {
        include: {
          customer: true,
        }
      }
    },
    orderBy: {
      dispatchOrder: {
        createdAt: 'desc'
      }
    }
  });

  return dispatchedItems;
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

  const dispatchedItems = await getSupplyOutwardsData(session.companyId, q, customerId, itemId, startDate, endDate);

  const [customers, items] = await Promise.all([
    prisma.customer.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true, sku: true }, orderBy: { name: 'asc' } }),
  ]);

  const totalQtySold = dispatchedItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalValueSold = dispatchedItems.reduce((acc, item) => acc + (item.quantity * item.sellingPrice), 0);

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
          <p className="text-muted-foreground mt-2 font-medium">Tracking items sent out to customers.</p>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium group border-error/5 bg-error/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-error/10 text-error mb-4 transition-transform group-hover:scale-110">
                <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-error uppercase tracking-widest">Total Items Sent</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{dispatchedItems.length}</h2>
        </div>

        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-warning/10 text-warning mb-4 transition-transform group-hover:scale-110">
                <Clock className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-warning uppercase tracking-widest">Total Units</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{totalQtySold}</h2>
        </div>

        <div className="card-premium group border-success/5 bg-success/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-success/10 text-success mb-4 transition-transform group-hover:scale-110">
                <Receipt className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-success uppercase tracking-widest">Sales Revenue (Est.)</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">₹{totalValueSold.toLocaleString('en-IN')}</h2>
        </div>

        <div className="card-premium group border-indigo-500/5 bg-indigo-500/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-500 mb-4 transition-transform group-hover:scale-110">
                <Users className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Customers</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
              {new Set(dispatchedItems.map(i => i.dispatchOrder.customer.id)).size}
            </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full max-w-2xl">
           <SearchInput 
             defaultValue={q} 
             placeholder="Search Item, Customer or Invoice..." 
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

      <div className="card-premium !p-0 overflow-hidden border-error/10 shadow-lg shadow-error/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header bg-error/[0.02]">
                <th className="table-cell-header">Date</th>
                <th className="table-cell-header">Item Details</th>
                <th className="table-cell-header">Customer</th>
                <th className="table-cell-header text-right">Qty</th>
                <th className="table-cell-header text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {dispatchedItems.length > 0 ? dispatchedItems.map((item: any) => {
                return (
                  <tr key={item.id} className="group hover:bg-surface-low/30 transition-all border-b border-border-ghost last:border-0">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{formatDate(item.dispatchOrder.createdAt)}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {new Date(item.dispatchOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-border-ghost flex items-center justify-center font-bold text-error shrink-0 group-hover:bg-error group-hover:text-white transition-all">
                          {item.item.sku[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm truncate">{item.item.name}</span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">SKU: {item.item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-surface-low border border-border-ghost text-muted-foreground">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">{item.dispatchOrder.customer.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-error">{item.quantity}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Units</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/orders/dispatch/${item.dispatchOrder.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-low border border-border-ghost text-muted-foreground hover:text-primary hover:border-primary/20 transition-all group/link">
                        <span className="text-[10px] font-black uppercase tracking-widest">#{item.dispatchOrder.id.split('-')[0]}</span>
                        <Receipt className="w-3.5 h-3.5 group-hover/link:scale-110 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                       <AlertCircle className="w-10 h-10" />
                       <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No outgoing supply records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
