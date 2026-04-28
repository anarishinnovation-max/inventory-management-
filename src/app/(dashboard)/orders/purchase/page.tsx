import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { clsx, type ClassValue } from "clsx";
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Truck,
  Search,
  CreditCard,
  DollarSign,
  Download
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import SearchInput from "@/components/SearchInput";
import AdvancedPurchaseFilters from "./components/AdvancedPurchaseFilters";

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

function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

import { cacheQuery } from "@/lib/cache";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getPurchaseOrdersRaw(filters: {
  q?: string;
  status?: string;
  vendorId?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}, companyId?: string) {
  if (!companyId) return [];
  const { q, status, vendorId, itemId, startDate, endDate, minAmount, maxAmount } = filters;

  const where: any = {
    companyId,
  };

  const andConditions: any[] = [];

  if (q) {
    andConditions.push({
      OR: [
        { id: { contains: q, mode: 'insensitive' } },
        { vendor: { name: { contains: q, mode: 'insensitive' } } }
      ]
    });
  }

  if (status && status !== 'all') {
    if (status === 'received') {
      andConditions.push({
        status: { in: ['RECEIVED', 'DELIVERED'] }
      });
    } else {
      andConditions.push({
        status: { equals: status.toUpperCase() }
      });
    }
  }

  if (vendorId && vendorId !== 'all') {
    andConditions.push({
      vendorId: { equals: vendorId }
    });
  }

  if (itemId && itemId !== 'all') {
    andConditions.push({
      items: {
        some: {
          itemId: itemId
        }
      }
    });
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      andConditions.push({
        createdAt: dateFilter
      });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const orders = await prisma.purchaseOrder.findMany({
    where,
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

  // Memory filtering for amount range (as total is calculated)
  let filteredOrders = orders;
  if (minAmount || maxAmount) {
    filteredOrders = orders.filter(po => {
      const total = po.items.reduce((acc, curr) => acc + (Number(curr.costPrice) * curr.quantityOrdered), 0);
      const min = minAmount ? Number(minAmount) : -Infinity;
      const max = maxAmount ? Number(maxAmount) : Infinity;
      return total >= min && total <= max;
    });
  }

  return filteredOrders;
}

const getPurchaseOrders = (filters: any, companyId?: string) => getPurchaseOrdersRaw(filters, companyId);

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const filters = {
    q: typeof sParams.q === 'string' ? sParams.q : '',
    status: typeof sParams.status === 'string' ? sParams.status : 'all',

    vendorId: typeof sParams.vendorId === 'string' ? sParams.vendorId : 'all',
    itemId: typeof sParams.itemId === 'string' ? sParams.itemId : 'all',
    startDate: typeof sParams.startDate === 'string' ? sParams.startDate : undefined,
    endDate: typeof sParams.endDate === 'string' ? sParams.endDate : undefined,
    minAmount: typeof sParams.minAmount === 'string' ? sParams.minAmount : undefined,
    maxAmount: typeof sParams.maxAmount === 'string' ? sParams.maxAmount : undefined,
  };

  const pos = await getPurchaseOrders(filters, session.companyId).catch((err) => {
    console.error("Error fetching purchase orders:", err);
    return [];
  });

  // Fetch data for filters
  const [vendors, items] = await Promise.all([
    prisma.vendor.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where: { companyId: session.companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  // Calculate stats for the KPI grid
  const allPos = await prisma.purchaseOrder.findMany({ where: { companyId: session.companyId }, select: { status: true } });
  const pendingCount = allPos.filter(o => o.status.toUpperCase() === "PENDING").length;
  const orderedCount = allPos.filter(o => o.status.toUpperCase() === "ORDERED").length;
  const unpaidCount = 0; // Removed payment tracking

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <span>Purchase Bills</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Financial & Ops</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Purchase Bills</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage procurement, payments, and vendor tracking.</p>
        </div>
        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <Link href="/orders/purchase/new" className="btn btn-primary h-14 px-8 shadow-glow-primary group/btn">
            <Plus className="w-5 h-5" />
            <span>New Purchase Order</span>
            <span className="text-[10px] font-black opacity-40 ml-2 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest hidden md:inline-block">
              ALT + B
            </span>
          </Link>
        )}
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
           <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning border border-warning/10">
              <Clock className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Stock Pending</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{pendingCount}</h2>
           </div>
        </div>
        
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
           <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
              <Truck className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">In Transit</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{orderedCount}</h2>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="flex-1 max-w-3xl">
            <SearchInput 
              defaultValue={filters.q} 
              placeholder="Search by Order ID or Vendor Name..."
            />
          </div>
          <AdvancedPurchaseFilters 
            vendors={vendors}
            items={items}
            currentFilters={filters}
          />
        </div>
      </div>

      <div className="space-y-8">

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
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
                  const totalValue = po.items.reduce((acc: number, curr: any) => acc + (Number(curr.costPrice) * curr.quantityOrdered), 0);
                  const statusLabel = po.status.toUpperCase();
                  
                  return (
                    <tr key={po.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-surface-low flex items-center justify-center border border-border-ghost text-[10px] font-black text-muted-foreground group-hover:border-primary/20 transition-all">PO</div>
                          <div className="flex flex-col">
                             <span className="font-mono font-black text-foreground text-sm tracking-tighter">#{po.id.split('-')[0].toUpperCase()}</span>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{formatDate(po.createdAt)}</span>
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                           <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors">{po.vendor.name}</span>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-0.5">{po.vendor.email || "Vendor account"}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1.5">
                          {po.items.length === 1 ? (
                             <div className="flex items-center gap-1.5">
                                <span className="text-foreground font-black text-xs">{po.items[0].item.name}</span>
                                <span className="badge badge-neutral !text-[8px] !px-1.5 !py-0.5">{po.items[0].quantityOrdered} U</span>
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
                          "badge !text-[9px] !px-3 !py-1",
                          statusLabel === "PENDING" ? "badge-warning" :
                          statusLabel === "ORDERED" ? "badge-primary" :
                          "badge-success"
                        )}>
                          {statusLabel === "PENDING" && <Clock className="w-3 h-3" />}
                          {statusLabel === "ORDERED" && <Truck className="w-3 h-3" />}
                          {(statusLabel === "RECEIVED" || statusLabel === "DELIVERED") && <CheckCircle2 className="w-3 h-3" />}
                          {statusLabel === "DELIVERED" ? "RECEIVED" : statusLabel}
                        </span>
                      </td>

                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/orders/purchase/${po.id}/bill`} 
                            target="_blank"
                            className="btn btn-neutral h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Bill
                          </Link>
                          <Link href={`/orders/purchase/${po.id}`} className="btn btn-primary h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl">
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-30">
                        <Search className="w-12 h-12" />
                        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No Matching Bills Found</p>
                        <Link 
                          href="/orders/purchase"
                          className="btn btn-neutral h-10 px-6 rounded-xl"
                        >
                          Clear All Filters
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
    </div>
  );
}

