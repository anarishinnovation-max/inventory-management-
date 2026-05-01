"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowRight, ChevronRight } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DiffViewerProps {
  oldValue: any;
  newValue: any;
  changedFields: string[];
}

export default function DiffViewer({ oldValue, newValue, changedFields }: DiffViewerProps) {
  if (!changedFields || changedFields.length === 0) {
    return (
      <div className="py-4 px-6 bg-surface-low rounded-2xl border border-border-ghost italic text-muted-foreground text-xs font-medium">
        No specific data changes recorded for this operation.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {changedFields.map(field => {
        const v1 = oldValue?.[field];
        const v2 = newValue?.[field];

        // Format values for display
        const formatValue = (val: any) => {
          if (val === null || val === undefined) return "None";
          if (typeof val === "boolean") return val ? "Yes" : "No";
          if (typeof val === "object") return JSON.stringify(val);
          return String(val);
        };

        return (
          <div key={field} className="flex flex-col md:flex-row md:items-center gap-4 group/diff">
            <div className="w-full md:w-48 shrink-0">
               <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover/diff:text-primary transition-colors">{field}</span>
            </div>
            
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <div className="flex-1 bg-error/5 border border-error/10 text-error px-4 py-2 rounded-xl text-xs font-bold truncate line-through opacity-60">
                {formatValue(v1)}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-20 shrink-0" />
              <div className="flex-1 bg-success/5 border border-success/10 text-success px-4 py-2 rounded-xl text-xs font-bold truncate shadow-sm">
                {formatValue(v2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

