"use client";

import { clsx, type ClassValue } from "clsx";
import { Clock, Truck, CheckCircle2, LayoutGrid } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PurchaseFilters({
  currentStatus,
}: {
  currentStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const statusOptions = [
    { label: "All Bills", value: "all", icon: LayoutGrid, color: "primary" },
    { label: "Pending", value: "pending", icon: Clock, color: "warning" },
    { label: "Ordered", value: "ordered", icon: Truck, color: "indigo" },
    { label: "Received", value: "received", icon: CheckCircle2, color: "success" },
  ];

  return (
    <div className="card-premium flex flex-col justify-center gap-4 border-primary/5">
      <div className="flex items-center justify-between px-2">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Filter by Status</label>
        {isPending && <span className="text-xs font-bold text-primary animate-pulse tracking-widest uppercase">Syncing...</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {statusOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = currentStatus === opt.value;
          
          return (
            <button
              key={opt.value}
              onClick={() => setFilter("status", opt.value)}
              className={cn(
                "flex items-center gap-2.5 py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all  border",
                isActive 
                  ? opt.color === "primary" ? "bg-primary text-white border-primary shadow-glow" :
                    opt.color === "warning" ? "bg-warning text-white border-warning shadow-md shadow-warning/20" :
                    opt.color === "indigo" ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" :
                    "bg-success text-white border-success shadow-md shadow-success/20"
                  : "bg-white text-muted-foreground border-border-ghost hover:border-primary/30 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", !isActive && "opacity-40")} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


