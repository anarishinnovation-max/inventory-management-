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
  DollarSign
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
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Purchase Bills</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Financial & Ops</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Purchase Bills</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage procurement, payments, and vendor tracking.</p>
        </div>
        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <Link href="/orders/purchase/new" className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20  transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </Link>
        )}
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/5 bg-white shadow-ambient">
           <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning transition-transform  border border-warning/10">
              <Clock className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Stock Pending</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingCount}</h2>
           </div>
        </div>
        
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient">
           <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary transition-transform  border border-primary/10">
              <Truck className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">In Transit</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{orderedCount}</h2>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-4">
        <div className="w-full max-w-3xl">
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

      {/* Main Table Container */}
      <div className="card-premium !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Order ID</th>
                <th className="table-cell-header">Items</th>
                <th className="table-cell-header text-right">Total Cost</th>
                <th className="table-cell-header">Order Status</th>

                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {pos.length > 0 ? pos.map((po: any) => {
                const totalValue = po.items.reduce((acc: number, curr: any) => acc + (Number(curr.costPrice) * curr.quantityOrdered), 0);
                const statusLabel = po.status.toUpperCase();
                const payStatus = "PENDING";
                
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
                           <span className="text-foreground font-black text-xs">{po.items.length} Assets</span>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <span className="opacity-50">DATE:</span> <span className="text-foreground">{formatDate(po.createdAt)}</span>
                            </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-lg font-black text-foreground tracking-tighter">₹{totalValue.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "badge rounded-lg gap-1.5 border-none transition-all",
                        statusLabel === "PENDING" ? "bg-warning/10 text-warning" :
                        statusLabel === "ORDERED" ? "bg-primary/10 text-primary" :
                        "bg-success/10 text-success"
                      )}>
                        {statusLabel === "PENDING" && <Clock className="w-3 h-3" />}
                        {statusLabel === "ORDERED" && <Truck className="w-3 h-3" />}
                        {(statusLabel === "RECEIVED" || statusLabel === "DELIVERED") && <CheckCircle2 className="w-3 h-3" />}
                        {statusLabel === "DELIVERED" ? "RECEIVED" : statusLabel}
                      </span>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <Link href={`/orders/purchase/${po.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-low text-primary font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm border border-transparent hover:border-primary">
                        <Eye className="w-3 h-3" />
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={7} className="px-8 py-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-4xl bg-surface-low border border-border-ghost flex items-center justify-center text-muted-foreground opacity-30">
                          <Search className="w-10 h-10" />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-foreground tracking-tight">No Matching Bills</p>
                          <p className="text-[15px] font-medium text-muted-foreground mt-2 max-w-sm mx-auto">Try adjusting your filters or search query.</p>
                        </div>
                        <Link 
                          href="/orders/purchase"
                          className="px-8 py-3.5 bg-foreground text-white rounded-2xl font-black text-sm shadow-xl  transition-transform"
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
  );
}

