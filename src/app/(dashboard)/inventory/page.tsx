import InventoryFilters from "@/app/(dashboard)/inventory/InventoryFilters";
import InventoryPagination from "@/app/(dashboard)/inventory/InventoryPagination";
import SearchInput from "@/components/SearchInput";
import InventoryTableActions from "@/app/(dashboard)/inventory/InventoryTableActions";
import InventoryList from "./InventoryList";
import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { Package, PlusCircle, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import QuickPOButton from "./QuickPOButton";
import { cacheQuery } from "@/lib/cache";

export const dynamic = "force-dynamic";

export interface MappedStock {
  id: string;
  quantity: number;
  rack: {
    id: string;
    rackNumber: string;
  };
}

export interface MappedItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  minStockLevel: number;
  isCritical: boolean;
  totalStock: number;
  avgPrice: number;  incomingQty: number;
  quantityReserved: number;
  quantityInTransit: number;
  stocks: MappedStock[];
  updatedAt: Date;
}

const PAGE_SIZE = 20;

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getInventoryDataRaw(companyId: string, q: string, status: string, category: string, page: number, pageSize: number) {
  const where: any = {
    companyId,
    AND: [
      q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ]
      } : {},
      category && category !== 'all' && category !== 'All Categories' ? {
        category: { name: category, companyId }
      } : {},
    ]
  };

  const allItemsSummary = await prisma.item.findMany({
    where,
    include: {
      category: true,
      inventory: {
        include: {
          batches: true
        }
      },
    },
    orderBy: {
      inventory: { updatedAt: 'desc' }
    }
  });

  // First fetch items with their latest transaction logs if needed
  const itemsWithLogs = await Promise.all(allItemsSummary.map(async (item: any) => {
    let lastLogType = null;
    if (status === 'latest_sent' || status === 'latest_received') {
      const lastLog = await prisma.inventoryTransaction.findFirst({
        where: { itemId: item.id },
        orderBy: { createdAt: 'desc' },
        select: { type: true }
      });
      lastLogType = lastLog?.type;
    }
    return { ...item, lastLogType };
  }));

  const mappedAll = itemsWithLogs.map((item: any) => {
    const total = item.inventory?.quantityAvailable ?? 0;
    const incoming = item.inventory?.incomingQty ?? 0;
    const reserved = item.inventory?.quantityReserved ?? 0;
    const netAvailable = (total + incoming) - reserved;
    
    // Calculate Weighted Average Price
    const batches = item.inventory?.batches || [];
    const totalRemainingInBatches = batches.reduce((acc: number, b: any) => acc + b.quantity, 0);
    const weightedSum = batches.reduce((acc: number, b: any) => acc + (b.quantity * b.costPerUnit), 0);
    const avgPrice = totalRemainingInBatches > 0 ? (weightedSum / totalRemainingInBatches) : 0;

    const isUrgent = netAvailable < 0;
    const isOutOfStock = !isUrgent && total <= 0;
    const isLow = !isUrgent && !isOutOfStock && total > 0 && total <= (item.minStockLevel ?? 0);
    const isPartial = total > 0 && total < reserved;
    const isOrdered = !isUrgent && !isOutOfStock && !isLow && incoming > 0;
    const isInStock = !isUrgent && !isOutOfStock && !isLow && !isOrdered && total > (item.minStockLevel ?? 0);

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      isCritical: item.isCritical,
      minStockLevel: item.minStockLevel ?? 0,
      totalStock: total,
      avgPrice,
      netAvailable,
      incomingQty: incoming,
      quantityReserved: reserved,
      quantityInTransit: item.inventory?.quantityInTransit ?? 0,
      isUrgent,
      isLow,
      isOutOfStock,
      isPartial,
      isOrdered,
      isInStock,
      lastLogType: item.lastLogType,
      category: item.category?.name || "Uncategorized",
      updatedAt: item.inventory?.updatedAt || item.createdAt
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Filter for the main table
  let filteredItems = mappedAll;
  if (status && status !== 'all') {
    filteredItems = mappedAll.filter(item => {
      if (status === 'urgent') return item.isUrgent;
      if (status === 'partial') return item.isPartial;
      if (status === 'low') return item.isLow;
      if (status === 'instock') return item.isInStock;
      if (status === 'outofstock') return item.isOutOfStock || item.isUrgent;
      if (status === 'ordered') return item.isOrdered;
      if (status === 'latest_sent') return item.lastLogType === 'SALE';
      if (status === 'latest_received') return item.lastLogType === 'PURCHASE';
      return true;
    });
  }

  const totalItemsCount = filteredItems.length;
  const totalFilteredQuantity = filteredItems.reduce((acc, item) => acc + item.totalStock, 0);
  const absoluteTotalQuantity = mappedAll.reduce((acc, item) => acc + item.totalStock, 0);
  const pageItemsSlice = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  // Fetch rack details ONLY for current page
  const pageWithStocks = await Promise.all(pageItemsSlice.map(async (item) => {
    const stocks = await prisma.stock.findMany({
      where: { itemId: item.id },
      include: { rack: true }
    });
    return {
      ...item,
      category: item.category,
      stocks: stocks.map(s => ({
        id: s.id,
        quantity: s.quantity,
        rack: {
          id: s.rack?.id || "unknown",
          rackNumber: s.rack?.rackNumber || "N/A"
        }
      }))
    };
  }));

  // Simplified stats for cards and reorder
  const inStockCount = mappedAll.filter(i => i.isInStock || i.isOrdered).length;
  const lowCount = mappedAll.filter(i => i.isLow).length;
  const outOfStockCount = mappedAll.filter(i => i.isOutOfStock).length;
  const urgentCount = mappedAll.filter(i => i.isUrgent).length;

  const reorderPool = mappedAll
    .filter(i => i.isLow || i.isUrgent || i.isOutOfStock)
    .map(i => ({
      id: i.id,
      name: i.name,
      totalStock: i.totalStock,
      minStockLevel: i.minStockLevel
    }));

  return {
    items: pageWithStocks,
    totalItems: filteredItems.length,
    absoluteTotal: mappedAll.length,
    totalFilteredQuantity,
    absoluteTotalQuantity,
    inStockCount,
    lowCount,
    outOfStockCount,
    urgentCount,
    reorderPool
  };
}

const getInventoryData = (companyId: string, q: string, status: string, category: string, page: number, pageSize: number) =>
  cacheQuery(
    () => getInventoryDataRaw(companyId, q, status, category, page, pageSize),
    ["inv-data-v2", companyId, q, status, category, page.toString()],
    30
  )();

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  const status = typeof sParams.status === 'string' ? sParams.status : 'all';
  const category = typeof sParams.category === 'string' ? sParams.category : 'all';
  const page = typeof sParams.page === 'string' ? parseInt(sParams.page) : 1;

  const { items, totalItems, absoluteTotal, totalFilteredQuantity, absoluteTotalQuantity, inStockCount, lowCount, outOfStockCount, urgentCount, reorderPool } = 
    await getInventoryDataRaw(session.companyId, q, status, category, page, PAGE_SIZE);
  
  
  const allCategories = await prisma.category.findMany({ 
    where: { companyId: session.companyId },
    select: { name: true }, 
    orderBy: { name: 'asc' } 
  });
  const categoryNames = allCategories.map((c: { name: string }) => c.name);

  // Reorder pool is already calculated in getInventoryData

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Inventory</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Inventory List</h1>
          <p className="text-muted-foreground mt-2 font-medium">See all your items and how many are left.</p>
        </div>
        <div className="flex items-center gap-3">
            {(session.role === 'OWNER' || session.role === 'MANAGER') && (
              <Link href="/inventory/new" className="btn btn-primary h-12 group/btn">
                <PlusCircle className="w-4 h-4" />
                <span>Add New Item</span>
                <span className="text-[10px] font-black opacity-40 ml-2 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest hidden md:inline-block">
                  ALT + N
                </span>
              </Link>
            )}
        </div>
      </header>

      {/* Stats Row - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium h-[130px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Total SKU's</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{absoluteTotal}</h2>
            </div>
        </div>

        <div className="card-premium h-[130px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-xl bg-success/5 text-success border border-success/10">
                <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-success uppercase tracking-[0.15em]">In Stock</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{inStockCount}</h2>
            </div>
        </div>

        <div className="card-premium h-[130px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-xl bg-warning/5 text-warning border border-warning/10">
                <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Low Stock</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{lowCount}</h2>
            </div>
        </div>

        <div className="card-premium h-[130px] flex flex-col justify-between group border-error/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-xl bg-error/5 text-error border border-error/10">
                <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-error uppercase tracking-[0.15em]">
                Out of Stock {urgentCount > 0 && <span className="opacity-70 font-bold ml-1 text-[8px]">/ Urgent ({urgentCount})</span>}
              </p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter tabular-nums">
                {outOfStockCount + urgentCount}
              </h2>
            </div>
        </div>
      </div>

      {/* Filters Row */}
      <InventoryFilters
        currentStatus={status}
        currentCategory={category}
        categories={categoryNames}
        searchQuery={q}
        filteredCount={totalItems}
        totalCount={absoluteTotal}
        totalFilteredQuantity={totalFilteredQuantity}
        absoluteTotalQuantity={absoluteTotalQuantity}
      />

      <InventoryList items={items ?? []} userRole={session.role} searchQuery={q} />

      <InventoryPagination
        totalItems={totalItems ?? 0}
        pageSize={PAGE_SIZE}
        currentPage={page}
      />
    </div>
  );
}

