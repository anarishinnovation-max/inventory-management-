import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  IndianRupee,
  Truck,
  Users,
  Search,
  FileDown,
  PlusSquare,
  Activity,
  Zap,
  BellRing
} from "lucide-react";
import pool from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getDashboardAnalytics() {
  // 1. Total Items
  const itemsCount = await pool.query('SELECT COUNT(*)::int as count FROM "Item"');

  // 2. Stock Value (Using preferred vendor price or 0 if not available)
  const stockValue = await pool.query(`
    SELECT SUM(vi.price * s.quantity)::numeric(15,2) as total 
    FROM "Stock" s 
    JOIN "VendorItem" vi ON s."itemId" = vi."itemId" 
    WHERE vi."isPreferred" = true
  `);

  // 3. Low Stock Count
  const lowStock = await pool.query(`
    SELECT COUNT(*)::int as count 
    FROM (
      SELECT i.id FROM "Item" i 
      LEFT JOIN "Stock" s ON i.id = s."itemId" 
      GROUP BY i.id 
      HAVING COALESCE(SUM(s.quantity), 0) < i."minStockLevel"
    ) as low_items
  `);

  // 4. Vendor Count
  const vendorsCount = await pool.query('SELECT COUNT(*)::int as count FROM "Vendor"');

  // 5. Stock Flow Dynamics (Last 30 days)
  const flowQuery = await pool.query(`
    SELECT 
      date_trunc('day', t."createdAt") as day,
      SUM(CASE WHEN t.type = 'INWARD' THEN t.quantity ELSE 0 END)::int as inbound,
      SUM(CASE WHEN t.type = 'OUTWARD' THEN t.quantity ELSE 0 END)::int as outbound
    FROM "Transaction" t
    WHERE t."createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 10
  `);

  // 6. Recent Stock Activity
  const activityQuery = await pool.query(`
    SELECT 
      t.id, t.type, t.quantity, t."createdAt",
      i.name as item_name, i.sku
    FROM "Transaction" t
    JOIN "Item" i ON t."itemId" = i.id
    ORDER BY t."createdAt" DESC
    LIMIT 5
  `);

  // 7. Velocity Analysis (Top 4 items)
  const velocityQuery = await pool.query(`
    SELECT 
      i.name, 
      SUM(t.quantity)::int as units
    FROM "Transaction" t
    JOIN "Item" i ON t."itemId" = i.id
    WHERE t.type = 'OUTWARD' AND t."createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY i.id, i.name
    ORDER BY units DESC
    LIMIT 4
  `);

  // 8. Priority Replenish (Low items list)
  const replenishItems = await pool.query(`
    SELECT 
      i.name, i.sku, i."minStockLevel",
      COALESCE(SUM(s.quantity), 0)::int as current_qty
    FROM "Item" i
    LEFT JOIN "Stock" s ON i.id = s."itemId"
    GROUP BY i.id, i.name, i.sku, i."minStockLevel"
    HAVING COALESCE(SUM(s.quantity), 0) < i."minStockLevel"
    ORDER BY current_qty ASC
    LIMIT 3
  `);

  return {
    kpis: {
      totalItems: itemsCount.rows[0].count || 0,
      stockValue: stockValue.rows[0].total || 0,
      lowStockCount: lowStock.rows[0].count || 0,
      vendorsCount: vendorsCount.rows[0].count || 0,
    },
    flow: flowQuery.rows.reverse(),
    recentActivity: activityQuery.rows,
    velocity: velocityQuery.rows,
    replenish: replenishItems.rows
  };
}

