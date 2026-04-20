"use client";

import { Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (searchTerm === currentQ) return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      
      startTransition(() => {
        router.replace(`?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, router, searchParams]);

  return (
    <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {isPending ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            )}
        </div>
        <input 
            type="text" 
            placeholder="Search accounts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3 bg-surface-lowest border border-border-ghost rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-ambient font-bold text-sm"
        />
    </div>
  );
}
