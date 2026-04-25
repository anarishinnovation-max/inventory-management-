import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
  CheckCircle2,
  Clock,
  Eye,
  Package,
  Truck,
  ArrowDownLeft,
  Search,
  ChevronRight,
  AlertCircle,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import SearchInput from "@/components/SearchInput";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getInwardData(query?: string, companyId?: string) {
  if (!companyId) return { pendingPOs: [], pendingItems: [], recentTransactions: [] };

  const wherePO: Prisma.PurchaseOrderWhereInput = {
    companyId,
    status: { in: ["PENDING", "ORDERED", "PARTIAL"] }
  };

  if (query) {
    wherePO.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { vendor: { name: { contains: query, mode: 'insensitive' } } },
      { items: { some: { item: { name: { contains: query, mode: 'insensitive' } } } } },
      { items: { some: { item: { sku: { contains: query, mode: 'insensitive' } } } } },
    ];
  }

  const [pendingPOs, recentTransactions] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: wherePO,
      include: {
        vendor: true,
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
      where: {
        companyId,
        type: "PURCHASE",
        OR: query ? [
          { item: { name: { contains: query, mode: 'insensitive' } } },
          { vendor: { name: { contains: query, mode: 'insensitive' } } },
          { referenceId: { contains: query, mode: 'insensitive' } },
        ] : undefined
      },
      include: {
        item: true,
        vendor: true,
        user: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })
  ]);

  // Flatten items for "ordered item" view
  const pendingItems = pendingPOs.flatMap(po => 
    po.items
      .filter(item => item.quantityReceived < item.quantityOrdered)
      .map(item => ({
        ...item,
        vendor: po.vendor,
        poId: po.id,
        expectedDelivery: po.expectedDelivery,
        orderDate: po.orderDate
      }))
  );

  return { pendingPOs, pendingItems, recentTransactions };
}

export default async function SupplyInwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  
  const { pendingPOs, pendingItems, recentTransactions } = await getInwardData(q, session.companyId).catch(() => ({ pendingPOs: [], pendingItems: [], recentTransactions: [] }));

  const totalPendingQty = pendingItems.reduce((acc, item) => acc + (item.quantityOrdered - item.quantityReceived), 0);

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Orders</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Supply Inwards</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Supply Inwards</h1>
          <p className="text-muted-foreground mt-2 font-medium">Focusing on items that are yet to be received.</p>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-premium group border-primary/5 bg-primary/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-4 transition-transform group-hover:scale-110">
                <Package className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ordered Items</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingItems.length}</h2>
        </div>

        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-warning/10 text-warning mb-4 transition-transform group-hover:scale-110">
                <Clock className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-warning uppercase tracking-widest">Remaining Units</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{totalPendingQty}</h2>
        </div>

        <div className="card-premium group border-success/5 bg-success/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-success/10 text-success mb-4 transition-transform group-hover:scale-110">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-success uppercase tracking-widest">Last 24h Inward</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
              {recentTransactions.filter(t => new Date(t.createdAt).getTime() > Date.now() - 86400000).length}
            </h2>
        </div>

        <div className="card-premium group border-indigo-500/5 bg-indigo-500/[0.01]">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-500 mb-4 transition-transform group-hover:scale-110">
                <Truck className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Vendors</p>
            <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
              {new Set(pendingItems.map(i => i.vendor.id)).size}
            </h2>
        </div>
      </div>

      <div className="flex-1 max-w-2xl">
         <SearchInput 
           defaultValue={q} 
           placeholder="Search Item, Vendor or PO..." 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main List: Items to Receive */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Pending Item Arrivals
            </h3>
            <Link href="/orders/purchase" className="text-[10px] font-black text-primary hover:underline uppercase">Full Purchase List</Link>
          </div>

          <div className="card-premium !p-0 overflow-hidden border-warning/10 shadow-lg shadow-warning/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header bg-warning/[0.02]">
                    <th className="table-cell-header">Item Details</th>
                    <th className="table-cell-header">Source</th>
                    <th className="table-cell-header">Placed On</th>
                    <th className="table-cell-header text-right">Quantity</th>
                    <th className="table-cell-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost">
                  {pendingItems.length > 0 ? pendingItems.map((item: any) => {
                    const remaining = item.quantityOrdered - item.quantityReceived;

                    return (
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
                            <span className="text-xs font-bold text-foreground truncate">{item.vendor.name}</span>
                            <div className="flex items-center gap-1.5">
                               <span className="text-[9px] font-black text-primary uppercase">PO #{item.poId.split('-')[0]}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-muted-foreground" />
                             <span className="text-xs font-bold text-foreground">{formatDate(item.orderDate)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-col items-end">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PENDING:</span>
                                <span className="text-sm font-black text-warning">{remaining}</span>
                             </div>
                             <div className="text-[9px] font-bold text-muted-foreground uppercase mt-1">
                                Ordered: {item.quantityOrdered}
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link href={`/orders/purchase/${item.poId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Receive
                          </Link>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                           <AlertCircle className="w-10 h-10" />
                           <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">All items have been received!</p>
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
            Audit: Recently Received
          </h3>

          <div className="space-y-4">
            {recentTransactions.length > 0 ? recentTransactions.map((tx: any) => (
              <div key={tx.id} className="card-premium p-4 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/10 flex items-center justify-center text-success shrink-0 group-hover:scale-110 transition-transform">
                      <ArrowDownLeft className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-black text-foreground truncate">{tx.item.name}</p>
                         <span className="text-xs font-black text-success">+{tx.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] font-bold text-muted-foreground truncate">{tx.vendor?.name || 'Unknown Vendor'}</p>
                        </div>
                        {tx.referenceType === "PO" && (
                           <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                              <span className="text-[8px] font-black text-primary uppercase">PO #{tx.referenceId.split('-')[0]}</span>
                           </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ghost">
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-surface-low border border-border-ghost flex items-center justify-center text-[8px] font-bold">
                               {tx.user?.name?.[0] || 'S'}
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground uppercase">{tx.user?.name || 'System'}</span>
                         </div>
                         <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">
                           {formatDate(tx.createdAt)}
                         </span>
                      </div>
                   </div>
                </div>
              </div>
            )) : (
              <div className="card-premium p-10 text-center">
                 <p className="text-xs text-muted-foreground font-medium">No recent inward activity.</p>
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