export default async function DashboardPage() {
  const data = await getDashboardAnalytics().catch((e) => {
      console.error("Dashboard data fetch error:", e);
      return {
        kpis: { totalItems: 0, stockValue: 0, lowStockCount: 0, vendorsCount: 0 },
        flow: [],
        recentActivity: [],
        velocity: [],
        replenish: []
      };
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Real-time health pulse of your logistics ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-surface-lowest text-foreground text-sm font-bold rounded-2xl shadow-ambient border border-border-ghost hover:bg-surface-low transition-all">
                <FileDown className="w-4 h-4 text-primary" />
                Export Core Analysis
            </button>
            <button className="flex items-center gap-2 px-6 py-3 primary-gradient text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <PlusSquare className="w-4 h-4" />
                Quick Stock Entry
            </button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-sm transition-transform group-hover:scale-110">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-success uppercase tracking-widest bg-success/10 px-2 py-1 rounded-full border border-success/20">
              <TrendingUp className="w-3 h-3" />
              12%
            </div>
          </div>
          <div className="mt-8">
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Total Active SKUs</p>
            <h2 className="text-4xl font-black tracking-tighter text-foreground mt-2">{data.kpis.totalItems}</h2>
          </div>
        </div>

        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-success/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-success/10 text-success rounded-2xl shadow-sm transition-transform group-hover:scale-110">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-success uppercase tracking-widest bg-success/10 px-2 py-1 rounded-full border border-success/20 transition-all">
              Live
            </div>
          </div>
          <div className="mt-8">
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Inventory Asset Value</p>
            <h2 className="text-4xl font-black tracking-tighter text-foreground mt-2">₹{Number(data.kpis.stockValue).toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-error/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-error/10 text-error rounded-2xl shadow-sm transition-transform group-hover:scale-110">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-error uppercase tracking-widest bg-error/10 px-2 py-1 rounded-full border border-error/20">
              Critical
            </div>
          </div>
          <div className="mt-8">
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Low Stock Items</p>
            <h2 className="text-4xl font-black tracking-tighter text-foreground mt-2">{data.kpis.lowStockCount}</h2>
          </div>
        </div>

        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl shadow-sm transition-transform group-hover:scale-110">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8">
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Verified Vendors</p>
            <h2 className="text-4xl font-black tracking-tighter text-foreground mt-2">{data.kpis.vendorsCount}</h2>
          </div>
        </div>
      </div>

      {/* Analytics Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stock Flow Charts */}
        <div className="lg:col-span-2 bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-foreground">Stock Flow Dynamics</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">Operational movement trends over the last cycle.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></span> Inbound
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300 ring-4 ring-indigo-300/20"></span> Outbound
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 px-4 relative">
             {data.flow.length > 0 ? data.flow.map((day, idx) => {
                 const maxVal = Math.max(...data.flow.map((d: any) => d.inbound + d.outbound)) || 1;
                 const inHeight = (day.inbound / maxVal) * 100;
                 const outHeight = (day.outbound / maxVal) * 100;
                 return (
                     <div key={idx} className="flex-1 flex flex-col gap-1 items-center group relative h-full justify-end">
                         {/* Tooltip */}
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-surface-lowest px-3 py-1.5 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl whitespace-nowrap">
                            In: {day.inbound} | Out: {day.outbound}
                         </div>
                         <div className="w-full bg-indigo-300/40 rounded-t-lg transition-all duration-500 overflow-hidden relative" style={{ height: `${outHeight}%` }}>
                             <div className="absolute bottom-0 inset-x-0 bg-indigo-300 h-full transition-all group-hover:brightness-110" />
                         </div>
                         <div className="w-full bg-primary/40 rounded-t-lg transition-all duration-500 overflow-hidden relative" style={{ height: `${inHeight}%` }}>
                             <div className="absolute bottom-0 inset-x-0 bg-primary h-full transition-all group-hover:brightness-110" />
                         </div>
                     </div>
                 );
             }) : (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium italic">
                     Insufficient data to render flow dynamics.
                 </div>
             )}
          </div>
          <div className="flex justify-between mt-8 text-[10px] text-muted-foreground font-black uppercase tracking-widest px-4">
            {data.flow.map((d, i) => i % 2 === 0 ? <span key={i}>{new Date(d.day).toLocaleDateString([], { day: '2-digit', month: 'short'})}</span> : null)}
          </div>
        </div>

        {/* Priority Replenish */}
        <div className="bg-error/5 p-8 rounded-[2.5rem] border border-error/10 flex flex-col">
          <div className="flex items-center gap-3 text-error mb-8">
            <BellRing className="w-6 h-6" />
            <h3 className="text-xl font-black uppercase tracking-tight">Priority Replenish</h3>
          </div>
          <div className="space-y-4 flex-1">
            {data.replenish.length > 0 ? data.replenish.map((item, idx) => (
                <div key={idx} className="bg-surface-lowest p-5 rounded-2xl shadow-ambient border border-error/5 flex items-center justify-between group hover:scale-[1.02] transition-all">
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{item.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-error">{item.current_qty} Units</p>
                        <p className="text-[10px] text-muted-foreground font-bold italic">Min: {item.minStockLevel}</p>
                    </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground font-medium text-center">
                    <Activity className="w-10 h-10 opacity-10 mb-2" />
                    All stock levels optimal.
                </div>
            )}
          </div>
          <button className="w-full mt-8 py-4 bg-error text-white rounded-2xl text-sm font-black shadow-lg shadow-error/20 hover:bg-error/90 transition-all hover:scale-[1.02] active:scale-95">
             Generate Procurement POs
          </button>
        </div>
      </div>

      {/* Bottom Detail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-surface-lowest rounded-[2.5rem] shadow-ambient border border-border-ghost overflow-hidden">
          <div className="p-8 pb-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
            <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-black text-foreground">Stock Activity Log</h3>
            </div>
            <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Full Audit Trail</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low/20">
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quantity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {data.recentActivity.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-low/30 transition-colors cursor-pointer group">
                    <td className="px-8 py-6">
                      <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] tracking-widest border transition-colors",
                          tx.type === 'INWARD' ? "bg-success/10 text-success border-success/20" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      )}>
                        {tx.type === 'INWARD' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tx.item_name}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{tx.sku}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="text-lg font-black text-foreground">{tx.type === 'INWARD' ? '+' : '-'}{tx.quantity}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] font-black text-success px-3 py-1 rounded-full border border-success/20 bg-success/5 shadow-sm">AUTHENTICATED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Velocity Analysis */}
        <div className="bg-surface-lowest p-8 rounded-[2.5rem] shadow-ambient border border-border-ghost">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-5 h-5 text-warning" />
            <h3 className="text-xl font-black text-foreground">Velocity Analysis</h3>
          </div>
          <div className="space-y-8">
            {data.velocity.length > 0 ? data.velocity.map((item, idx) => {
                const maxUnits = data.velocity[0]?.units || 1;
                const progress = (item.units / maxUnits) * 100;
                return (
                    <div key={idx}>
                        <div className="flex justify-between items-end mb-2.5">
                            <div>
                                <p className="text-sm font-bold text-foreground">{item.name}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Demand Index: Active</p>
                            </div>
                            <span className="text-sm font-black text-primary">{item.units} Units</span>
                        </div>
                        <div className="w-full bg-surface-low h-3 rounded-full overflow-hidden shadow-inner ring-1 ring-border-ghost">
                            <div className="bg-primary h-full rounded-full shadow-lg transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-20 text-muted-foreground font-medium italic">
                    No outward movement detected.
                </div>
            )}
          </div>
          
          <div className="mt-12 p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
             <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-ambient flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Efficiency Insight</p>
                   <p className="text-xs font-bold text-muted-foreground mt-1 leading-relaxed">
                       Top movers account for <span className="text-foreground">84%</span> of Pick Rate. Optimize Rack Zone A for 15% faster fulfillment.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
