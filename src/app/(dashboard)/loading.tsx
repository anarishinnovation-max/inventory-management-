import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing aura */}
        <div className="absolute w-20 h-20 rounded-full bg-primary/10 blur-xl animate-pulse" />
        
        {/* Modern premium spinning circle */}
        <div className="w-16 h-16 rounded-full border-4 border-surface-low border-t-primary animate-spin shadow-inner" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary animate-pulse">
          Synchronizing Systems
        </h3>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none opacity-60">
          Fetching real-time inventory assets...
        </p>
      </div>
      
      {/* Sleek shimmering progress bar */}
      <div className="w-48 bg-surface-low/50 h-1 rounded-full overflow-hidden relative border border-border-ghost/20">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="bg-primary h-full rounded-full animate-shimmer-loader absolute left-0 shadow-[0_0_8px_oklch(0.55_0.18_250)]" />
      </div>
    </div>
  );
}
