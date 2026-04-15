import { 
  Truck, 
  User, 
  Search, 
  UserPlus,
  ChevronRight,
  Clock,
  CheckCircle2,
  Plus
} from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getDispatchOrders() {
  const orders = await prisma.dispatchOrder.findMany({
    include: {
      customer: true,
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

export default async function DispatchPage() {
  const orders = await getDispatchOrders().catch(() => []);

  // Calculate stats
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const dispatchedCount = orders.filter(o => o.status === "dispatched").length;

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
            <span>Fulfillment</span>
            <span>/</span>
            <span className="text-primary">Dispatch Orders</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Customer Fulfillment</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Manage outbound dispatches and verify customer shipments.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-5 h-5" />
          <span>Create New Dispatch</span>
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-orange-500/30 transition-all">
           <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
                 <Clock className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-orange-600">PENDING PICKING</span>
           </div>
           <div className="mt-8">
              <h2 className="text-4xl font-black text-foreground tracking-tighter">{pendingCount}</h2>
              <p className="text-sm font-bold text-muted-foreground mt-1">Orders awaiting fulfillment</p>
           </div>
        </div>

        <div className="bg-surface-lowest p-8 rounded-[2rem] border border-border-ghost shadow-ambient group hover:border-emerald-500/30 transition-all">
           <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
                 <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-600">COMPLETED</span>
           </div>
           <div className="mt-8">
              <h2 className="text-4xl font-black text-foreground tracking-tighter">{dispatchedCount}</h2>
              <p className="text-sm font-bold text-muted-foreground mt-1">Successfully shipped items</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-surface-lowest rounded-[2.5rem] shadow-ambient border border-border-ghost overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-low/30 border-b border-border-ghost">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recipient</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Line Items</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fulfillment Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ghost">
                    {orders.length > 0 ? orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-surface-low/30 transition-colors group cursor-pointer">
                        <td className="px-8 py-6">
                           <span className="font-mono font-bold text-foreground">#{order.id.split('-')[0].toUpperCase()}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-black text-foreground">{order.customer.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{order.customer.email || "No Email Registered"}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-bold text-foreground">{order.items.length} Units</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className={cn(
                             "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                             order.status === "pending" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                           )}>
                              {order.status}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-bold text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Link href={`/orders/dispatch/${order.id}`} className="px-4 py-2 bg-surface-low text-primary font-black text-[10px] uppercase rounded-xl border border-transparent hover:border-primary/20 transition-all">
                              Manage Dispatch
                           </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-32 text-center text-muted-foreground font-medium italic">
                           No outbound orders found in the registry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
