"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryPaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

export default function InventoryPagination({ 
  totalItems, 
  pageSize, 
  currentPage 
}: InventoryPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  if (totalItems === 0) return null;

  // Simple range of pages to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="p-6 bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className={cn(
        "text-xs font-black uppercase tracking-widest text-muted-foreground transition-opacity",
        isPending && "opacity-50"
      )}>
        Showing <span className="text-foreground">{startItem} to {endItem}</span> of {totalItems} SKUs
      </span>
      
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || isPending}
          className="btn btn-neutral h-9 w-9 !p-0 rounded-xl"
          suppressHydrationWarning
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' ? goToPage(page) : null}
            disabled={page === "..." || isPending}
            className={cn(
              "btn h-9 w-9 !p-0 rounded-xl text-xs font-black uppercase tracking-widest",
              page === currentPage 
                ? "btn-primary" 
                : page === "..." 
                  ? "bg-transparent text-muted-foreground cursor-default border-transparent hover:bg-transparent"
                  : "btn-neutral"
            )}
            suppressHydrationWarning
          >
            {page}
          </button>
        ))}

        <button 
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || isPending}
          className="btn btn-neutral h-9 w-9 !p-0 rounded-xl"
          suppressHydrationWarning
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

