import { Box } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden animate-in fade-in duration-500">
      {/* Dynamic glowing background circles */}
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-primary/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Brand Logo Loading Container */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-3xl primary-gradient opacity-10 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl primary-gradient flex items-center justify-center shadow-glow animate-bounce" style={{ animationDuration: '2s' }}>
            <Box className="text-white w-8 h-8" />
          </div>
        </div>

        {/* Text Loader */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-lg font-black uppercase tracking-[0.25em] text-foreground leading-none">
            Anarish IMS
          </h2>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none opacity-60">
            Initializing secure runtime...
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-48 bg-surface-low h-1 rounded-full overflow-hidden relative border border-border-ghost/30">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="bg-primary h-full rounded-full animate-shimmer-loader absolute left-0 shadow-[0_0_8px_oklch(0.55_0.18_250)]" />
        </div>
      </div>
    </div>
  );
}
