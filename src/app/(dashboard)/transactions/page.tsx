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
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
            <span>Audit</span>
            <span>/</span>
            <span className="text-primary">History</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">View all stock movements and updates</p>
        </div>
        <ExportButton data={transactions} />
      </header>

      <div className="bg-surface-lowest rounded-[2.5rem] shadow-ambient border border-border-ghost overflow-hidden">
        <div className="px-8 py-5 border-b border-border-ghost bg-surface-low/30 flex items-center justify-between">
           <h3 className="text-sm font-black text-foreground uppercase tracking-widest">All Transactions</h3>
           <span className="text-[10px] font-black text-muted-foreground bg-white px-3 py-1 rounded-full border border-border-ghost">{transactions.length} Transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low/20">
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Item</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Quantity</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Location</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">From/To</th>
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {transactions.length > 0 ? transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-surface-low/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {tx.type.includes("IN") || tx.type === "PURCHASE" ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                          <ArrowDownLeft className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-foreground text-[13px] tracking-tight">{tx.type}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{tx.referenceType || "System"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{tx.item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono font-bold mt-0.5">{tx.item.sku}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "text-xl font-black tracking-tighter",
                      tx.quantity > 0 ? "text-emerald-600" : "text-foreground"
                    )}>
                      {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {tx.rack ? (
                       <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-primary opacity-50" />
                          <span className="text-sm font-bold text-foreground">
                            {tx.rack.rackNumber}
                          </span>
                       </div>
                    ) : (
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">In-Transit</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {tx.customer ? (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-indigo-500 opacity-60" />
                        <span className="text-sm font-bold text-foreground">{tx.customer.name}</span>
                      </div>
                    ) : tx.vendor ? (
                       <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-500 opacity-60" />
                        <span className="text-sm font-bold text-foreground">{tx.vendor.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">Internal Ledger Update</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
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
