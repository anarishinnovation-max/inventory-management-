"use client";

import { FileDown, PlusSquare } from "lucide-react";
import Link from "next/link";

export function DashboardActions() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3">
      <Link href="/reports">
        <button 
          className="btn-secondary" 
          suppressHydrationWarning
        >
          <FileDown className="w-4 h-4 text-primary" />
          <span>Get Report</span>
        </button>
      </Link>
      <Link href="/inventory/new">
        <button className="btn-primary shadow-glow" suppressHydrationWarning>
          <PlusSquare className="w-4 h-4" />
          <span>Add Inventory</span>
        </button>
      </Link>
    </div>
  );
}
