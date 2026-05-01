export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  MapPin,
  Truck,
  Users as UsersIcon,
  Package,
  Flame,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { ExportButton } from "./ExportButton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { cacheQuery } from "@/lib/cache";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getTransactionsRaw(companyId?: string, filters: any = {}) {
  if (!companyId) return [];
  
  const where: any = { companyId };
  
  if (filters.q) {
    where.OR = [
      { item: { name: { contains: filters.q, mode: 'insensitive' } } },
      { item: { sku: { contains: filters.q, mode: 'insensitive' } } }
    ];
  }
  
  if (filters.user) {
    where.userId = filters.user;
  }
  
  if (filters.type) {
    where.type = filters.type;
  }
  
  if (filters.start || filters.end) {
    where.createdAt = {};
    if (filters.start) where.createdAt.gte = new Date(filters.start);
    if (filters.end) {
      const endDate = new Date(filters.end);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const transactions = await (prisma as any).inventoryTransaction.findMany({
    where,
    include: {
      item: true,
      rack: true,
      customer: true,
      vendor: true,
      user: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return transactions;
}

import { TransactionFilters } from "./TransactionFilters";

export default async function TransactionsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const filters = await searchParams;

  const [transactions, users] = await Promise.all([
    getTransactionsRaw(session.companyId, filters).catch((e) => {
        console.error("Audit log fetch error:", e);
        return [];
    }),
    prisma.user.findMany({
      where: { companyId: session.companyId },
      select: { id: true, name: true }
    })
  ]);

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
             <span>Records</span>
             <span className="opacity-30">/</span>
             <span className="text-primary">Activity Log</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-2 font-medium">A list of every time items were moved or changed.</p>
        </div>
        <ExportButton data={transactions} />
      </header>

      <TransactionFilters users={users} />

      <div className="table-container !p-0">
        <div className="px-8 py-4 border-b border-border-ghost bg-surface-low/30 flex items-center justify-between">
           <h3 className="heading-md uppercase tracking-wider">Filtered Activity</h3>
           <div className="badge badge-neutral">
              {transactions.length} RECORDS FOUND
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header border-y-0">
                <th className="table-cell-header">Action</th>
                <th className="table-cell-header">Item Name</th>
                <th className="table-cell-header text-right">Change</th>
                <th className="table-cell-header text-center">User</th>
                <th className="table-cell-header">Vendor / Customer</th>
                <th className="table-cell-header text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {transactions.length > 0 ? transactions.map((tx: any) => (
                <tr key={tx.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      {(() => {
                        if (tx.type === "PURCHASE" || tx.type === "ADJUSTMENT_IN") {
                          return (
                            <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shadow-inner">
                              <ArrowDownLeft className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (tx.type === "SALE" || tx.type === "OUTWARD") {
                          return (
                            <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (tx.type === "SCRAP") {
                          return (
                            <div className="w-9 h-9 rounded-lg bg-error/10 text-error flex items-center justify-center shadow-inner">
                              <Flame className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (tx.type === "INITIAL_REGISTRY") {
                          return (
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          );
                        }
                        if (tx.type === "MOVE") {
                          return (
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                              <MapPin className="w-4 h-4" />
                            </div>
                          );
                        }
                        return (
                          <div className="w-9 h-9 rounded-lg bg-surface-low text-muted-foreground flex items-center justify-center shadow-inner">
                            <RefreshCw className="w-4 h-4" />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="font-black text-foreground text-xs tracking-tight group-hover:text-primary transition-all">
                          {tx.type === "INITIAL_REGISTRY" ? "REGISTRY" : 
                           tx.type === "SALE" ? "DISPATCH" : 
                           tx.type === "OUTWARD" ? "MANUAL OUT" : 
                           tx.type.replace("_", " ")}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{tx.referenceType || "GENERAL"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col">
                      <p className="font-bold text-foreground text-xs leading-tight">{tx.item.name}</p>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">SKU: {tx.item.sku}</p>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className={cn(
                      "text-base font-black tracking-tight",
                      tx.quantity > 0 ? "text-success" : "text-foreground"
                    )}>
                      {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex flex-col items-center">
                       <div className="w-7 h-7 rounded-full bg-surface-low border border-border-ghost flex items-center justify-center text-xs font-black text-muted-foreground mb-1">
                          {tx.user?.name[0]}
                       </div>
                       <span className="text-xs font-black text-foreground uppercase tracking-tighter">{tx.user?.name}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {tx.customer ? (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5 text-indigo-500 opacity-40 group-hover:opacity-100 transition-all" />
                        <span className="text-xs font-bold text-foreground">{tx.customer.name}</span>
                      </div>
                    ) : tx.vendor ? (
                       <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-orange-500 opacity-40 group-hover:opacity-100 transition-all" />
                        <span className="text-xs font-bold text-foreground">{tx.vendor.name}</span>
                      </div>
                    ) : (
                       <span className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-30 italic">Stock Change</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                      <p className="text-xs font-black text-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="px-8 py-40 text-center">
                      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                         <div className="w-20 h-20 rounded-4xl bg-surface-low border border-border-ghost flex items-center justify-center text-muted-foreground opacity-20">
                            <History className="w-10 h-10" />
                         </div>
                          <div>
                             <p className="text-2xl font-black text-foreground tracking-tight">No History Found</p>
                             <p className="text-[15px] font-medium text-muted-foreground mt-2">Activity shows up here when you buy items, sell items, or change stock.</p>
                          </div>
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

