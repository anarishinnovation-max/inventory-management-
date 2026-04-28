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

      // 4. Inventory Aging (FIFO Buckets)
      prisma.$queryRaw<any[]>`
        SELECT 
          CASE 
            WHEN b."purchaseDate" > NOW() - INTERVAL '30 days' THEN '0-30 Days'
            WHEN b."purchaseDate" > NOW() - INTERVAL '60 days' THEN '31-60 Days'
            WHEN b."purchaseDate" > NOW() - INTERVAL '90 days' THEN '61-90 Days'
            ELSE '90+ Days'
          END as bucket,
          SUM(b."remainingQty")::int as units
        FROM "InventoryBatch" b
        INNER JOIN "Inventory" i ON b."inventoryId" = i.id
        WHERE b."remainingQty" > 0 AND i."companyId" = ${companyId}
        GROUP BY 1
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

      // 8. FIFO Queue (Oldest Stock)
      prisma.inventoryBatch.findMany({
        where: {
          remainingQty: { gt: 0 },
          inventory: { companyId }
        },
        orderBy: { purchaseDate: 'asc' },
        take: 5,
        include: {
          inventory: { include: { item: true } }
        }
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
      agingResult,
      recentActivity,
      velocityResult,
      replenishItems,
      fifoQueueResult,
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
      aging: agingResult as any[] || [],
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
      fifoQueue: fifoQueueResult as any[] || []
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
      aging: [],
      recentActivity: [],
      velocity: [],
      replenish: [],
      fifoQueue: []
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
            <div className="p-3 bg-primary/10 text-primary rounded-xl transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div className="badge badge-success">
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
            <div className="p-3 bg-success/10 text-success rounded-xl transition-colors">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="opacity-0">
              {/* Empty space for alignment */}
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Value</p>
            <h2 className="text-3xl font-black tracking-tighter text-foreground mt-1">₹{Number(data.kpis.stockValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Money in inventory</p>
          </div>
        </div>

        <div className="card-premium group border-error/10 bg-error/[0.01]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-error/10 text-error rounded-xl transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <Link href="/inventory?status=low" className="badge badge-error hover:bg-error hover:text-white transition-colors cursor-pointer">
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
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl transition-colors">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="badge badge-indigo">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FIFO Inventory Strategy */}
        <div className="card-premium !p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-md">FIFO Inventory Priority</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Clear oldest stock first</p>
            </div>
            <div className="hidden sm:flex gap-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-warning">
                <span className="w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_oklch(0.7_0.2_80)]"></span> High Age
              </div>
            </div>
          </div>

          <div className="flex-1 mt-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Priority Fulfillment Queue</p>
            <div className="space-y-4">
              {data.fifoQueue.map((batch: any, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost group hover:border-primary/20 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                      <History className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[150px] sm:max-w-[200px]">{batch.inventory.item.name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{batch.inventory.item.sku}</p>
                    </div>
                  </div>
                  <div className="sm:text-right border-t sm:border-t-0 border-border-ghost/50 pt-3 sm:pt-0">
                    <p className="text-sm font-black text-foreground">{batch.remainingQty} <span className="text-[10px] font-medium text-muted-foreground uppercase">Units</span></p>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                      Stock Date: {new Date(batch.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
              {data.fifoQueue.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Activity className="w-8 h-8 opacity-10 mb-4" />
                  <p className="text-[10px] uppercase font-black tracking-widest">No aging stock found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority Replenish */}
        <div className="card-premium border-error/10 bg-error/[0.02] flex flex-col !p-8">
          <div className="flex items-center gap-3 text-error mb-8">
            <div className="p-2 bg-error/10 rounded-lg">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="heading-md uppercase tracking-tight">Need to Buy Soon</h3>
          </div>
          <div className="space-y-3 flex-1">
            {data.replenish.length > 0 ? data.replenish.map((item: { id: string; name: string; sku: string; minStockLevel: number; current_qty: number; incoming_qty: number }, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-error/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-error/20 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 shrink-0 rounded-xl bg-error/5 text-error flex items-center justify-center shadow-inner"
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</p>
                        <p className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[150px]">{item.name}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-error/5 pt-3 sm:pt-0">
                  <div className="sm:text-right">
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
            <button className="btn btn-error w-full mt-8">Buy More</button>
          </Link>
        </div>
      </div>

      {/* Bottom Detail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 table-container !p-0">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-border-ghost bg-surface-low/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="w-4 h-4 text-primary" />
              </div>
              <h3 className="heading-md">Activity Log</h3>
            </div>
            <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity" suppressHydrationWarning>View Full List</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="table-cell-header">Action</th>
                  <th className="table-cell-header">Item Info</th>
                  <th className="table-cell-header">Change</th>
                  <th className="table-cell-header text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {data.recentActivity.map((tx: any) => (
                  <tr key={tx.id} className="table-row">
                    <td className="table-cell">
                      <div className={cn(
                        "badge gap-1.5",
                        tx.type.includes('IN') || tx.type === 'PURCHASE' ? "badge-success" : "badge-primary"
                      )}>
                        {tx.type.includes('IN') || tx.type === 'PURCHASE' ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{tx.item_name}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{tx.sku}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-black text-foreground">{tx.type.includes('IN') || tx.type === 'PURCHASE' ? '+' : '-'}{tx.quantity}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="badge badge-success">DONE</span>
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
            <h3 className="heading-md">Popular Items</h3>
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
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl transition-all duration-700" />
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

      {/* Spacer for bottom padding */}
      <div className="h-10" />
    </div>
  );
}

