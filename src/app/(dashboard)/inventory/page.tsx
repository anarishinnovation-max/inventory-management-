import InventoryFilters from "@/app/(dashboard)/inventory/InventoryFilters";
import InventoryPagination from "@/app/(dashboard)/inventory/InventoryPagination";
import prisma from "@/lib/prisma";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import InventoryList from "./InventoryList";
import InventorySummary from "./InventorySummary";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventoryDataRaw } from "@/lib/inventory-queries";

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
  avgPrice: number; 
  incomingQty: number;
  quantityReserved: number;
  quantityInTransit: number;
  stocks: MappedStock[];
  updatedAt: Date;
  isUrgent?: boolean;
  isLow?: boolean;
  isOutOfStock?: boolean;
  isPartial?: boolean;
  isOrdered?: boolean;
  isInStock?: boolean;
}

const PAGE_SIZE = 20;

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

  const { 
    items, 
    totalItems, 
    absoluteTotal, 
    totalFilteredQuantity, 
    absoluteTotalQuantity, 
    inStockCount, 
    lowCount, 
    outOfStockCount, 
    urgentCount 
  } = await getInventoryDataRaw(session.companyId, q, status, category, page, PAGE_SIZE);

  const allCategories = await prisma.category.findMany({
    where: session.companyId ? { companyId: session.companyId } : {},
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' }
  });
  const categoryNames = allCategories.map((c: { name: string }) => c.name);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
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
              <span className="text-xs font-black opacity-40 ml-2 group-hover/btn:opacity-100 transition-opacity uppercase tracking-widest hidden md:inline-block">
                ALT + N
              </span>
            </Link>
          )}
        </div>
      </header>

      <InventorySummary
        absoluteTotal={absoluteTotal}
        inStockCount={inStockCount}
        lowCount={lowCount}
        outOfStockCount={outOfStockCount}
        urgentCount={urgentCount}
      />

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
