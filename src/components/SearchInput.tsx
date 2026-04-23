"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  paramName?: string;
}

export default function SearchInput({ 
  defaultValue = "", 
  placeholder = "Search...", 
  paramName = "q" 
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(paramName, term);
    } else {
      params.delete(paramName);
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative flex-1 min-w-[280px]">
      <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isPending ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
      <input 
        type="text" 
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder} 
        className="w-full pl-14 pr-4 py-4 bg-white rounded-2xl shadow-ambient border border-border-ghost outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
        suppressHydrationWarning
      />
    </div>
  );
}
