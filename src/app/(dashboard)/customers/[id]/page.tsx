import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  History, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  IndianRupee,
  Package,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getCustomerDetails(customerId: string, companyId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      dispatchOrders: {
        where: { companyId },
        include: {
          items: {
            include: {
              item: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      transactions: {
        where: { companyId },
        include: {
          item: true,
          rack: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!customer || customer.companyId !== companyId) {
    return null;
  }

  return customer;
}

export default async function CustomerHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const customer = await getCustomerDetails(id, session.companyId);

  if (!customer) notFound();

  // Calculate Stats
  const totalSpent = customer.dispatchOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + (Number(item.sellingPrice) * Number(item.quantity)), 0);
  }, 0);

  const totalItemsBought = customer.dispatchOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  }, 0);

  const lastOrder = customer.dispatchOrders[0];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Link 
            href="/customers"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Registry
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="heading-xl tracking-tighter">{customer.name}</h1>
            <span className="badge badge-success !text-xs py-1 px-3">
              Active Client
            </span>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-primary font-black uppercase text-xs tracking-widest">Customer ID:</span>
            <span className="font-mono text-xs">IDX-{customer.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
            <Link 
              href={`/orders/dispatch/new?customerId=${customer.id}`}
              className="btn btn-primary h-12 px-8 shadow-glow-primary !rounded-xl"
            >
              <ShoppingBag className="w-4 h-4" />
              New Sale Order
            </Link>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="card-premium p-6 flex flex-col justify-between border-primary/5">
            <div className="p-2 w-fit rounded-lg bg-primary/5 text-primary">
                <IndianRupee className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Revenue</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">₹{totalSpent.toLocaleString('en-IN')}</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-success/5">
            <div className="p-2 w-fit rounded-lg bg-success/5 text-success">
                <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Orders Count</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{customer.dispatchOrders.length}</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-warning/5">
            <div className="p-2 w-fit rounded-lg bg-warning/5 text-warning">
                <Package className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Items</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{totalItemsBought} U</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-indigo-500/5">
            <div className="p-2 w-fit rounded-lg bg-indigo-500/5 text-indigo-500">
                <Calendar className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Member Since</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact & Profile */}
        <div className="lg:col-span-1 space-y-8">
           <div className="card-premium !p-8 bg-white/50 space-y-8">
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">Contact Profile</h3>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Email Address</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{customer.email || "No email provided"}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <Phone className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Phone Contact</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{customer.contact || "No contact provided"}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Postal Address</p>
                        <p className="text-sm font-bold text-foreground mt-0.5 leading-relaxed">{customer.address || "No address on file"}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-premium !p-8 bg-surface-low border-dashed border-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">Account Health</h3>
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border-ghost">
                 <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-foreground">Verified & Active</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">Regular Procurement</p>
                 </div>
              </div>
           </div>
        </div>

        {/* History Tabs Content */}
        <div className="lg:col-span-2 space-y-10">
           {/* Previous Purchases */}
           <div className="card-premium !p-0 overflow-hidden shadow-ambient">
              <div className="p-8 border-b border-border-ghost flex items-center justify-between bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h3 className="heading-md">Sale History</h3>
                 </div>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{customer.dispatchOrders.length} Sales Issued</p>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-low/50">
                       <tr>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Items</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Total Value</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-ghost">
                       {customer.dispatchOrders.map((order: any) => (
                          <tr key={order.id} className="group hover:bg-surface-low/30 transition-all">
                             <td className="px-8 py-6">
                                <p className="font-mono font-black text-foreground text-sm tracking-tighter">#DO-{order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex -space-x-2 overflow-hidden">
                                   {order.items.slice(0, 3).map((item: any, i: number) => (
                                      <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-surface-low flex items-center justify-center text-xs font-black text-primary shadow-sm" title={item.item.name}>
                                         {item.item.name[0]}
                                      </div>
                                   ))}
                                   {order.items.length > 3 && (
                                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-surface-low flex items-center justify-center text-xs font-black text-primary shadow-sm">
                                         +{order.items.length - 3}
                                      </div>
                                   )}
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-sm font-black text-foreground tabular-nums tracking-tighter">₹{order.items.reduce((acc: number, item: any) => acc + (Number(item.sellingPrice) * Number(item.quantity)), 0).toLocaleString()}</span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <Link 
                                  href={`/orders/dispatch/${order.id}`}
                                  className="p-2.5 rounded-xl bg-surface-low text-muted-foreground hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2 group-hover:shadow-lg"
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </Link>
                             </td>
                          </tr>
                       ))}
                       {customer.dispatchOrders.length === 0 && (
                          <tr>
                             <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground italic text-xs font-medium uppercase tracking-widest opacity-30">
                                No sales recorded for this customer yet.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Ledger / Transactions */}
           <div className="card-premium !p-0 overflow-hidden shadow-ambient">
              <div className="p-8 border-b border-border-ghost flex items-center gap-3 bg-white">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <History className="w-5 h-5" />
                 </div>
                 <h3 className="heading-md">Audit Trail / Transactions</h3>
              </div>
              <div className="p-8 space-y-6">
                 {customer.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-start gap-6 group">
                       <div className="flex flex-col items-center gap-2 pt-1.5">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            tx.type === "dispatch" ? "bg-error" : "bg-primary"
                          )} />
                          <div className="w-px flex-1 bg-border-ghost" />
                       </div>
                       <div className="flex-1 pb-6 border-b border-border-ghost last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                             <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                                {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                             <span className={cn(
                               "text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                               tx.type === "dispatch" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                             )}>
                                {tx.type}
                             </span>
                          </div>
                          <p className="text-sm font-bold text-foreground tracking-tight">
                             {tx.type === "dispatch" ? "Deducted" : "Adjusted"} {Number(tx.quantity)} units of {tx.item.name}
                          </p>
                          {tx.rack && (
                             <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 opacity-30" /> Location: Rack {tx.rack.rackNumber}
                             </p>
                          )}
                       </div>
                    </div>
                 ))}
                 {customer.transactions.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground italic text-xs font-medium uppercase tracking-widest opacity-30">
                       No audit logs available.
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
