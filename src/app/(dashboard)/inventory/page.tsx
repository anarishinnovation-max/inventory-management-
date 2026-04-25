import InventoryFilters from "@/app/(dashboard)/inventory/InventoryFilters";
import InventoryPagination from "@/app/(dashboard)/inventory/InventoryPagination";
import SearchInput from "@/components/SearchInput";
import InventoryTableActions from "@/app/(dashboard)/inventory/InventoryTableActions";
import InventoryList from "./InventoryList";
import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { Package, PlusCircle, TrendingUp } from "lucide-react";
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
  incomingQty: number;
  quantityReserved: number;
  quantityInTransit: number;
  stocks: MappedStock[];
  updatedAt: Date;
}

const PAGE_SIZE = 20;

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getInventoryRaw(q?: string, status?: string, category?: string, page: number = 1, limit?: number, companyId?: string) {
  if (!companyId) return { items: [], totalItems: 0 };
  
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

  const allItems = await prisma.item.findMany({
    where,
    include: {
      category: true,
      inventory: true,
      stocks: {
        include: {
          rack: true
        }
      }
    },
    orderBy: {
      inventory: {
        updatedAt: 'desc'
      }
    }
  });

  let mappedItems = allItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category?.name || "Uncategorized",
    unit: item.unit,
    minStockLevel: item.minStockLevel ?? 0,
    isCritical: item.isCritical,
    totalStock: (item.stocks || []).length > 0
      ? (item.stocks || []).reduce((acc: number, s: any) => acc + s.quantity, 0)
      : (item.inventory?.quantityAvailable ?? 0),
    incomingQty: item.inventory?.incomingQty ?? 0,
    quantityReserved: item.inventory?.quantityReserved ?? 0,
    quantityInTransit: item.inventory?.quantityInTransit ?? 0,
    stocks: (item.stocks || []).map((s: any) => ({
      id: s.id,
      quantity: s.quantity,
      rack: {
        id: s.rack?.id || "unknown",
        rackNumber: s.rack?.rackNumber || "N/A"
      }
    })),
    updatedAt: item.inventory?.updatedAt || item.createdAt
  }));

  if (status && status !== 'all') {
    mappedItems = mappedItems.filter((item: MappedItem) => {
      const total = item.totalStock;
      const incoming = (item.incomingQty ?? 0) + (item.quantityInTransit ?? 0);
      const reserved = item.quantityReserved;
      const netAvailable = (total + incoming) - reserved;

      if (status === 'urgent') return netAvailable < 0;
      if (status === 'partial') return total > 0 && total < reserved;
      if (status === 'low') return total > 0 && total <= item.minStockLevel && netAvailable >= 0;
      if (status === 'instock') return total > item.minStockLevel && total >= reserved;
      if (status === 'outofstock') return total <= 0;
      if (status === 'ordered') return incoming > 0 && netAvailable >= 0;
      return true;
    });
  }

  const totalItems = mappedItems.length;
  const paginatedItems = limit 
    ? mappedItems.slice((page - 1) * limit, page * limit)
    : mappedItems;

  return { items: paginatedItems, totalItems };
}

const getInventory = (q?: string, status?: string, category?: string, page: number = 1, limit?: number, companyId?: string) => 
  cacheQuery(
    () => getInventoryRaw(q, status, category, page, limit, companyId),
    ["inventory", q || "none", status || "all", category || "all", page.toString(), (limit || 0).toString(), companyId || "none"],
    60
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

  const [
    { items, totalItems },
    { items: allLowItems },
    { items: allUrgentItems },
    { items: allOutOfStockItems }
  ] = await Promise.all([
    getInventory(q, status, category, page, PAGE_SIZE, session.companyId),
    getInventory("", "low", "all", 1, 0, session.companyId),
    getInventory("", "urgent", "all", 1, 0, session.companyId),
    getInventory("", "outofstock", "all", 1, 0, session.companyId)
  ]).catch((e) => {
    console.error("Inventory fetch error:", e);
    return [{ items: [], totalItems: 0 }, { items: [] }, { items: [] }, { items: [] }];
  });
  
  const allCategories = await prisma.category.findMany({ 
    where: { companyId: session.companyId },
    select: { name: true }, 
    orderBy: { name: 'asc' } 
  });
  const categoryNames = allCategories.map((c: { name: string }) => c.name);

  // Combine and deduplicate
  const reorderPool = [...(allLowItems || []), ...(allUrgentItems || []), ...(allOutOfStockItems || [])];
  const uniqueReorderPool = Array.from(new Map(reorderPool.map(item => [item.id, item])).values());

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Inventory</span>
          </nav>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Inventory List</h1>
          <p className="text-muted-foreground mt-2 font-medium">See all your items and how many are left.</p>
        </div>
        <div className="flex items-center gap-3">
            <QuickPOButton items={uniqueReorderPool} />
            {(session.role === 'OWNER' || session.role === 'MANAGER') && (
              <Link href="/inventory/new" className="btn-primary shadow-glow h-14">
                <PlusCircle className="w-4 h-4" />
                <span>Add New Item</span>
              </Link>
            )}
        </div>
      </header>

      {/* Stats row matched with Purchase Bills */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary transition-transform group-hover:scale-110 border border-primary/10">
                <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Total SKU's</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{totalItems}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-error/5 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-error/5 text-error transition-transform group-hover:scale-110 border border-error/10">
                <TrendingUp className="w-5 h-5 rotate-180" />
            </div>
            <div>
              <p className="text-[9px] font-black text-error uppercase tracking-[0.15em]">Urgent Stock</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{allUrgentItems.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/5 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning transition-transform group-hover:scale-110 border border-warning/10">
                <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Low Stock</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{allLowItems.length}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-success/5 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-success/5 text-success transition-transform group-hover:scale-110 border border-success/10">
                <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-success uppercase tracking-[0.15em]">Out of Stock</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter">{allOutOfStockItems.length}</h2>
            </div>
        </div>
      </div>

      {/* Filters Row */}
      <InventoryFilters
        currentStatus={status}
        currentCategory={category}
        categories={categoryNames}
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
