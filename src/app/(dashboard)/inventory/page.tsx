import InventoryFilters from "@/app/(dashboard)/inventory/InventoryFilters";
import InventoryPagination from "@/app/(dashboard)/inventory/InventoryPagination";
import InventorySearch from "@/app/(dashboard)/inventory/InventorySearch";
import InventoryTableActions from "@/app/(dashboard)/inventory/InventoryTableActions";
import prisma from "@/lib/prisma";
import { ImageIcon, Package, PlusCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface MappedStock {
  id: string;
  quantity: number;
  rack: {
    id: string;
    rackNumber: string;
  };
}

interface MappedItem {
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
}

const PAGE_SIZE = 10;

async function getInventory(q?: string, status?: string, category?: string, page: number = 1) {
  const where: Record<string, unknown> = {
    AND: [
      q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ]
      } : {},
      category && category !== 'all' && category !== 'All Categories' ? {
        category: { name: category }
      } : {},
    ]
  };

  // Fetch all potential matches for q and category first (memory filtering is safer for minStockLevel comparison)
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
      createdAt: 'desc'
    }
  });

  // Map and calculate stock levels
  let mappedItems = allItems.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category?.name || "Uncategorized",
    unit: item.unit,
    minStockLevel: item.minStockLevel ?? 0,
    isCritical: item.isCritical,
    totalStock: (item.stocks || []).length > 0
      ? (item.stocks || []).reduce((acc: number, s) => acc + s.quantity, 0)
      : (item.inventory?.quantityAvailable ?? 0),
    incomingQty: item.inventory?.incomingQty ?? 0,
    quantityReserved: item.inventory?.quantityReserved ?? 0,
    quantityInTransit: item.inventory?.quantityInTransit ?? 0,
    stocks: (item.stocks || []).map((s) => ({
      id: s.id,
      quantity: s.quantity,
      rack: {
        id: s.rack?.id || "unknown",
        rackNumber: s.rack?.rackNumber || "N/A"
      }
    }))
  }));

  // Apply Status Filtering in memory for 100% accuracy against minStockLevel
  if (status && status !== 'all') {
    mappedItems = mappedItems.filter((item) => {
      const total = item.totalStock;
      const incoming = (item.incomingQty ?? 0) + (item.quantityInTransit ?? 0);
      const reserved = item.quantityReserved;
      const netAvailable = (total + incoming) - reserved;

      if (status === 'shortage') return netAvailable < 0;
      if (status === 'partial') return total > 0 && total < reserved;
      if (status === 'low') return total > 0 && total <= item.minStockLevel && netAvailable >= 0;
      if (status === 'instock') return total > item.minStockLevel && total >= reserved;
      if (status === 'outofstock') return total === 0 && incoming === 0;
      if (status === 'ordered') return incoming > 0 && netAvailable >= 0;
      return true;
    });
  }

  const totalItems = mappedItems.length;
  const paginatedItems = mappedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items: paginatedItems, totalItems };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sParams = await searchParams;
  const q = typeof sParams.q === 'string' ? sParams.q : '';
  const status = typeof sParams.status === 'string' ? sParams.status : 'all';
  const category = typeof sParams.category === 'string' ? sParams.category : 'all';
  const page = typeof sParams.page === 'string' ? parseInt(sParams.page) : 1;

  const { items, totalItems } = await getInventory(q, status, category, page).catch((e) => {
    console.error("DEBUG: Inventory fetch error:", e);
    return { items: [], totalItems: 0 };
  });

  const allCategories = await prisma.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } });
  const categoryNames = allCategories.map(c => c.name);

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Stock</span>
          </nav>
          <h2 className="heading-xl">Stock List</h2>
          <p className="text-muted-foreground mt-2 font-medium">See all your items and how many are left.</p>
        </div>
        <Link href="/inventory/new" className="btn-primary shadow-glow">
          <PlusCircle className="w-4 h-4" />
          <span>Add New Item</span>
        </Link>
      </div>

      {/* Bento Stats & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InventoryFilters
          currentStatus={status}
          currentCategory={category}
          categories={categoryNames}
        />

        <div className="md:col-span-1 card-premium flex items-center gap-5 !p-6">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success transition-transform hover:rotate-12">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground tracking-tight">{items.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Items Found</p>
          </div>
        </div>
      </div>

      <InventorySearch defaultValue={q} />

      {/* Data Table */}
      <div className="card-premium !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Item Name & SKU</th>
                <th className="table-cell-header">Category</th>
                <th className="table-cell-header text-right">Amount</th>
                <th className="table-cell-header">Where it is</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {items.length > 0 ? items.map((item: MappedItem) => {
                const totalStock = item.totalStock;
                const incomingQty = (item.incomingQty ?? 0) + (item.quantityInTransit ?? 0);

                // Reliability logic based on physical on-hand stock and availability
                const netAvailable = (totalStock + incomingQty) - (item.quantityReserved || 0);
                const isUrgent = netAvailable < 0;
                const isShortage = totalStock <= 0;
                const isOrdered = incomingQty > 0;
                const isLowStock = !isOrdered && totalStock > 0 && totalStock <= item.minStockLevel;
                const rackLocations = (item.stocks || []).length > 0
                  ? Array.from(new Set(item.stocks.map((s) => s.rack.rackNumber))).join(", ")
                  : (item.totalStock > 0 ? "General" : "N/A");
                return (
                  <tr key={item.id} className="group hover:bg-surface-low/30 transition-colors cursor-pointer border-b border-border-ghost last:border-0">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground border border-border-ghost transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                          <ImageIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{item.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="badge bg-indigo-50/50 text-indigo-600 border-indigo-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-black tracking-tight ${isUrgent || isShortage ? "text-error" : isLowStock ? "text-warning" : "text-success"
                          }`}>
                          {totalStock} <span className="text-[10px] font-medium text-muted-foreground ml-1">{item.unit}</span>
                        </span>
                        {incomingQty > 0 && (
                          <span className="text-[9px] font-black uppercase tracking-tight text-primary mt-1">
                            +{incomingQty} Ordered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-muted-foreground bg-surface-low px-2 py-1 rounded-md">
                        {rackLocations || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {isUrgent ? (
                        <span className="badge bg-error text-white border-error shadow-[0_0_12px_oklch(0.55_0.2_25_/_0.2)]">
                          Urgent
                        </span>
                      ) : isShortage ? (
                        <span className="badge bg-error/10 text-error border-error/20 ring-4 ring-error/5">
                          Out of Stock
                        </span>
                      ) : isOrdered ? (
                        <span className="badge bg-primary/5 text-primary border-primary/10">
                          Ordered
                        </span>
                      ) : isLowStock ? (
                        <span className="badge bg-warning/10 text-warning border-warning/20 italic">
                          Low Stock
                        </span>
                      ) : (
                        <span className="badge bg-success/10 text-success border-success/20">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <InventoryTableActions
                        itemId={item.id}
                        itemName={item.name}
                        totalStock={totalStock}
                        incomingQty={incomingQty}
                        minStockLevel={item.minStockLevel || 0}
                      />
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-6 rounded-3xl bg-surface-low border border-border-ghost">
                        <Package className="w-16 h-16 opacity-20" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-foreground">No Items Found</p>
                        <p className="text-[15px] font-medium mt-2 max-w-sm mx-auto">Add your first item here to see it on the list.</p>
                      </div>
                      <Link href="/inventory/new" className="px-6 py-3 bg-foreground text-surface-lowest rounded-xl font-bold shadow-ambient hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        + Add First Item
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <InventoryPagination
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        currentPage={page}
      />
    </div>
  );
}
