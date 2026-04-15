import { 
  Users, 
  MapPin, 
  Phone, 
  Calendar,
  ChevronRight,
  MoreVertical,
  Search,
  Plus
} from "lucide-react";
import pool from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getCustomersWithStats() {
  const query = `
    SELECT 
      c.id, c.name, c.contact, c.address,
      COUNT(t.id) as "totalTransactions",
      MAX(t."createdAt") as "lastInteraction"
    FROM "Customer" c
    LEFT JOIN "Transaction" t ON c.id = t."customerId"
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export default async function CustomersPage() {
  const customers = await getCustomersWithStats().catch(() => []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="heading-xl">Customer Success</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage accounts, track interactions, and drive retention.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search accounts..." 
                    className="pl-11 pr-4 py-3 bg-surface-lowest border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-ambient"
                />
            </div>
            <button className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Account
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Client Directory
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {customers.map(customer => (
              <div key={customer.id} className="p-5 bg-surface-lowest rounded-2xl border border-border-ghost shadow-ambient hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-bold text-foreground text-lg">{customer.name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase mt-1">{customer.contact}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center font-bold text-primary group-hover:bg-primary/10 transition-colors">
                        {customer.name[0]}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="badge-status bg-primary/10 text-primary border-primary/20">
                    {customer.totalTransactions} Orders
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
            {customers.length === 0 && <p className="text-center py-10 text-muted-foreground italic">No customers found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="heading-lg flex items-center gap-3">
               Detailed Accounts Overview
             </h2>
             <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-surface-low text-muted-foreground transition-all">
                    <MoreVertical className="w-5 h-5" />
                </button>
             </div>
           </div>

           <div className="bg-surface-lowest rounded-3xl shadow-ambient border border-border-ghost overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="table-cell-header text-xs">Customer Details</th>
                      <th className="table-cell-header text-xs">Primary Contact</th>
                      <th className="table-cell-header text-xs">Office Address</th>
                      <th className="table-cell-header text-xs">Activity</th>
                      <th className="table-cell-header text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {customers.length > 0 ? customers.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-low/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center font-bold text-white shadow-ambient">
                               {c.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-lg leading-tight">{c.name}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">ID: {c.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-foreground font-medium">
                              <Phone className="w-4 h-4 text-primary" />
                              <span>{c.contact}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-start gap-2 text-muted-foreground max-w-[200px]">
                             <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                             <span className="text-sm line-clamp-2">{c.address}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                                <Calendar className="w-3 h-3" />
                                <span>Last Transaction</span>
                             </div>
                             <p className="text-sm font-semibold text-foreground">
                                {c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : 'No activity'}
                             </p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                             "badge-status",
                             c.totalTransactions > 10 ? "bg-success/10 text-success border-success/20" : "bg-primary/10 text-primary border-primary/20"
                          )}>
                             {c.totalTransactions > 10 ? 'VIP Account' : 'Standard'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                         <td colSpan={5} className="px-8 py-32 text-center text-muted-foreground font-medium">
                            No customer records found in the database.
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl bg-surface-lowest border border-border-ghost shadow-ambient space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-foreground">{customers.length}</p>
                    <p className="text-muted-foreground font-medium">Total Accounts</p>
                 </div>
              </div>
              <div className="p-8 rounded-3xl bg-surface-lowest border border-border-ghost shadow-ambient space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-foreground">
                        {customers.filter(c => c.totalTransactions > 0).length}
                    </p>
                    <p className="text-muted-foreground font-medium">Active Accounts</p>
                 </div>
              </div>
              <div className="p-8 rounded-3xl bg-surface-lowest border border-border-ghost shadow-ambient space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-3xl font-bold text-foreground">
                        {customers.filter(c => {
                            const last = c.lastInteraction ? new Date(c.lastInteraction) : null;
                            if (!last) return false;
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return last < thirtyDaysAgo;
                        }).length}
                    </p>
                    <p className="text-muted-foreground font-medium">Dormant Accounts</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
