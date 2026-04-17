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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
            <span>Main</span>
            <span>/</span>
            <span className="text-primary">Inventory</span>
          </nav>
          <h2 className="text-4xl font-black text-foreground tracking-tight">Inventory List</h2>
          <p className="text-muted-foreground mt-2 font-medium">Manage and monitor stock levels across all zones.</p>
        </div>
        <Link href="/inventory/new" className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-primary to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
          <PlusCircle className="w-5 h-5" />
          <span>Add Item</span>
        </Link>
      </div>

      {/* Bento Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InventoryFilters 
          currentStatus={status} 
          currentCategory={category} 
          categories={categoryNames} 
        />
        
        <div className="md:col-span-1 p-6 bg-surface-lowest rounded-4xl shadow-ambient border border-border-ghost flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success transition-transform hover:scale-110">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-3xl font-black text-foreground tracking-tighter">{items.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Found Units</p>
          </div>
        </div>
      </div>

      <InventorySearch defaultValue={q} />

      {/* Data Table */}
      <div className="bg-surface-lowest rounded-4xl shadow-ambient border border-border-ghost overflow-hidden pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-low/30 border-b border-border-ghost">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">SKU</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Quantity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rack</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {items.length > 0 ? items.map((item: MappedItem) => {
                const totalStock = item.totalStock;
                const incomingQty = (item.incomingQty ?? 0) + (item.quantityInTransit ?? 0);
                const reservedQty = item.quantityReserved;
                const netAvailable = (totalStock + incomingQty) - reservedQty;
                
                const isShortage = netAvailable < 0;
                const isPartial = totalStock > 0 && totalStock < reservedQty;
                const isOrdered = incomingQty > 0 && !isShortage;
                const isOutOfStock = totalStock === 0 && incomingQty === 0;
                const isLowStock = !isOrdered && !isShortage && !isPartial && totalStock > 0 && totalStock <= item.minStockLevel;
                const rackLocations = (item.stocks || []).length > 0
                  ? Array.from(new Set(item.stocks.map((s) => s.rack.rackNumber))).join(", ")
                  : (item.totalStock > 0 ? "Inventory" : "N/A");
                return (
                  <tr key={item.id} className="group hover:bg-surface-low/40 transition-colors cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors border border-border-ghost">
                          <ImageIcon className="w-5 h-5 opacity-50 text-foreground group-hover:opacity-100 group-hover:text-primary" />
                        </div>
                        <span className="font-bold text-foreground text-[15px] group-hover:text-primary transition-colors">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-mono font-bold text-muted-foreground">
                       {item.sku}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                         {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col items-end leading-tight">
                         <span className="text-xl font-black text-foreground">{totalStock}</span>
                         {incomingQty > 0 && (
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                             (+{incomingQty} incoming)
                           </span>
                         )}
                         {reservedQty > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-error/60 mt-0.5">
                              {reservedQty} reserved
                            </span>
                         )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                       {rackLocations || "N/A"}
                    </td>
                    <td className="px-8 py-6">
                      {isShortage ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest border border-error/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                          Shortage
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-[10px] font-black uppercase tracking-widest border border-warning/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                          Partial
                        </span>
                      ) : isOrdered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Ordered
                        </span>
                      ) : isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest border border-error/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-[10px] font-black uppercase tracking-widest border border-warning/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <InventoryTableActions 
                        itemId={item.id} 
                        itemName={item.name} 
                        totalStock={totalStock}
                        incomingQty={incomingQty}
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
                         <p className="text-2xl font-black text-foreground">No Inventory Items Found</p>
                         <p className="text-[15px] font-medium mt-2 max-w-sm mx-auto">Start by adding your first SKU to tracking to visualize it here.</p>
                       </div>
                       <Link href="/inventory/new" className="px-6 py-3 bg-foreground text-surface-lowest rounded-xl font-bold shadow-ambient hover:scale-[1.02] active:scale-[0.98] transition-transform">
                         + Create First SKU
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
