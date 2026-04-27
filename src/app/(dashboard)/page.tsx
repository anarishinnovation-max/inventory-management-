import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    Activity,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    BellRing,
    ChevronRight,
    FileDown,
    History,
    IndianRupee,
    Package,
    PlusSquare,
    ShoppingCart,
    Timer,
    TrendingUp,
    Truck,
    Zap
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cacheQuery } from "@/lib/cache";
import { DashboardActions } from "./components/DashboardActions";

const getCachedDashboardAnalytics = (companyId: string) => cacheQuery(
  async () => {
    const results = await Promise.all([
      // 1. Consolidated Stock Stats (Total, Low, Out of Stock)
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*)::int as total,
          COUNT(CASE WHEN inv."quantityAvailable" <= 0 OR inv.id IS NULL THEN 1 END)::int as out_of_stock,
          COUNT(CASE WHEN inv."quantityAvailable" > 0 AND inv."quantityAvailable" <= i."minStockLevel" THEN 1 END)::int as low_stock
        FROM "Item" i
        LEFT JOIN "Inventory" inv ON i.id = inv."itemId"
        WHERE i."companyId" = ${companyId}
      `,

      // 2. Stock Value (Optimized - Left Join to include all stock)
      prisma.$queryRaw<any[]>`
        SELECT SUM(COALESCE(t.avg_cost, 0) * inv."quantityAvailable")::numeric(15,2) as total
        FROM "Inventory" inv
        INNER JOIN "Item" i ON inv."itemId" = i.id
        LEFT JOIN (
          SELECT "itemId", AVG("costPrice") as avg_cost 
          FROM "POLineItem" 
          GROUP BY "itemId"
        ) t ON inv."itemId" = t."itemId"
        WHERE inv."quantityAvailable" > 0 AND i."companyId" = ${companyId}
      `,

      // 3. Vendor Count
      prisma.vendor.count({ where: { companyId } }),

      // 4. Stock Flow Dynamics (Last 30 days)
      prisma.$queryRaw<any[]>`
        SELECT 
          date_trunc('day', t."createdAt") as day,
          SUM(CASE WHEN t.type IN ('PURCHASE', 'ADJUSTMENT_IN') THEN ABS(t.quantity) ELSE 0 END)::int as inbound,
          SUM(CASE WHEN t.type IN ('SALE', 'ADJUSTMENT_OUT') THEN ABS(t.quantity) ELSE 0 END)::int as outbound
        FROM "InventoryTransaction" t
        WHERE t."createdAt" > (NOW() - INTERVAL '30 days') AND t."companyId" = ${companyId}
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 10
      `,

      // 5. Recent Stock Activity
      prisma.inventoryTransaction.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { item: true }
      }),

      // 6. Velocity Analysis
      prisma.$queryRaw<any[]>`
        SELECT 
          i.name, 
          SUM(ABS(t.quantity))::int as units
        FROM "InventoryTransaction" t
        INNER JOIN "Item" i ON t."itemId" = i.id
        WHERE t.type = 'SALE' AND t."createdAt" > (NOW() - INTERVAL '30 days') AND t."companyId" = ${companyId}
        GROUP BY i.id, i.name
        ORDER BY units DESC
        LIMIT 4
      `,

      // 7. Replenish
      prisma.$queryRaw<any[]>`
        SELECT 
          i.id, i.name, i.sku, i."minStockLevel",
          inv."quantityAvailable"::int as current_qty,
          inv."incomingQty"::int as incoming_qty
        FROM "Item" i
        INNER JOIN "Inventory" inv ON i.id = inv."itemId"
        WHERE (inv."quantityAvailable" + inv."incomingQty") < i."minStockLevel" AND i."companyId" = ${companyId}
        ORDER BY (inv."quantityAvailable" + inv."incomingQty") ASC
        LIMIT 3
      `,

      // 8. Oldest Items
      prisma.item.findMany({
        where: {
          companyId,
          inventory: { quantityAvailable: { gt: 0 } }
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { inventory: true }
      }),

      // 9. Monthly Revenue
      prisma.$queryRaw<any[]>`
        SELECT SUM(di.quantity * di."sellingPrice")::numeric(15,2) as total
        FROM "DispatchItem" di
        INNER JOIN "DispatchOrder" dord ON di."dispatchOrderId" = dord.id
        WHERE dord.status = 'dispatched' 
          AND dord."createdAt" > date_trunc('month', NOW())
          AND dord."companyId" = ${companyId}
      `
    ]);

    const [
      stockStatsResult,
      stockValueResult,
      vendorsCount,
      flowResult,
      recentActivity,
      velocityResult,
      replenishItems,
      oldestItems,
      monthlyRevenueResult
    ] = results;

    const stats = (stockStatsResult as any)[0] || { total: 0, out_of_stock: 0, low_stock: 0 };
    const stockValue = Number((stockValueResult as any)[0]?.total || 0);
    const monthlyRevenue = Number((monthlyRevenueResult as any)[0]?.total || 0);

    return {
      kpis: {
        totalItems: stats.total,
        stockValue: stockValue,
        lowStockCount: stats.low_stock,
        outOfStockCount: stats.out_of_stock,
        vendorsCount: vendorsCount,
        monthlyRevenue: monthlyRevenue,
      },
      flow: (flowResult as any[] || []).reverse(),
      recentActivity: (recentActivity as any[] || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        quantity: Math.abs(tx.quantity),
        createdAt: tx.createdAt,
        item_name: tx.item.name,
        sku: tx.item.sku
      })),
      velocity: velocityResult as any[] || [],
      replenish: replenishItems as any[] || [],
      oldestItems: oldestItems as any[] || []
    };
  },
  ["dashboard-analytics-v5", companyId],
  30
)();

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getCachedDashboardAnalytics(session.companyId).catch((e) => {
    console.error("Dashboard data fetch error:", e);
    return {
      kpis: { totalItems: 0, stockValue: 0, lowStockCount: 0, outOfStockCount: 0, vendorsCount: 0, monthlyRevenue: 0 },
      flow: [],
      recentActivity: [],
      velocity: [],
      replenish: [],
      oldestItems: []
    };
  });

  return (
    <div className="space-y-10 pb-20">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="heading-xl tracking-tight">Summary</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">See what is happening with your inventory now.</p>
        </div>
        <DashboardActions />
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary/10 text-primary rounded-xl transition-transform ">
              <Package className="w-5 h-5" />
            </div>
            <div className="badge bg-success/10 text-success border-success/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              12%
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Items</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">{data.kpis.totalItems}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">+3 new this week</p>
          </div>
        </div>

        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-success/10 text-success rounded-xl transition-transform ">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="badge bg-blue-50 text-blue-600 border-blue-100 italic lowercase font-medium opacity-0">
              {/* Live label removed */}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Value</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">₹{Number(data.kpis.stockValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Money in inventory</p>
          </div>
        </div>

        <div className="card-premium group border-error/5 hover:border-error/20 bg-error/[0.01]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-error/10 text-error rounded-xl transition-transform ">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <Link href="/inventory?status=low" className="badge bg-error/10 text-error border-error/20 hover:bg-error hover:text-white transition-colors cursor-pointer">
              View All
            </Link>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Alerts</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">{data.kpis.outOfStockCount + data.kpis.lowStockCount} Items</h2>
            <div className="flex items-center gap-2 mt-2">
               <Link href="/inventory?status=outofstock" className="text-[10px] text-error font-black tracking-tight hover:underline bg-error/5 px-2 py-0.5 rounded cursor-pointer transition-colors hover:bg-error/10">
                 {data.kpis.outOfStockCount} Out of Stock
               </Link>
               <span className="w-1 h-1 rounded-full bg-border-ghost"></span>
               <Link href="/inventory?status=low" className="text-[10px] text-warning font-black tracking-tight hover:underline bg-warning/5 px-2 py-0.5 rounded cursor-pointer transition-colors hover:bg-warning/10">
                 {data.kpis.lowStockCount} Low Stock
               </Link>
            </div>
          </div>
        </div>

        <div className="card-premium group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl transition-transform ">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="badge bg-indigo-50/50 text-indigo-600 border-indigo-100">
              MTD
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Monthly Sales</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">₹{Number(data.kpis.monthlyRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Revenue this month</p>
          </div>
        </div>
      </div>

      {/* Analytics Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stock Flow Charts */}
        <div className="lg:col-span-2 card-premium !p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-foreground">Items Moving In and Out</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Movement in the last 10 days</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_oklch(0.55_0.18_250)]"></span> Incoming
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-300 shadow-[0_0_8px_oklch(0.6_0.1_250)]"></span> Outgoing
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2.5 px-2 relative border-b border-border-ghost pb-1">
            {data.flow.length > 0 ? data.flow.map((day: { inbound: number; outbound: number; day: Date }, idx: number) => {
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
                Not enough data to show movement.
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] px-2">
            {data.flow.map((d: { inbound: number; outbound: number; day: Date }, i: number) => <span key={i} className="flex-1 text-center">{new Date(d.day).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>)}
          </div>
        </div>

        {/* Priority Replenish */}
        <div className="card-premium border-error/10 bg-error/[0.02] flex flex-col !p-8">
          <div className="flex items-center gap-3 text-error mb-8">
            <div className="p-2 bg-error/10 rounded-lg">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Need to Buy Soon</h3>
          </div>
          <div className="space-y-3 flex-1">
            {data.replenish.length > 0 ? data.replenish.map((item: { id: string; name: string; sku: string; minStockLevel: number; current_qty: number; incoming_qty: number }, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-error/5 flex items-center justify-between group hover:border-error/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center shadow-inner"
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                        <p className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[120px]">{item.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-error">{item.current_qty} Units</p>
                    <p className="text-[9px] text-muted-foreground font-bold italic">Min: {item.minStockLevel}</p>
                  </div>
                  <Link 
                    href={`/orders/purchase/new?itemId=${item.id}&quantity=${Math.max(1, item.minStockLevel - item.current_qty)}`}
                    className="flex items-center gap-2 px-4 py-2 bg-error/5 text-error hover:bg-error hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md border border-error/10 "
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Buy
                  </Link>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground font-medium text-center">
                <Activity className="w-8 h-8 opacity-10 mb-2" />
                <p className="text-[10px] uppercase font-black tracking-widest">Inventory is Good</p>
              </div>
            )}
          </div>
          <Link href="/orders/purchase/new" className="block w-full">
            <button className="w-full mt-8 py-3.5 bg-error text-white rounded-xl text-[11px] font-black shadow-lg shadow-error/10 hover:opacity-90 transition-all  uppercase tracking-widest">Buy More</button>
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
              <h3 className="text-lg font-black text-foreground">Activity Log</h3>
            </div>
            <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity" suppressHydrationWarning>View Full List</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low/10">
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Item Info</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Change</th>
                  <th className="px-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {data.recentActivity.map((tx: any) => (
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
                      <span className="text-[9px] font-black text-success px-2 py-0.5 rounded-md border border-success/20 bg-success/5">DONE</span>
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
            <h3 className="text-lg font-black text-foreground">Popular Items</h3>
          </div>
          <div className="space-y-6 flex-1">
            {data.velocity.length > 0 ? data.velocity.map((item: any, idx: number) => {
              const maxUnits = data.velocity[0]?.units || 1;
              const progress = (item.units / maxUnits) * 100;
              return (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Selling Fast</p>
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
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl  transition-all duration-700" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-white shadow-premium flex items-center justify-center border border-primary/10">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Tips</p>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5 leading-relaxed">
                  You might run out of these <span className="text-foreground">very soon</span> (top 2 items).
                </p>
                <button className="text-[10px] font-black text-primary uppercase tracking-widest mt-3 flex items-center gap-1 hover:gap-2 transition-all" suppressHydrationWarning>Re-order <ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Oldest Items Row */}
      <div className="grid grid-cols-1 gap-8">
        <div className="card-premium flex flex-col !p-8 border-warning/10 bg-warning/[0.02]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Timer className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-lg font-black text-foreground">Oldest Items in Inventory</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.oldestItems.map((item: any, idx: number) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-warning/5 shadow-sm hover:border-warning/20 transition-all">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                <p className="text-xs font-bold text-foreground mt-1 truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-ghost">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-black text-warning">
                    {item.inventory?.quantityAvailable} Units
                  </span>
                </div>
              </div>
            ))}
            {data.oldestItems.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground font-medium text-xs italic">
                No items found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

