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
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
            <span>Procurement</span>
            <span>/</span>
            <span className="text-primary">Purchase Orders</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Inbound Procurement</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Manage supply pipeline and verify inbound logistics.</p>
        </div>
        <Link href="/orders/purchase/new" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-5 h-5" />
          <span>Create Purchase Order</span>
        </Link>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-orange-500/30 transition-all">
           <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 transition-transform group-hover:scale-110">
                 <Clock className="w-6 h-6" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1 rounded-md bg-orange-50 w-fit">Draft/Pending</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">{pendingCount}</h2>
           </div>
        </div>
        
        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-blue-500/30 transition-all">
           <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                 <Truck className="w-6 h-6" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1 rounded-md bg-blue-50 w-fit">Expected Goods</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">{orderedCount}</h2>
           </div>
        </div>

        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-emerald-500/30 transition-all">
           <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                 <CheckCircle2 className="w-6 h-6" />
              </div>
           </div>
           <div className="mt-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 w-fit">Verified Inbound</p>
              <h2 className="text-4xl font-black text-foreground mt-2 tracking-tighter">{receivedCount}</h2>
           </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-lowest rounded-[2.5rem] shadow-ambient border border-border-ghost overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-low/30 border-b border-border-ghost">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supplier Source</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logistics Summary</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Financial Volume</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pipeline Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
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
                  <tr key={po.id} className="group hover:bg-surface-low/40 transition-colors cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center border border-border-ghost group-hover:bg-primary/5 transition-colors">
                           <span className="text-[10px] font-black text-muted-foreground group-hover:text-primary tracking-widest">ID</span>
                        </div>
                        <span className="font-mono font-bold text-foreground text-sm tracking-tighter">#{po.id.split('-')[0].toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground text-[15px] group-hover:text-primary transition-colors">{po.vendor.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Verified Supplier</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        {po.items.length === 1 ? (
                           <div className="flex items-center gap-1.5">
                              <span className="text-foreground font-bold text-sm">{po.items[0].item.name}</span>
                              <span className="text-[10px] font-black text-muted-foreground bg-surface-low px-1.5 py-0.5 rounded-md">+{po.items[0].quantityOrdered} {po.items[0].item.unit}</span>
                           </div>
                        ) : (
                           <span className="text-foreground font-black text-sm">{po.items.length} Primary Line Items</span>
                        )}
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                          Payment: <span className="text-foreground">{paymentMode}</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          ETA: <span className="text-foreground">{expectedDeliveryLabel}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xl font-black text-foreground">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm",
                        status === "PENDING" ? "bg-orange-50 text-orange-600 border-orange-100" :
                        status === "ORDERED" ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                        {status === "ORDERED" && <Truck className="w-3.5 h-3.5" />}
                        {(status === "RECEIVED" || status === "DELIVERED") && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {status === "DELIVERED" ? "RECEIVED" : status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-foreground">{formatDate(po.createdAt)}</span>
                         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{formatTime(po.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link href={`/orders/purchase/${po.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-low text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                        <Eye className="w-3 h-3" />
                        Audit Details
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={7} className="px-8 py-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-surface-low border border-border-ghost flex items-center justify-center text-muted-foreground opacity-30">
                          <Truck className="w-10 h-10" />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-foreground tracking-tight">No Active Procurement Records</p>
                          <p className="text-[15px] font-medium text-muted-foreground mt-2 max-w-sm mx-auto">Purchase orders will be indexed here as they are generated for verification.</p>
                        </div>
                        <Link href="/orders/purchase/new" className="px-8 py-3.5 bg-foreground text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform">
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
