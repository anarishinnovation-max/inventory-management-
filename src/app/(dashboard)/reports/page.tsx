import { 
  TrendingUp, 
  Download, 
  Calendar,
  Package,
  Truck,
  AlertCircle
} from "lucide-react";
import prisma from "@/lib/prisma";

async function getReportData() {
  try {
    // Top SKUs (Sales)
    const salesTx = await prisma.inventoryTransaction.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: { type: "SALE" },
      orderBy: { _sum: { quantity: "asc" } },
      take: 3,
    });
    
    const validSalesIds = salesTx.map(t => t.itemId).filter(Boolean) as string[];
    const saleItems = await prisma.item.findMany({ where: { id: { in: validSalesIds } } });
    
    let topSkus = salesTx.map(t => {
      const item = saleItems.find(i => i.id === t.itemId);
      return {
        name: item?.name || "Unknown SKU",
        val: `${Math.abs(t._sum.quantity || 0)} units`
      };
    });

    if (topSkus.length === 0) {
      topSkus = [{ name: "No Data", val: "0 units" }];
    }

    // Reorder List
    const inventory = await prisma.inventory.findMany({ include: { item: true } });
    const reorderList = inventory
      .filter(inv => inv.quantityAvailable <= inv.item.minStockLevel)
      .map(inv => ({
        name: inv.item.name,
        stock: inv.quantityAvailable,
        min: inv.item.minStockLevel
      }));

    // Capacity
    const totalStock = inventory.reduce((sum, inv) => sum + inv.quantityAvailable, 0);
    const capacityPct = Math.min(Math.round((totalStock / 5000) * 100), 100);

    // Vendor Efficiency
    const poStats = await prisma.purchaseOrder.groupBy({
      by: ["vendorId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });
    
    const vendorIds = poStats.map(p => p.vendorId).filter(Boolean) as string[];
    const vendorData = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });
    
    let vendorEfficiency = poStats.map(p => {
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
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Operational Analytics</h1>
          <p className="text-muted-foreground mt-1 text-lg">In-depth performance metrics and warehouse data integrity checks.</p>
        </div>
        <div className="flex gap-4">
           <button className="btn-secondary !text-sm">
              <Calendar className="w-4 h-4" />
              This Month
           </button>
           <button className="btn-primary !text-sm">
              <Download className="w-5 h-5" />
              Export Intelligence
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="card-premium space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Throughput Analysis (30-Day Trend)
                 </h3>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-4 px-4 border-b border-border-ghost pb-2">
                 {data.chartData.map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                         className="w-full primary-gradient rounded-t-xl transition-all duration-500 hover:brightness-110" 
                         style={{ height: `${h}%` }}
                       ></div>
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-surface-lowest px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.rawTrends[i]} tx
                       </div>
                    </div>
                 ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
                 <span>{new Date(Date.now() - 11*24*60*60*1000).toLocaleDateString([], {month:'short', day:'2-digit'})}</span>
                 <span>{new Date(Date.now() - 5*24*60*60*1000).toLocaleDateString([], {month:'short', day:'2-digit'})}</span>
                 <span>Today</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-premium !p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                       <Package className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-foreground">Top Performing SKUs</h4>
                 </div>
                 <div className="space-y-4">
                    {data.topSkus.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                        <span className="text-sm font-semibold text-foreground truncate pl-1">{item.name}</span>
                        <span className="text-sm font-bold text-primary whitespace-nowrap ml-2">{item.val}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="card-premium !p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                       <Truck className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-foreground">Top Supplier Volume</h4>
                 </div>
                 <div className="space-y-4">
                    {data.vendorEfficiency.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                        <span className="text-sm font-semibold text-foreground truncate pl-1">{item.name}</span>
                        <span className="text-sm font-bold text-blue-600 whitespace-nowrap ml-2">{item.val}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="card-premium space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                 </div>
                 <h4 className="font-bold text-foreground">Critical Reorder List</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 The following items have dropped to or below their minimum thresholds and require immediate procurement.
              </p>
              <div className="space-y-3">
                 {data.reorderList.length > 0 ? data.reorderList.map((item, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                      <p className="font-bold text-orange-900">{item.name}</p>
                      <p className="text-xs text-orange-700 mt-1">Stock: {item.stock} / Min: {item.min}</p>
                   </div>
                 )) : (
                   <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <p className="font-bold text-emerald-900">All Stocks Optimal</p>
                      <p className="text-xs text-emerald-700 mt-1">No pending reorders.</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="card-premium flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 rounded-full border-[10px] border-primary/20 border-t-primary flex items-center justify-center">
                 <span className="text-3xl font-black text-foreground">{data.capacityPct}%</span>
              </div>
              <div>
                 <h4 className="font-bold text-foreground text-xl">Capacity Utilization</h4>
                 <p className="text-sm text-muted-foreground mt-1 px-4">Tracked storage: <span className="text-foreground font-bold">{data.totalStock.toLocaleString()} units</span> occupied.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
