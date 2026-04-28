
"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export default function PrintButton({ 
  label = "Print Bill", 
  className = "btn btn-primary h-12 px-6 rounded-xl flex items-center gap-2" 
}: PrintButtonProps) {
  return (
    <button 
      onClick={() => window.print()}
      className={className}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
