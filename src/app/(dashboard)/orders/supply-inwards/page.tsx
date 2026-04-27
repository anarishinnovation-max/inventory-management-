import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ArrowDownLeft,
  AlertCircle,
  Calendar,
  ChevronRight,
  Users
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import SearchInput from "@/components/SearchInput";
import { SupplyInwardsFilters } from "./SupplyInwardsFilters";
import SupplyInwardsList from "./SupplyInwardsList";

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

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getInwardData(options: { 
  query?: string, 
  vendorId?: string, 
  poNumber?: string, 
  startDate?: string, 
  endDate?: string,
  companyId?: string 
}) {
  const { query, vendorId, poNumber, startDate, endDate, companyId } = options;
  if (!companyId) return { pendingPOs: [], pendingItems: [], recentTransactions: [] };

  const wherePO: Prisma.PurchaseOrderWhereInput = {
    companyId,
    status: { in: ["PENDING", "ORDERED", "PARTIAL"] }
  };

  if (vendorId && vendorId !== 'all') {
    wherePO.vendorId = vendorId;
  }

  if (poNumber) {
    wherePO.id = { contains: poNumber, mode: 'insensitive' };
  }

  if (startDate || endDate) {
    wherePO.orderDate = {};
    if (startDate && startDate.trim() !== "") wherePO.orderDate.gte = new Date(startDate);
    if (endDate && endDate.trim() !== "") wherePO.orderDate.lte = new Date(endDate);
    
    // Clean up if both are empty after trim
    if (Object.keys(wherePO.orderDate).length === 0) delete wherePO.orderDate;
  }

  if (query) {
    wherePO.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { vendor: { name: { contains: query, mode: 'insensitive' } } },
      { items: { some: { item: { name: { contains: query, mode: 'insensitive' } } } } },
      { items: { some: { item: { sku: { contains: query, mode: 'insensitive' } } } } },
    ];
  }

  const [pendingPOs, recentTransactions] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: wherePO,
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
    }),
    prisma.inventoryTransaction.findMany({
      where: {
        companyId,
        type: "PURCHASE",
        OR: query ? [
          { item: { name: { contains: query, mode: 'insensitive' } } },
          { vendor: { name: { contains: query, mode: 'insensitive' } } },
          { referenceId: { contains: query, mode: 'insensitive' } },
        ] : undefined
      },
      include: {
        item: true,
        vendor: true,
        user: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })
  ]);

  // Flatten items for "ordered item" view
  const pendingItems = pendingPOs.flatMap(po => 
    po.items
      .filter(item => item.quantityReceived < item.quantityOrdered)
      .map(item => ({
        ...item,
        vendor: po.vendor,
        poId: po.id,
        expectedDelivery: po.expectedDelivery,
        orderDate: po.orderDate
      }))
  );

  return { pendingPOs, pendingItems, recentTransactions };
}

export default async function SupplyInwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  const vendorId = typeof sParams.vendorId === 'string' ? sParams.vendorId : 'all';
  const poNumber = typeof sParams.poNumber === 'string' ? sParams.poNumber : '';
  const startDate = typeof sParams.startDate === 'string' ? sParams.startDate : '';
  const endDate = typeof sParams.endDate === 'string' ? sParams.endDate : '';
  
  const { pendingPOs, pendingItems, recentTransactions } = await getInwardData({
    query: q,
    vendorId,
    poNumber,
    startDate,
    endDate,
    companyId: session.companyId
  }).catch(() => ({ pendingPOs: [], pendingItems: [], recentTransactions: [] }));

  const totalPendingQty = pendingItems.reduce((acc, item) => acc + (item.quantityOrdered - item.quantityReceived), 0);
  const todayInwardCount = recentTransactions.filter(t => new Date(t.createdAt).getTime() > Date.now() - 86400000).length;

  const vendors = await prisma.vendor.findMany({
    where: { companyId: session.companyId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Inventory</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Supply Inwards</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Supply Inwards</h1>
          <p className="text-muted-foreground mt-2 font-medium">Tracking items currently on the way from vendors.</p>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary transition-colors border border-primary/10">
                <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Pending Orders</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingPOs.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning transition-colors border border-warning/10">
                <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Items in Transit</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{pendingItems.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-success/5 text-success transition-colors border border-success/10">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-success uppercase tracking-[0.15em]">Recent Receipts</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{recentTransactions.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-indigo-500/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-indigo-500/5 text-indigo-500 transition-colors border border-indigo-500/10">
                <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">Active Vendors</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
                {new Set([...pendingPOs.map(po => po.vendorId), ...recentTransactions.map(t => t.vendorId)]).size}
              </h2>
            </div>
        </div>
      </div>

      <SupplyInwardsList 
        items={pendingItems}
        vendors={vendors}
        currentVendorId={vendorId}
        currentPONumber={poNumber}
        currentStartDate={startDate}
        currentEndDate={endDate}
        searchQuery={q}
      />

      {/* Recent Audit Log - Moved to Bottom */}
      <div className="space-y-6 pt-10 border-t border-border-ghost">
        <h3 className="heading-md uppercase tracking-widest flex items-center gap-2 px-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Audit: Recently Received
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTransactions.length > 0 ? recentTransactions.map((tx: any) => (
            <div key={tx.id} className="card-premium p-6 hover:shadow-md transition-all group border-success/10">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-success/5 border border-success/10 flex items-center justify-center text-success shrink-0 transition-colors">
                    <ArrowDownLeft className="w-6 h-6" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <p className="text-sm font-black text-foreground truncate">{tx.item.name}</p>
                       <span className="text-sm font-black text-success">+{tx.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-[10px] font-bold text-muted-foreground truncate">{tx.vendor?.name || 'Unknown'}</p>
                      </div>
                      <div className="badge badge-primary">
                        PO #{tx.referenceId.split('-')[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-ghost">
                       <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                         {formatDate(tx.createdAt)}
                       </span>
                    </div>
                 </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full card-premium p-10 text-center">
               <p className="text-xs text-muted-foreground font-medium">No recent inward activity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

