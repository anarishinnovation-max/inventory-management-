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
  DollarSign,
  Package,
  ExternalLink,
  ChevronRight,
  Truck,
  CreditCard,
  Box,
  Star
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getVendorDetails(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      purchaseOrders: {
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
      batches: {
        include: {
          inventory: {
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

  if (!vendor || vendor.companyId !== companyId) {
    return null;
  }

  return vendor;
}

export default async function VendorHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const vendor = await getVendorDetails(id, session.companyId);

  if (!vendor) notFound();

  // Calculate Stats
  const totalPurchasedValue = vendor.purchaseOrders.reduce((acc, order) => {
    return acc + order.items.reduce((sum, item) => sum + (item.costPrice * item.quantityOrdered), 0);
  }, 0);

  const totalBatchesReceived = vendor.batches.length;
  const pendingOrders = vendor.purchaseOrders.filter(o => o.status === "PENDING" || o.status === "ORDERED").length;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Link 
            href="/vendors"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Partners
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="heading-xl tracking-tighter">{vendor.name}</h1>
            <span className="badge badge-primary !text-xs py-1 px-3">
              Verified Partner
            </span>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-primary font-black uppercase text-xs tracking-widest">Partner ID:</span>
            <span className="font-mono text-xs">VND-{vendor.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
            <Link 
              href={`/orders/purchase/new?vendorId=${vendor.id}`}
              className="btn btn-primary h-12 px-8 shadow-glow-primary !rounded-xl"
            >
              <ShoppingBag className="w-4 h-4" />
              New Purchase Order
            </Link>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="card-premium p-6 flex flex-col justify-between border-primary/5">
            <div className="p-2 w-fit rounded-lg bg-primary/5 text-primary">
                <DollarSign className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Procurement Value</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">₹{totalPurchasedValue.toLocaleString('en-IN')}</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-success/5">
            <div className="p-2 w-fit rounded-lg bg-success/5 text-success">
                <Truck className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Batches Supplied</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{totalBatchesReceived}</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-warning/5">
            <div className="p-2 w-fit rounded-lg bg-warning/5 text-warning">
                <Box className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Active Orders</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{pendingOrders}</h3>
            </div>
         </div>
         <div className="card-premium p-6 flex flex-col justify-between border-indigo-500/5">
            <div className="p-2 w-fit rounded-lg bg-indigo-500/5 text-indigo-500">
                <CreditCard className="w-4 h-4" />
            </div>
            <div className="mt-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Payment Terms</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tighter uppercase">{vendor.preferredPaymentMode || "Standard"}</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact & Profile */}
        <div className="lg:col-span-1 space-y-8">
           <div className="card-premium !p-8 bg-white/50 space-y-8">
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">Partner Profile</h3>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Business Email</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{vendor.email || "No email provided"}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <Phone className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Primary Contact</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{vendor.contact || "No contact provided"}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border-ghost opacity-50">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-border-ghost flex items-center justify-center text-muted-foreground">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Registered Office</p>
                        <p className="text-sm font-bold text-foreground mt-0.5 leading-relaxed">India (Registry Pending)</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card-premium !p-8 bg-surface-low border-dashed border-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">Supply Reliability</h3>
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border-ghost">
                 <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-success fill-current" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-foreground">A-Grade Supplier</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">Consistent Lead Times</p>
                 </div>
              </div>
           </div>
        </div>

        {/* History Tabs Content */}
        <div className="lg:col-span-2 space-y-10">
           {/* Purchase Orders */}
           <div className="card-premium !p-0 overflow-hidden shadow-ambient">
              <div className="p-8 border-b border-border-ghost flex items-center justify-between bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h3 className="heading-md">Purchase History</h3>
                 </div>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{vendor.purchaseOrders.length} Orders Issued</p>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-low/50">
                       <tr>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">PO Number</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-ghost">
                       {vendor.purchaseOrders.map((order: any) => (
                          <tr key={order.id} className="group hover:bg-surface-low/30 transition-all">
                             <td className="px-8 py-6">
                                <p className="font-mono font-black text-foreground text-sm tracking-tighter">#PO-{order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                             </td>
                             <td className="px-8 py-6">
                                <span className={cn(
                                  "badge !text-xs !px-3 !py-1",
                                  order.status === "PENDING" ? "badge-warning" : "badge-success"
                                )}>
                                   {order.status}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-sm font-black text-foreground tabular-nums tracking-tighter">₹{order.items.reduce((acc: number, item: any) => acc + (item.costPrice * item.quantityOrdered), 0).toLocaleString()}</span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <Link 
                                  href={`/orders/purchase/${order.id}`}
                                  className="p-2.5 rounded-xl bg-surface-low text-muted-foreground hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2 group-hover:shadow-lg"
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </Link>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Supply Logs / Batches */}
           <div className="card-premium !p-0 overflow-hidden shadow-ambient">
              <div className="p-8 border-b border-border-ghost flex items-center gap-3 bg-white">
                 <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                 </div>
                 <h3 className="heading-md">Incoming Supply Logs</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-low/50">
                       <tr>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Arrival Date</th>
                          <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Item Received</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Qty</th>
                          <th className="px-8 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Remaining</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-ghost">
                       {vendor.batches.map((batch: any) => (
                          <tr key={batch.id} className="hover:bg-surface-low/30 transition-all">
                             <td className="px-8 py-6">
                                <p className="text-xs font-black text-foreground">{new Date(batch.purchaseDate).toLocaleDateString()}</p>
                             </td>
                             <td className="px-8 py-6">
                                <p className="text-xs font-bold text-foreground">{batch.inventory.item.name}</p>
                                <p className="text-xs font-black text-muted-foreground uppercase mt-0.5 tracking-widest">{batch.inventory.item.sku}</p>
                             </td>
                             <td className="px-8 py-6 text-right font-black text-foreground text-sm tabular-nums">
                                {batch.quantity}
                             </td>
                             <td className="px-8 py-6 text-right font-black text-primary text-sm tabular-nums">
                                {batch.remainingQty}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
