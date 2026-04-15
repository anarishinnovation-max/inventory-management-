import { 
  TrendingUp, 
  Download, 
  Calendar,
  Package,
  Truck,
  AlertCircle
} from "lucide-react";

export default async function ReportsPage() {
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
                 {[40, 65, 30, 85, 45, 75, 55, 90, 60, 40, 80, 50].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                         className="w-full primary-gradient rounded-t-xl transition-all duration-500 hover:brightness-110" 
                         style={{ height: `${h}%` }}
                       ></div>
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-surface-lowest px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {h*12} units
                       </div>
                    </div>
                 ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
                 <span>Mar 01</span>
                 <span>Mar 15</span>
                 <span>Mar 30</span>
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
                    {[
                      { name: "Industrial Steel Bolt", val: "2,450 units" },
                      { name: "Copper Wiring (Large)", val: "1,820 units" },
                      { name: "Hydraulic Fluid X", val: "940 units" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="text-sm font-bold text-primary">{item.val}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="card-premium !p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                       <Truck className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-foreground">Vendor Efficiency</h4>
                 </div>
                 <div className="space-y-4">
                    {[
                      { name: "Global Logistics", val: "2.4 days" },
                      { name: "Reliable Parts Co.", val: "3.1 days" },
                      { name: "Raw Metals Ltd.", val: "5.0 days" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-low rounded-xl">
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="text-sm font-bold text-blue-600">{item.val}</span>
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
                 The following items have dropped below their minimum thresholds and require immediate procurement.
              </p>
              <div className="space-y-3">
                 <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <p className="font-bold text-orange-900">Sealing Gaskets (Small)</p>
                    <p className="text-xs text-orange-700 mt-1">Stock: 12 / Min: 50</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 opacity-60">
                    <p className="font-bold text-orange-900">Thermal Paste (Bulk)</p>
                    <p className="text-xs text-orange-700 mt-1">Stock: 5 / Min: 10</p>
                 </div>
              </div>
              <button className="btn-primary w-full">
                 Start Bulk PO
              </button>
           </div>

           <div className="card-premium flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 rounded-full border-[10px] border-primary/20 border-t-primary flex items-center justify-center">
                 <span className="text-3xl font-black text-foreground">84%</span>
              </div>
              <div>
                 <h4 className="font-bold text-foreground text-xl">Capacity Utilization</h4>
                 <p className="text-sm text-muted-foreground mt-1 px-4">Remaining storage: <span className="text-foreground font-bold">1.2k units</span> across 4 racks.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
