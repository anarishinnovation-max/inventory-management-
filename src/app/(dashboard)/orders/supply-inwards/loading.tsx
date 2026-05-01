import { Loader2, Package, Truck, CheckCircle2, Users } from "lucide-react";

export default function SupplyInwardsLoading() {
  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-surface-low rounded-lg animate-pulse" />
          <div className="h-10 w-64 bg-surface-low rounded-xl animate-pulse" />
          <div className="h-4 w-80 bg-surface-low rounded-lg animate-pulse" />
        </div>
      </header>

      {/* Stats Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[Package, Truck, CheckCircle2, Users].map((Icon, i) => (
          <div key={i} className="card-premium h-[140px] flex flex-col justify-between border-border-ghost bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-surface-low text-muted-foreground/20 border border-border-ghost">
              <Icon className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-surface-low rounded animate-pulse" />
              <div className="h-8 w-12 bg-surface-low rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* List Skeleton */}
      <div className="card-premium !p-0 border-border-ghost shadow-ambient overflow-hidden bg-white">
        <div className="p-8 border-b border-border-ghost bg-surface-low/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="h-8 w-48 bg-white rounded-xl border border-border-ghost animate-pulse" />
            <div className="flex items-center gap-4">
               <div className="h-10 w-32 bg-white rounded-xl border border-border-ghost animate-pulse" />
               <div className="h-10 w-32 bg-white rounded-xl border border-border-ghost animate-pulse" />
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between py-4 border-b border-border-ghost last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-low animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-surface-low rounded animate-pulse" />
                  <div className="h-3 w-24 bg-surface-low rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="space-y-2 text-right">
                  <div className="h-3 w-16 bg-surface-low rounded animate-pulse ml-auto" />
                  <div className="h-4 w-12 bg-surface-low rounded animate-pulse ml-auto" />
                </div>
                <div className="h-10 w-24 bg-surface-low rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Synchronizing Inventory Data...</p>
        </div>
      </div>
    </div>
  );
}
