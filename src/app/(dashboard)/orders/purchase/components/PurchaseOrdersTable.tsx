"use client";

import { useState } from "react";
import { 
  Eye, 
  ChevronRight, 
  X, 
  Download, 
  Printer,
  Search,
  Package,
  AlertCircle,
  Square,
  CheckSquare,
  MinusSquare
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface PurchaseOrderTableProps {
  pos: any[];
  currentPage: number;
  totalPages: number;
  selectedIds: Set<string>;
  toggleOne: (id: string) => void;
  toggleAll: () => void;
}

export default function PurchaseOrdersTable({
  pos,
  currentPage,
  totalPages,
  selectedIds,
  toggleOne,
  toggleAll
}: PurchaseOrderTableProps) {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const closePortal = () => setSelectedBillId(null);

  return (
    <div className="space-y-8">
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header w-12 text-center">
                  <button type="button" onClick={toggleAll} className="p-2 hover:bg-surface-low rounded-lg transition-colors group">
                    {selectedIds.size === pos.length && pos.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : selectedIds.size > 0 ? (
                      <MinusSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-70 transition-opacity" />
                    )}
                  </button>
                </th>
                <th className="table-cell-header">Order ID</th>
                <th className="table-cell-header">Vendor Details</th>
                <th className="table-cell-header">Line Items</th>
                <th className="table-cell-header text-right">Total Cost</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {pos.length > 0 ? pos.map((po: any) => {
                const totalValue = po.items.reduce((acc: number, curr: any) => acc + (Number(curr.costPrice) * Number(curr.quantityOrdered)), 0);
                const statusLabel = po.status.toUpperCase();
                const isSelected = selectedIds.has(po.id);
                
                return (
                  <tr key={po.id} className={cn("table-row group", isSelected && "bg-primary/[0.03]")}>
                    <td className="table-cell text-center">
                      <button type="button" onClick={() => toggleOne(po.id)} className="p-2 hover:bg-surface-low rounded-lg transition-colors">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-75 transition-opacity" />
                        )}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                         <span className="font-mono font-black text-foreground text-sm tracking-tighter">#{po.id.split('-')[0].toUpperCase()}</span>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{formatDate(po.createdAt)}</span>
                         </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                         <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{po.vendor.name}</span>
                         <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mt-0.5">{po.vendor.email || "Vendor account"}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1.5">
                        {po.items.length === 1 ? (
                           <div className="flex items-center gap-1.5">
                              <span className="text-foreground font-black text-xs">{po.items[0].item.name}</span>
                              <span className="badge badge-neutral !text-xs !px-1.5 !py-0.5">{po.items[0].quantityOrdered} U</span>
                           </div>
                        ) : (
                           <span className="text-foreground font-black text-xs">{po.items.length} Assets</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <span className="text-sm font-black text-foreground tabular-nums tracking-tighter">₹{totalValue.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="table-cell">
                      <span className={cn(
                        "badge !text-xs !px-3 !py-1",
                        statusLabel === "PENDING" || statusLabel === "PARTIAL" ? "badge-warning" :
                        statusLabel === "ORDERED" ? "badge-primary" :
                        "badge-success"
                      )}>
                        {statusLabel === "DELIVERED" ? "RECEIVED" : statusLabel}
                      </span>
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedBillId(po.id)}
                          className="btn btn-neutral h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Bill
                        </button>
                        <Link href={`/orders/purchase/${po.id}`} className="btn btn-primary h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl">
                          <ChevronRight className="w-3.5 h-3.5" />
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <Search className="w-12 h-12" />
                      <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No Matching Bills Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {selectedBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <header className="p-6 border-b border-border-ghost flex items-center justify-between bg-surface-lowest">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Purchase Bill Preview</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order ID: #{selectedBillId.split('-')[0].toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const iframe = document.getElementById('bill-iframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentDocument) {
                      const downloadBtn = iframe.contentDocument.querySelector('button') as HTMLButtonElement;
                      if (downloadBtn) {
                        downloadBtn.click();
                      } else {
                        // Fallback if button not found
                        iframe.contentWindow?.print();
                      }
                    }
                  }}
                  className="btn btn-neutral h-12 px-6 flex items-center gap-2 !rounded-2xl"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button 
                  onClick={closePortal}
                  className="w-12 h-12 rounded-2xl bg-surface-low hover:bg-error/10 hover:text-error transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>
            
            <div className="flex-1 bg-neutral-100 overflow-hidden relative">
              <iframe 
                id="bill-iframe"
                src={`/orders/purchase/${selectedBillId}/bill?iframe=true`} 
                className="w-full h-full border-0"
                title="Bill Preview"
              />
            </div>

            <footer className="p-6 border-t border-border-ghost bg-surface-lowest flex justify-between items-center">
              <p className="text-xs font-medium text-muted-foreground italic">Use the Print button to download this bill as a PDF.</p>
              <button 
                onClick={closePortal}
                className="btn btn-primary h-12 px-10 !rounded-2xl"
              >
                Close Preview
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
