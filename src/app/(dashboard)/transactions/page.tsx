import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  MapPin,
  Truck,
  Users as UsersIcon
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { ExportButton } from "./ExportButton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getTransactions() {
  const transactions = await (prisma as any).inventoryTransaction.findMany({
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

export default async function TransactionsPage() {
  const transactions = await getTransactions().catch((e) => {
      console.error("Audit log fetch error:", e);
      return [];
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Systems audit</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Ledger history</span>
          </nav>
          <h1 className="heading-xl tracking-tight">System Ledger</h1>
          <p className="text-muted-foreground mt-2 font-medium">Immutable audit trail of all asset movements and state changes.</p>
        </div>
        <ExportButton data={transactions} />
      </header>

      <div className="card-premium !p-0 overflow-hidden">
        <div className="px-8 py-4 border-b border-border-ghost bg-surface-low/30 flex items-center justify-between">
           <h3 className="text-[11px] font-black text-foreground uppercase tracking-wider">Transaction sequence</h3>
           <div className="badge border-none bg-white shadow-sm text-[9px] px-2.5 h-6">
              {transactions.length} RECORDS
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header border-y-0">
                <th className="table-cell-header">Entry Type</th>
                <th className="table-cell-header">Asset Detail</th>
                <th className="table-cell-header text-right">Delta</th>
                <th className="table-cell-header">Node</th>
                <th className="table-cell-header">Entity focus</th>
                <th className="table-cell-header text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {transactions.length > 0 ? transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-surface-low/30 transition-all group border-b border-border-ghost last:border-0">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {tx.type.includes("IN") || tx.type === "PURCHASE" ? (
                        <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shadow-inner">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-foreground text-[11px] tracking-tight group-hover:text-primary transition-all">{tx.type}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-0.5">{tx.referenceType || "CORE"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <p className="font-bold text-foreground text-xs leading-tight">{tx.item.name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">SKU: {tx.item.sku}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={cn(
                      "text-base font-black tracking-tight",
                      tx.quantity > 0 ? "text-success" : "text-foreground"
                    )}>
                      {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {tx.rack ? (
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-all" />
                          <span className="text-[11px] font-bold text-foreground">
                            NODE-{tx.rack.rackNumber}
                          </span>
                       </div>
                    ) : (
                       <span className="badge bg-surface-low text-muted-foreground text-[8px] h-5 border-none">TRANSIENT</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {tx.customer ? (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5 text-indigo-500 opacity-40 group-hover:opacity-100 transition-all" />
                        <span className="text-[11px] font-bold text-foreground">{tx.customer.name}</span>
                      </div>
                    ) : tx.vendor ? (
                       <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-orange-500 opacity-40 group-hover:opacity-100 transition-all" />
                        <span className="text-[11px] font-bold text-foreground">{tx.vendor.name}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-30 italic">Internal Update</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                      <p className="text-[11px] font-black text-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
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
                             <p className="text-2xl font-black text-foreground tracking-tight">Audit Registry Empty</p>
                             <p className="text-[15px] font-medium text-muted-foreground mt-2">Transactions are generated during Goods Receipt, Fulfillment, or Manual Adjustments. Complete a workflow to see history.</p>
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
