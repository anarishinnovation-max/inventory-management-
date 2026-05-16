import {
   TrendingUp,
   Download,
   Calendar,
   Package,
   Truck,
   AlertCircle
} from "lucide-react";
import prisma from "@/lib/prisma";
import { ReportActions } from "./components/ReportActions";

async function getReportData() {
   try {
      // Top SKUs (Sales)
      const salesTx = await prisma.inventoryTransaction.groupBy({
         by: ["itemId"],
         _sum: { quantity: true },
         where: { type: "SALE" },
      });

      // Sort and take in-memory to avoid potential groupBy orderBy/take issues
      salesTx.sort((a, b) => (Number(b._sum.quantity) || 0) - (Number(a._sum.quantity) || 0));
      const top3Sales = salesTx.slice(0, 3);

      const validSalesIds = top3Sales
         .map((t: { itemId: string }) => t.itemId)
         .filter(Boolean);

      const saleItems = await prisma.item.findMany({
         where: { id: { in: validSalesIds } }
      });

      let topSkus = top3Sales.map((t: {
         itemId: string;
         _sum: { quantity: any };
      }) => {
         const item = saleItems.find(i => i.id === t.itemId);
         return {
            name: item?.name || "Unknown SKU",
            val: `${Math.abs(Number(t._sum.quantity) || 0)} units`
         };
      });
      if (topSkus.length === 0) {
         topSkus = [{ name: "No Data", val: "0 units" }];
      }

      // Reorder List
      const inventory = await prisma.inventory.findMany({ include: { item: true } });
      const reorderList = inventory
         .filter(inv => Number(inv.quantityAvailable) <= Number(inv.item.minStockLevel))
         .map(inv => ({
            name: inv.item.name,
            stock: Number(inv.quantityAvailable),
            min: Number(inv.item.minStockLevel)
         }));

      // Capacity
      const totalStock = inventory.reduce((sum, inv) => sum + Number(inv.quantityAvailable), 0);
      const capacityPct = Math.min(Math.round((totalStock / 5000) * 100), 100);

      // Vendor Efficiency
      const poStats = await prisma.purchaseOrder.groupBy({
         by: ["vendorId"],
         _count: { id: true },
      });

      // Sort and take in-memory
      poStats.sort((a, b) => (b._count.id || 0) - (a._count.id || 0));
      const top3Vendors = poStats.slice(0, 3);

      const vendorIds = top3Vendors.map(p => p.vendorId).filter(Boolean) as string[];
      const vendorData = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });

      let vendorEfficiency = top3Vendors.map(p => {
         const v = vendorData.find(vd => vd.id === p.vendorId);
         return {
            name: v?.name || "Unknown Vendor",
            val: `${p._count.id} Orders Active`
         };
      });

      if (vendorEfficiency.length === 0) {
         vendorEfficiency = [{ name: "No Vendors", val: "0 Orders" }];
      }

      // Throughput Trend (Last 12 intervals)
      const trends = [];
      for (let i = 11; i >= 0; i--) {
         const start = new Date();
         start.setDate(start.getDate() - i);
         start.setHours(0, 0, 0, 0);

         const end = new Date(start);
         end.setDate(start.getDate() + 1);

         const count = await prisma.inventoryTransaction.count({
            where: {
               createdAt: { gte: start, lt: end }
            }
         });
         trends.push(count);
      }

      // Normalize trends for chart (max height 100%)
      const maxVal = Math.max(...trends, 1);
      const chartData = trends.map(v => Math.round((v / maxVal) * 100));
      const rawTrends = trends;

      return { topSkus, reorderList, capacityPct, totalStock, vendorEfficiency, chartData, rawTrends };
   } catch (error) {
      return {
         topSkus: [],
         reorderList: [],
         capacityPct: 0,
         totalStock: 0,
         vendorEfficiency: [],
         chartData: Array(12).fill(0),
         rawTrends: Array(12).fill(0)
      };
   }
}

