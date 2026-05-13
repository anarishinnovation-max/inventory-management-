import { ArrowLeft, ArrowRight, CheckCircle2, Package, TrendingUp } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface InventorySummaryProps {
  absoluteTotal: number;
  inStockCount: number;
  lowCount: number;
  outOfStockCount: number;
  urgentCount: number;
}

export default function InventorySummary({
  absoluteTotal,
  inStockCount,
  lowCount,
  outOfStockCount,
  urgentCount
}: InventorySummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card-premium h-[130px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
        <div className="flex justify-between items-start">
          <div className="p-2 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
            <Package className="w-4 h-4" />
          </div>
          <InfoTooltip 
            content={
              <div className="space-y-2">
                <p className="font-black uppercase tracking-widest text-[10px] text-primary">Status Definitions</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-success w-24 justify-center">In Stock</span>
                    <span className="text-xs text-muted-foreground">Healthy inventory levels above minimum.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-warning w-24 justify-center">Low Stock</span>
                    <span className="text-xs text-muted-foreground">Inventory at or below minimum level.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-error w-24 justify-center">Out of Stock</span>
                    <span className="text-xs text-muted-foreground">Items with zero physical stock remaining.</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1 border-t border-error/10">
                    <div className="flex items-center gap-1.5 badge badge-error w-24 justify-center shrink-0">
                      Urgent <InfoTooltip content="Calculated" iconClassName="w-2.5 h-2.5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        Net Available (Physical + <span className="inline-flex items-center text-blue-500"><ArrowRight className="w-2 h-2 mr-0.5" />In</span> - <span className="inline-flex items-center text-yellow-500"><ArrowLeft className="w-2 h-2 mr-0.5" />Res</span>) &lt; 0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
            position="bottom"
          />
        </div>
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-[0.15em]">Total SKU's</p>
          <h2 className="text-4xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{absoluteTotal}</h2>
        </div>
      </div>

      <div className="card-premium h-[130px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
        <div className="p-2 w-fit rounded-xl bg-success/5 text-success border border-success/10">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-black text-success uppercase tracking-[0.15em]">In Stock</p>
          <h2 className="text-4xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{inStockCount}</h2>
        </div>
      </div>

      <div className="card-premium h-[130px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
        <div className="p-2 w-fit rounded-xl bg-warning/5 text-warning border border-warning/10">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-black text-warning uppercase tracking-[0.15em]">Low Stock</p>
          <h2 className="text-4xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{lowCount}</h2>
        </div>
      </div>

      <div className="card-premium h-[130px] flex items-center border-error/10 bg-white shadow-ambient overflow-hidden p-0 relative">
        <div className="absolute top-4 right-4 z-10">
          <InfoTooltip 
            content={
              <div className="space-y-2">
                <p className="font-black uppercase tracking-widest text-[10px] text-error">Urgent Items</p>
                <p>Items are marked as <strong>Urgent</strong> when your commitments (<span className="text-yellow-600 inline-flex items-center gap-0.5 font-bold"><ArrowLeft className="w-2.5 h-2.5" /> Reserved</span>) exceed your total current stock plus <span className="text-blue-600 inline-flex items-center gap-0.5 font-bold">Incoming <ArrowRight className="w-2.5 h-2.5" /></span> supplies.</p>
                <div className="p-3 bg-error/5 rounded-xl border border-error/10 text-[11px] font-mono leading-relaxed mt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-foreground font-bold">Net</span> = (Physical + <span className="inline-flex items-center text-blue-500"><ArrowRight className="w-2.5 h-2.5 mr-0.5" />Incoming</span>)
                  </div>
                  <div className="flex items-center gap-1 ml-10">
                    - <span className="inline-flex items-center text-yellow-500"><ArrowLeft className="w-2.5 h-2.5 mr-0.5" />Reserved</span>
                  </div>
                  <div className="mt-1 pt-1 border-t border-error/10 text-error font-bold">
                    Urgent if Net &lt; 0
                  </div>
                </div>
              </div>
            }
            position="left"
            iconClassName="text-error/40 hover:text-error"
          />
        </div>

        <div className="flex-1 h-full p-6 flex flex-col justify-center gap-2">
          <div className="p-2 w-fit rounded-full bg-error/5 text-error border border-error/10 shadow-sm">
            <Package className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-error uppercase tracking-[0.15em]">Out of Stock</p>
          <h2 className="text-4xl font-black text-foreground tracking-tighter tabular-nums">{outOfStockCount + urgentCount}</h2>
        </div>

        <div className="w-px h-full bg-border-ghost opacity-40" />

        <div className="flex-1 h-full p-6 flex flex-col justify-center gap-2">
          <div className="p-2 w-fit rounded-full opacity-0">
            <Package className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-error/40 uppercase tracking-[0.15em]">Urgent</p>
          <h2 className="text-2xl font-black text-foreground tracking-tighter tabular-nums opacity-60">{urgentCount}</h2>
        </div>
      </div>
    </div>
  );
}
