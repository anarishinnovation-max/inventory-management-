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
  Download,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import SearchInput from "@/components/SearchInput";
import AdvancedPurchaseFilters from "./components/AdvancedPurchaseFilters";
import PurchaseOrdersTable from "./components/PurchaseOrdersTable";

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
  const [vendors, itemsRaw] = await Promise.all([
    prisma.vendor.findMany({ 
      where: { companyId: session.companyId }, 
      select: { id: true, name: true }, 
      orderBy: { name: 'asc' } 
    }),
    prisma.item.findMany({ 
      where: { companyId: session.companyId }, 
      select: { 
        id: true, 
        name: true,
        unit: true,
        inventory: {
          select: {
            quantityAvailable: true
          }
        }
      }, 
      orderBy: { name: 'asc' } 
    }),
  ]);

  const items = itemsRaw.map(i => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    quantity: i.inventory?.quantityAvailable ?? 0
  }));

  // Calculate stats for the KPI grid
  const allPos = await prisma.purchaseOrder.findMany({ where: { companyId: session.companyId }, select: { status: true } });
  const pendingCount = allPos.filter(o => o.status.toUpperCase() === "PENDING").length;
  const orderedCount = allPos.filter(o => o.status.toUpperCase() === "ORDERED").length;
  const unpaidCount = 0; // Removed payment tracking

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
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
            <span className="text-xs font-black opacity-40 ml-2 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest hidden md:inline-block">
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
              <p className="text-xs font-black text-warning uppercase tracking-[0.15em]">Stock Pending</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{pendingCount}</h2>
           </div>
        </div>
        
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
           <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
              <Truck className="w-5 h-5" />
           </div>
           <div>
              <p className="text-xs font-black text-primary uppercase tracking-[0.15em]">In Transit</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{orderedCount}</h2>
           </div>
        </div>
      </div>

      <AdvancedPurchaseFilters 
        vendors={vendors}
        items={items}
        currentFilters={filters}
      />

      <PurchaseOrdersTable 
        pos={pos} 
        currentPage={1} 
        totalPages={1} 
      />
    </div>
  );
}
