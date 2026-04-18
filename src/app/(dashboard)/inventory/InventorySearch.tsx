"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function InventorySearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isPending ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <input 
          type="text" 
          defaultValue={defaultValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search items, SKU, or Rack..." 
          className="w-full pl-14 pr-4 py-4 bg-surface-lowest rounded-2xl shadow-ambient border border-border-ghost outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
