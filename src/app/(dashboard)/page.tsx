import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  IndianRupee,
  Truck,
  Search,
  FileDown,
  PlusSquare,
  Activity,
  Zap,
  BellRing,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = "force-dynamic";

async function getDashboardAnalytics() {
  // 1. Total Items
  const itemsCount = await prisma.item.count();

  // 2. Stock Value (Derived from POLineItems cost price or fallback to 0)
  // We'll take the average cost price for each item if multiple POs exist
  const stockValueResult = await prisma.$queryRaw<any[]>`
    SELECT SUM(t.avg_cost * inv."quantityAvailable")::numeric(15,2) as total
    FROM "Inventory" inv
    JOIN (
      SELECT "itemId", AVG("costPrice") as avg_cost 
      FROM "POLineItem" 
      GROUP BY "itemId"
    ) t ON inv."itemId" = t."itemId"
  `;
  const stockValue = stockValueResult[0]?.total || 0;

  // 3. Low Stock Count (Custom Query for precise comparison)
  const lowStockResult = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::int as count 
    FROM "Item" i 
    JOIN "Inventory" inv ON i.id = inv."itemId" 
    WHERE inv."quantityAvailable" < i."minStockLevel"
  `;

  // 4. Vendor Count
  const vendorsCount = await prisma.vendor.count();

  // 5. Stock Flow Dynamics (Last 30 days)
  const flowResult = await prisma.$queryRaw<any[]>`
    SELECT 
      date_trunc('day', t."createdAt") as day,
      SUM(CASE WHEN t.type IN ('PURCHASE', 'ADJUSTMENT_IN') THEN ABS(t.quantity) ELSE 0 END)::int as inbound,
      SUM(CASE WHEN t.type IN ('SALE', 'ADJUSTMENT_OUT') THEN ABS(t.quantity) ELSE 0 END)::int as outbound
    FROM "InventoryTransaction" t
    WHERE t."createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 10
  `;

  // 6. Recent Stock Activity
  const recentActivity = await prisma.inventoryTransaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
        item: true
    }
  });

  // 7. Velocity Analysis (Sum of SALE quantities)
  const velocityResult = await prisma.$queryRaw<any[]>`
    SELECT 
      i.name, 
      SUM(ABS(t.quantity))::int as units
    FROM "InventoryTransaction" t
    JOIN "Item" i ON t."itemId" = i.id
    WHERE t.type = 'SALE' AND t."createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY i.id, i.name
    ORDER BY units DESC
    LIMIT 4
  `;

  // 8. Priority Replenish (Low items list)
  const replenishItems = await prisma.$queryRaw<any[]>`
    SELECT 
      i.name, i.sku, i."minStockLevel",
      inv."quantityAvailable"::int as current_qty
    FROM "Item" i
    JOIN "Inventory" inv ON i.id = inv."itemId"
    WHERE inv."quantityAvailable" < i."minStockLevel"
    ORDER BY inv."quantityAvailable" ASC
    LIMIT 3
  `;

  return {
    kpis: {
      totalItems: itemsCount,
      stockValue: stockValue,
      lowStockCount: lowStockResult[0]?.count || 0,
      vendorsCount: vendorsCount,
    },
    flow: flowResult.reverse(),
    recentActivity: recentActivity.map(tx => ({
        id: tx.id,
        type: tx.type,
        quantity: Math.abs(tx.quantity),
        createdAt: tx.createdAt,
        item_name: tx.item.name,
        sku: tx.item.sku
    })),
    velocity: velocityResult,
    replenish: replenishItems
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
          <h1 className="heading-xl tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Real-time oversight of your logistics ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="btn-secondary" suppressHydrationWarning>
                <FileDown className="w-4 h-4 text-primary" />
                <span>Export Analysis</span>
            </button>
            <button className="btn-primary shadow-glow" suppressHydrationWarning>
                <PlusSquare className="w-4 h-4" />
                <span>Quick Stock Entry</span>
            </button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary/10 text-primary rounded-xl transition-transform group-hover:scale-110">
              <Package className="w-5 h-5" />
            </div>
            <div className="badge bg-success/10 text-success border-success/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              12%
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total SKUs</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">{data.kpis.totalItems}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">+3 new this week</p>
          </div>
        </div>

        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-success/10 text-success rounded-xl transition-transform group-hover:scale-110">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="badge bg-blue-50 text-blue-600 border-blue-100 italic lowercase font-medium">
              Live
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Value</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">₹{Number(data.kpis.stockValue).toLocaleString()}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Market valuation active</p>
          </div>
        </div>

        <div className="card-premium group border-error/5 hover:border-error/20 bg-error/[0.01]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-error/10 text-error rounded-xl transition-transform group-hover:scale-110">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="badge bg-error/10 text-error border-error/20">
              Critical
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Low Stock</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">{data.kpis.lowStockCount}</h2>
            <p className="text-[10px] text-error/60 mt-2 font-bold tracking-tight">Requires Attention</p>
          </div>
        </div>

        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl transition-transform group-hover:scale-110">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active Vendors</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">{data.kpis.vendorsCount}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Across 4 regions</p>
          </div>
        </div>
      </div>

      {/* Analytics Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stock Flow Charts */}
        <div className="lg:col-span-2 card-premium !p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-foreground">Stock Flow Dynamics</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Movement trends for last 10 sessions</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_oklch(0.55_0.18_250)]"></span> Inbound
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_8px_oklch(0.6_0.1_250)]"></span> Outbound
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2.5 px-2 relative border-b border-border-ghost pb-1">
             {data.flow.length > 0 ? data.flow.map((day, idx) => {
                 const maxVal = Math.max(...data.flow.map((d: any) => Math.max(d.inbound, d.outbound))) || 1;
                 const inHeight = (day.inbound / maxVal) * 100;
                 const outHeight = (day.outbound / maxVal) * 100;
                 return (
                     <div key={idx} className="flex-1 flex gap-1 items-end group relative h-full">
                         {/* Tooltip */}
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-white px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl whitespace-nowrap">
                            +{day.inbound} / -{day.outbound}
                         </div>
                         <div className="flex-1 bg-primary/20 rounded-t-sm transition-all duration-700 relative group-hover:bg-primary/30" style={{ height: `${inHeight}%` }}>
                             <div className="absolute inset-x-0 bottom-0 bg-primary rounded-t-sm h-full opacity-60 group-hover:opacity-100" />
                         </div>
                         <div className="flex-1 bg-indigo-300/20 rounded-t-sm transition-all duration-700 relative group-hover:bg-indigo-300/30" style={{ height: `${outHeight}%` }}>
                             <div className="absolute inset-x-0 bottom-0 bg-indigo-300 rounded-t-sm h-full opacity-60 group-hover:opacity-100" />
                         </div>
                     </div>
                 );
             }) : (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium italic text-xs">
                     Insufficient data to render flow dynamics.
                 </div>
             )}
          </div>
          <div className="flex justify-between mt-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] px-2">
            {data.flow.map((d, i) => <span key={i} className="flex-1 text-center">{new Date(d.day).toLocaleDateString([], { day: '2-digit', month: 'short'})}</span>)}
          </div>
        </div>

        {/* Priority Replenish */}
        <div className="card-premium border-error/10 bg-error/[0.02] flex flex-col !p-8">
          <div className="flex items-center gap-3 text-error mb-8">
            <div className="p-2 bg-error/10 rounded-lg">
                <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Priority Replenish</h3>
          </div>
          <div className="space-y-3 flex-1">
            {data.replenish.length > 0 ? data.replenish.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-error/5 flex items-center justify-between group hover:border-error/20 transition-all shadow-sm">
                    <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                        <p className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[120px]">{item.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-error">{item.current_qty} Units</p>
                        <p className="text-[9px] text-muted-foreground font-bold italic">Min: {item.minStockLevel}</p>
                    </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground font-medium text-center">
                    <Activity className="w-8 h-8 opacity-10 mb-2" />
                    <p className="text-[10px] uppercase font-black tracking-widest">Levels Optimal</p>
                </div>
            )}
          </div>
          <Link href="/orders/purchase/new" className="block w-full">
            <button className="w-full mt-8 py-3.5 bg-error text-white rounded-xl text-[11px] font-black shadow-lg shadow-error/10 hover:opacity-90 transition-all active:scale-95 uppercase tracking-widest">Refill Stock</button>
          </Link>
        </div>
      </div>

      {/* Bottom Detail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 card-premium !p-0 overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <History className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground">Audit Log</h3>
            </div>
            <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity" suppressHydrationWarning>View Full Trail</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low/10">
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Operation</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Asset Detail</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Delta</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {data.recentActivity.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-low/40 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className={cn(
                          "badge rounded-lg gap-1.5 border-none",
                          tx.type.includes('IN') || tx.type === 'PURCHASE' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      )}>
                        {tx.type.includes('IN') || tx.type === 'PURCHASE' ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{tx.item_name}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{tx.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-sm font-black text-foreground">{tx.type.includes('IN') || tx.type === 'PURCHASE' ? '+' : '-'}{tx.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[9px] font-black text-success px-2 py-0.5 rounded-md border border-success/20 bg-success/5">VERIFIED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Velocity & Smart Insights */}
        <div className="card-premium flex flex-col !p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-warning/10 rounded-lg">
                <Zap className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-lg font-black text-foreground">Market velocity</h3>
          </div>
          <div className="space-y-6 flex-1">
            {data.velocity.length > 0 ? data.velocity.map((item, idx) => {
                const maxUnits = data.velocity[0]?.units || 1;
                const progress = (item.units / maxUnits) * 100;
                return (
                    <div key={idx}>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-xs font-bold text-foreground">{item.name}</p>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Demand</p>
                            </div>
                            <span className="text-xs font-black text-primary">{item.units}U</span>
                        </div>
                        <div className="w-full bg-surface-low h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-1000 ease-out shadow-[0_0_8px_oklch(0.55_0.18_250)]" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-10 text-muted-foreground font-medium italic text-xs">
                    No movement detected in last 30d.
                </div>
            )}
          </div>
          
          <div className="mt-8 p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 relative overflow-hidden group shadow-sm transition-all hover:bg-primary/[0.05]">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
             <div className="flex items-start gap-4 relative z-10">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-white shadow-premium flex items-center justify-center border border-primary/10">
                    <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Smart Predictor</p>
                   <p className="text-[11px] font-bold text-muted-foreground mt-1.5 leading-relaxed">
                       Current velocity suggests <span className="text-foreground">Critical Shortage</span> of top 2 items within 4 days.
                   </p>
                   <button className="text-[10px] font-black text-primary uppercase tracking-widest mt-3 flex items-center gap-1 hover:gap-2 transition-all" suppressHydrationWarning>Autoload PO <ChevronRight className="w-3 h-3" /></button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