export default async function ReportsPage() {
   const data = await getReportData();

   return (
      <div className="space-y-10 pb-10">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
               <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  <span>Analytics</span>
                  <span className="opacity-30">/</span>
                  <span className="text-primary">Operational Intelligence</span>
               </nav>
               <h1 className="heading-xl tracking-tight">Enterprise Analytics</h1>
               <p className="text-muted-foreground mt-2 font-medium">Real-time throughput metrics and resource utilization heatmaps.</p>
            </div>
            <ReportActions />
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <div className="card-premium p-8 relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <TrendingUp className="w-5 h-5" />
                           </div>
                           <h3 className="text-lg font-black text-foreground tracking-tight">Throughput Dynamics</h3>
                        </div>
                        <div className="badge border-none bg-surface-low text-xs px-2 h-6 font-black text-muted-foreground">LAST 12 DAYS</div>
                     </div>

                     <div className="h-64 flex items-end justify-between gap-3 px-2 border-b border-border-ghost/50 pb-4">
                        {data.chartData.map((h, i) => (
                           <div key={i} className="flex-1 group/bar relative">
                              <div
                                 className="w-full bg-primary/20 rounded-t-lg transition-all duration-700 ease-out hover:bg-primary group-hover/bar:shadow-glow relative overflow-hidden"
                                 style={{ height: `${h}%` }}
                              >
                                 <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                              </div>
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-surface-lowest px-2 py-1 rounded text-xs font-black opacity-0 group-hover/bar:opacity-100 transition-all group-hover/bar:-top-14 pointer-events-none shadow-xl">
                                 {data.rawTrends[i]} TX
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="flex justify-between text-xs font-black text-muted-foreground uppercase tracking-widest mt-4 px-2">
                        <span>{new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: '2-digit' })}</span>
                        <span>{new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: '2-digit' })}</span>
                        <span className="text-primary">Today</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-premium !p-6 border-success/5 bg-success/[0.01]">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-2.5 bg-success/10 text-success rounded-xl">
                           <Package className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-wider">Top velocity SKUs</h4>
                     </div>
                     <div className="space-y-3">
                        {data.topSkus.map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-border-ghost transition-all hover:border-success/30 cursor-default group">
                              <span className="text-xs font-bold text-foreground truncate group-hover:text-success transition-colors">{item.name}</span>
                              <span className="text-xs font-black text-success bg-success/5 px-2 py-0.5 rounded-md">{item.val}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="card-premium !p-6 border-primary/5 bg-primary/[0.01]">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                           <Truck className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-wider">High Volume Nodes</h4>
                     </div>
                     <div className="space-y-3">
                        {data.vendorEfficiency.map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-border-ghost transition-all hover:border-primary/30 cursor-default group">
                              <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</span>
                              <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">{item.val}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="card-premium p-6 space-y-6 bg-error/[0.01] border-error/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                     <AlertCircle className="w-20 h-20 text-error" />
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="p-2.5 bg-error text-white rounded-xl shadow-lg shadow-error/20">
                        <AlertCircle className="w-5 h-5" />
                     </div>
                     <h4 className="text-sm font-black text-foreground uppercase tracking-wider">Critical replenishments</h4>
                  </div>
                  <div className="space-y-3 relative z-10">
                     {data.reorderList.length > 0 ? data.reorderList.map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white border border-error/20 shadow-sm group hover:border-error transition-all">
                           <p className="font-bold text-error text-sm">{item.name}</p>
                           <div className="flex justify-between items-center mt-2">
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">STOCK: {item.stock}</p>
                              <span className="badge bg-error/10 text-error border-none text-xs h-5">BELOW {item.min}</span>
                           </div>
                        </div>
                     )) : (
                        <div className="p-6 rounded-2xl bg-success/5 border border-success/20 text-center">
                           <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-3">
                              <TrendingUp className="w-5 h-5" />
                           </div>
                           <p className="text-xs font-black text-success uppercase tracking-widest">All Stocks Optimal</p>
                           <p className="text-xs text-success/60 mt-1">No pending reorders.</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="card-premium p-8 flex flex-col items-center text-center space-y-6 group">
                  <div className="w-36 h-36 rounded-full border-[10px] border-surface-low border-t-primary flex items-center justify-center relative transition-transform duration-1000 group-hover:rotate-[360deg]">
                     <div className="absolute inset-0 rounded-full border-[10px] border-primary/20" />
                     <span className="text-3xl font-black text-foreground tracking-tighter">{data.capacityPct}%</span>
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-foreground tracking-tight">Cubic Utilization</h4>
                     <div className="flex flex-col gap-1 mt-2">
                        <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{data.totalStock.toLocaleString()} UNITS ACTIVE</span>
                        <p className="text-xs text-muted-foreground leading-relaxed px-4">Warehouse spatial health index is currently within nominal parameters.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

