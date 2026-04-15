import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Truck,
  Users as UsersIcon
} from "lucide-react";
import pool from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getTransactions() {
  const query = `
    SELECT 
      t.*,
      json_build_object('name', i.name, 'sku', i.sku) as item,
      json_build_object('rackName', r."rackName") as rack,
      json_build_object('name', u.name) as "user",
      CASE WHEN c.id IS NOT NULL THEN json_build_object('name', c.name) ELSE null END as customer,
      CASE WHEN v.id IS NOT NULL THEN json_build_object('name', v.name) ELSE null END as vendor
    FROM "Transaction" t
    JOIN "Item" i ON t."itemId" = i.id
    JOIN "Rack" r ON t."rackId" = r.id
    JOIN "User" u ON t."userId" = u.id
    LEFT JOIN "Customer" c ON t."customerId" = c.id
    LEFT JOIN "Vendor" v ON t."vendorId" = v.id
    ORDER BY t."createdAt" DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export default async function TransactionsPage() {
  const transactions = await getTransactions().catch(() => []);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Transaction Registry</h1>
          <p className="text-muted-foreground mt-1 text-lg">Immutable audit trail of all warehouse stock movements.</p>
        </div>
        <button className="btn-secondary">
          <History className="w-5 h-5" />
          Export Logs
        </button>
      </header>

      <div className="bg-surface-lowest rounded-3xl shadow-ambient border border-border-ghost overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Type</th>
                <th className="table-cell-header">Item / SKU</th>
                <th className="table-cell-header text-right">Qty</th>
                <th className="table-cell-header">Location</th>
                <th className="table-cell-header">Entity</th>
                <th className="table-cell-header">Operator</th>
                <th className="table-cell-header">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {transactions.length > 0 ? transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-low/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {tx.type === "INWARD" || tx.type === "RETURN" ? (
                        <div className="p-2 rounded-lg bg-success/10 text-success">
                          <ArrowDownLeft className="w-5 h-5" />
                        </div>
                      ) : tx.type === "OUTWARD" ? (
                        <div className="p-2 rounded-lg bg-orange-600/10 text-orange-600">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-surface-dim text-muted-foreground">
                          <RefreshCcw className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-foreground leading-none">{tx.type}</p>
                        {tx.remarks && <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[100px]">{tx.remarks}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-foreground">{tx.item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{tx.item.sku}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "text-xl font-bold tracking-tight",
                      tx.type === "INWARD" || tx.type === "RETURN" ? "text-success" : "text-foreground"
                    )}>
                      {tx.type === "INWARD" || tx.type === "RETURN" ? "+" : "-"}{tx.quantity}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                      {tx.rack.rackName}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {tx.customer ? (
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <UsersIcon className="w-3 h-3 opacity-50" />
                        {tx.customer.name}
                      </span>
                    ) : tx.vendor ? (
                       <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Truck className="w-3 h-3 opacity-50" />
                        {tx.vendor.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Self/System</span>
                    )}
                  </td>
                  <td className="px-8 py-6 font-medium text-foreground">
                    {tx.user.name}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={7} className="px-8 py-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                         <History className="w-16 h-16" />
                         <p className="text-xl font-bold">Registry currently empty.</p>
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
