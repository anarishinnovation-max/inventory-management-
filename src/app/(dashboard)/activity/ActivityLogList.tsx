"use client";

import React, { useState } from "react";
import { TimeDisplay } from "@/components/TimeDisplay";
import { 
  Plus, 
  Edit, 
  Trash2, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Monitor,
  Globe,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  History
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DiffViewer from "./DiffViewer";
import { useRouter, useSearchParams } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActivityLogListProps {
  logs: any[];
  total: number;
  currentPage: number;
  pageSize: number;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  CREATE: { icon: Plus, color: "text-success bg-success/5 border-success/10", label: "Registry" },
  UPDATE: { icon: Edit, color: "text-warning bg-warning/5 border-warning/10", label: "Adjustment" },
  DELETE: { icon: Trash2, color: "text-error bg-error/5 border-error/10", label: "Removal" },
  LOGIN: { icon: LogIn, color: "text-primary bg-primary/5 border-primary/10", label: "Session" },
  LOGOUT: { icon: LogOut, color: "text-muted-foreground bg-surface-low border-border-ghost", label: "Exit" },
  ADJUSTMENT: { icon: RefreshCw, color: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10", label: "Correction" },
};

export default function ActivityLogList({ logs, total, currentPage, pageSize }: ActivityLogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/activity?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border-ghost rounded-[2.5rem] shadow-ambient overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="table-header border-b border-border-ghost">
              <tr>
                <th className="table-cell-header w-16"></th>
                <th className="table-cell-header">Operation</th>
                <th className="table-cell-header">Entity Reference</th>
                <th className="table-cell-header">Performed By</th>
                <th className="table-cell-header">Timestamp</th>
                <th className="table-cell-header text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {logs.length > 0 ? logs.map((log) => {
                const config = ACTION_CONFIG[log.actionType] || { icon: AlertCircle, color: "text-muted-foreground", label: log.actionType };
                const isExpanded = expandedId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr className={cn(
                      "table-row cursor-pointer transition-colors",
                      isExpanded ? "bg-primary/[0.02]" : "hover:bg-surface-low/50"
                    )} onClick={() => toggleExpand(log.id)}>
                      <td className="table-cell text-center">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all", config.color)}>
                           <config.icon className="w-5 h-5" />
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">{config.label}</span>
                          <span className="font-black text-foreground text-sm tracking-tight">{log.actionType}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                           <div className="p-1.5 rounded-lg bg-surface-low border border-border-ghost">
                              <Database className="w-3.5 h-3.5 text-muted-foreground" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-foreground uppercase tracking-tight">{log.entityType}</span>
                              <span className="text-xs font-bold text-muted-foreground font-mono mt-0.5 opacity-50">{log.entityId || "SYSTEM"}</span>
                           </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                              <User className="w-4 h-4" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground tracking-tight">{log.performedByName}</span>
                              <div className="flex items-center gap-2 mt-0.5 opacity-40">
                                 <Monitor className="w-2.5 h-2.5" />
                                 <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[100px]">{log.userAgent?.split(' ')[0] || "Unknown"}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col" suppressHydrationWarning>
                           <span className="text-xs font-black text-foreground">
                              <TimeDisplay date={log.createdAt} format="distance" />
                           </span>
                           <span className="text-xs font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
                              <TimeDisplay date={log.createdAt} />
                           </span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className={cn(
                          "inline-flex p-2 rounded-lg transition-all",
                          isExpanded ? "bg-primary text-white shadow-glow-primary" : "bg-surface-low text-muted-foreground group-hover/row:bg-primary/5 group-hover/row:text-primary"
                        )}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-primary/[0.01]">
                        <td colSpan={6} className="p-0 border-t border-primary/5">
                          <div className="p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                             <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-1 space-y-6">
                                   <div className="flex items-center gap-3">
                                      <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">State Comparison</h4>
                                      <div className="h-px flex-1 bg-primary/10" />
                                   </div>
                                   <DiffViewer 
                                      oldValue={log.oldValue} 
                                      newValue={log.newValue} 
                                      changedFields={log.changedFields} 
                                   />
                                </div>
                                
                                <div className="w-full md:w-72 shrink-0 space-y-6">
                                   <div className="flex items-center gap-3">
                                      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Metadata</h4>
                                      <div className="h-px flex-1 bg-border-ghost" />
                                   </div>
                                   <div className="bg-white border border-border-ghost rounded-2xl p-6 space-y-5 shadow-sm">
                                      <div className="space-y-1.5">
                                         <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> Network Address
                                         </span>
                                         <p className="text-xs font-black text-foreground font-mono">{log.ipAddress || "Internal System"}</p>
                                      </div>
                                      <div className="space-y-1.5">
                                         <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Monitor className="w-3 h-3" /> Client Agent
                                         </span>
                                         <p className="text-xs font-bold text-muted-foreground leading-relaxed italic">{log.userAgent || "SS-IMS Bot"}</p>
                                      </div>
                                      <div className="pt-4 border-t border-border-ghost">
                                         <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Full Event Timestamp</p>
                                         <p className="text-xs font-black text-foreground mt-1"><TimeDisplay date={log.createdAt} format="full" /></p>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <History className="w-16 h-16" />
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">No operations recorded for the current filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
           <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Showing page {currentPage} of {totalPages} ({total} events)
           </p>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn btn-neutral h-10 w-10 p-0 disabled:opacity-20 rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn btn-neutral h-10 w-10 p-0 disabled:opacity-20 rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

