import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Truck,
  Eye
} from "lucide-react";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getPurchaseOrders() {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      items: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return orders;
}

export default async function PurchaseOrdersPage() {
  const pos = await getPurchaseOrders().catch(() => []);

  // Calculate stats
  const pendingCount = pos.filter(o => o.status.toUpperCase() === "PENDING").length;
  const orderedCount = pos.filter(o => o.status.toUpperCase() === "ORDERED").length;
  const receivedCount = pos.filter(o => ["RECEIVED", "DELIVERED"].includes(o.status.toUpperCase())).length;

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Procurement</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Supply Chain Flow</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2 font-medium">Coordinate inbound asset flow from verified suppliers.</p>
        </div>
        <Link href="/orders/purchase/new" className="btn-primary shadow-glow">
          <Plus className="w-4 h-4" />
          <span>Onboard PO</span>
        </Link>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium group border-warning/5 bg-warning/[0.01]">
           <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-warning/10 text-warning transition-transform group-hover:scale-110">
                 <Clock className="w-5 h-5" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[9px] font-black text-warning uppercase tracking-widest">Active Drafts</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingCount}</h2>
           </div>
        </div>
        
        <div className="card-premium group border-primary/5 bg-primary/[0.01]">
           <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                 <Truck className="w-5 h-5" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">In Transit</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{orderedCount}</h2>
           </div>
        </div>

        <div className="card-premium group border-success/5 bg-success/[0.01]">
           <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-success/10 text-success transition-transform group-hover:scale-110">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[9px] font-black text-success uppercase tracking-widest">Verified Inbound</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{receivedCount}</h2>
           </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="card-premium !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">PO Identity</th>
                <th className="table-cell-header">Logistics flow</th>
                <th className="table-cell-header text-right">Financial Exposure</th>
                <th className="table-cell-header">Pipeline Status</th>
                <th className="table-cell-header">Timestamp</th>
                <th className="table-cell-header text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {pos.length > 0 ? pos.map((po: any) => {
                const totalValue = po.items.reduce((acc: number, curr: any) => acc + (Number(curr.costPrice) * curr.quantityOrdered), 0);
                const status = po.status.toUpperCase();
                const paymentMode = po.paymentMode || "Cash";
                const expectedDeliveryLabel = po.expectedDelivery
                  ? `${formatDate(po.expectedDelivery)} | ${formatTime(po.expectedDelivery)}`
                  : "Not scheduled";
                
                return (
                  <tr key={po.id} className="group hover:bg-surface-low/30 transition-all cursor-pointer border-b border-border-ghost last:border-0">
                    <td className="px-8 py-5">
                      <div className="flex gap-4 min-w-[200px]">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-low flex items-center justify-center border border-border-ghost group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black text-muted-foreground group-hover:border-primary">
                           ID
                        </div>
                        <div className="flex flex-col">
                           <span className="font-mono font-black text-foreground text-sm tracking-tighter">#{po.id.split('-')[0].toUpperCase()}</span>
                           <span className="font-bold text-foreground text-sm group-hover:text-primary transition-all mt-0.5">{po.vendor.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        {po.items.length === 1 ? (
                           <div className="flex items-center gap-1.5">
                              <span className="text-foreground font-bold text-xs">{po.items[0].item.name}</span>
                              <span className="text-[9px] font-black text-muted-foreground bg-surface-low px-1.5 py-0.5 rounded-md border border-border-ghost">{po.items[0].quantityOrdered} Units</span>
                           </div>
                        ) : (
                           <span className="text-foreground font-black text-xs">{po.items.length} Primary Assets</span>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <span className="opacity-50">PAY:</span> <span className="text-foreground">{paymentMode}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-border-ghost" />
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <span className="opacity-50">ETA:</span> <span className="text-foreground">{po.expectedDelivery ? formatDate(po.expectedDelivery) : 'Unscheduled'}</span>
                            </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-lg font-black text-foreground tracking-tighter">₹{totalValue.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "badge rounded-lg gap-1.5 border-none transition-all group-hover:scale-105",
                        status === "PENDING" ? "bg-warning/10 text-warning shadow-[0_2px_8px_oklch(0.85_0.15_85_/_0.1)]" :
                        status === "ORDERED" ? "bg-primary/10 text-primary shadow-[0_2px_8px_oklch(0.55_0.2_250_/_0.1)]" :
                        "bg-success/10 text-success shadow-[0_2px_8px_oklch(0.65_0.2_150_/_0.1)]"
                      )}>
                        {status === "PENDING" && <Clock className="w-3 h-3" />}
                        {status === "ORDERED" && <Truck className="w-3 h-3" />}
                        {(status === "RECEIVED" || status === "DELIVERED") && <CheckCircle2 className="w-3 h-3" />}
                        {status === "DELIVERED" ? "RECEIVED" : status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-foreground">{formatDate(po.createdAt)}</span>
                         <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{formatTime(po.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/orders/purchase/${po.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-low text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm border border-transparent hover:border-primary">
                        <Eye className="w-3 h-3" />
                        Audit
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={7} className="px-8 py-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-4xl bg-surface-low border border-border-ghost flex items-center justify-center text-muted-foreground opacity-30">
                          <Truck className="w-10 h-10" />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-foreground tracking-tight">No Active Procurement Records</p>
                          <p className="text-[15px] font-medium text-muted-foreground mt-2 max-w-sm mx-auto">Purchase orders will be indexed here as they are generated for verification.</p>
                        </div>
                        <Link href="/orders/purchase/new" className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                          Initialize First PO
                        </Link>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
