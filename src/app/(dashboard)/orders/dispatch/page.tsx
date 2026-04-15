import { 
  Truck, 
  User, 
  Search, 
  UserPlus,
  ChevronRight
} from "lucide-react";
import pool from "@/lib/db";

async function getDispatchData() {
  const query = `
    SELECT 
      t.*,
      json_build_object('name', i.name, 'sku', i.sku) as item,
      json_build_object('rackName', r."rackName") as rack,
      CASE WHEN c.id IS NOT NULL THEN json_build_object('name', c.name) ELSE null END as customer
    FROM "Transaction" t
    JOIN "Item" i ON t."itemId" = i.id
    JOIN "Rack" r ON t."rackId" = r.id
    LEFT JOIN "Customer" c ON t."customerId" = c.id
    WHERE t.type = 'OUTWARD'
    ORDER BY t."createdAt" DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export default async function DispatchPage() {
  const dispatches = await getDispatchData().catch(() => []);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Customer Fulfillment</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage outbound dispatches and issue inventory to customers.</p>
        </div>
        <button className="btn-primary">
          <Truck className="w-5 h-5" />
          Create New Dispatch
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-lowest rounded-3xl shadow-ambient border border-border-ghost overflow-hidden">
             <div className="px-8 py-5 border-b border-border-ghost flex items-center justify-between bg-surface-low/30">
                <h3 className="font-bold text-foreground">Recent Shipments</h3>
                <span className="text-xs font-bold text-muted-foreground uppercase">{dispatches.length} Total Dispatches</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="table-cell-header py-4">Customer</th>
                      <th className="table-cell-header py-4">SKU / Item</th>
                      <th className="table-cell-header py-4 text-right">Qty</th>
                      <th className="table-cell-header py-4 text-center">Status</th>
                      <th className="table-cell-header py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {dispatches.length > 0 ? dispatches.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-low/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-foreground">{d.customer?.name || "Retail Walk-in"}</p>
                        </td>
                        <td className="px-8 py-5">
                           <p className="font-semibold text-foreground text-sm">{d.item.name}</p>
                           <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">{d.item.sku}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <span className="text-lg font-bold text-foreground">{d.quantity}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <span className="badge-status bg-success/10 text-success border-success/20 !text-[10px] !px-3 tracking-widest">
                              Dispatched
                           </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-muted-foreground font-medium">
                           {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                           No dispatches recorded in the current period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="card-premium space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                 <User className="w-5 h-5 text-primary" />
                 Active Recipients
              </h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   placeholder="Find customer..." 
                   className="w-full pl-10 pr-4 py-3 bg-surface-low rounded-xl border-none outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                 />
              </div>
              <div className="space-y-3">
                 <div className="p-4 rounded-2xl bg-surface-low/50 border border-border-ghost flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all">
                    <div>
                       <p className="font-bold text-foreground">Global Logistics Inc.</p>
                       <p className="text-xs text-muted-foreground">3 active pending dispatches</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                 </div>
              </div>
              <button className="w-full py-4 rounded-2xl border border-dashed border-border-ghost text-muted-foreground font-bold hover:bg-surface-low hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2">
                 <UserPlus className="w-5 h-5" />
                 Register Small Business
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
