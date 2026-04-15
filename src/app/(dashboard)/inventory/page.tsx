import { 
  Package, 
  Search, 
  Filter, 
  PlusCircle,
  TrendingUp,
  Image as ImageIcon,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import pool from "@/lib/db";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import InventoryTableActions from "@/app/(dashboard)/inventory/InventoryTableActions";
import InventoryFilters from "@/app/(dashboard)/inventory/InventoryFilters";
import InventorySearch from "@/app/(dashboard)/inventory/InventorySearch";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getInventory(q?: string, status?: string, category?: string) {
  let whereClauses = [];
  let params = [];
  let paramIndex = 1;

  if (q) {
    whereClauses.push(`(i.name ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex})`);
    params.push(`%${q}%`);
    paramIndex++;
  }

  if (category && category !== 'all' && category !== 'All Categories') {
    whereClauses.push(`i.category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT 
      i.id, i.name, i.sku, i.category, i.unit, i."minStockLevel", i."isCritical",
      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'quantity', s.quantity,
            'rack', json_build_object(
              'id', r.id,
              'rackName', r."rackName",
              'shelf', r.shelf,
              'bin', r.bin
            )
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) as stocks
    FROM "Item" i
    LEFT JOIN "Stock" s ON i.id = s."itemId"
    LEFT JOIN "Rack" r ON s."rackId" = r.id
    ${whereSql}
    GROUP BY i.id
    ORDER BY i."updatedAt" DESC
  `;
  
  const result = await pool.query(query, params);
  let items = result.rows;

  // Manual status filtering because it depends on the aggregated stock
  if (status && status !== 'all') {
    items = items.filter((item: any) => {
      const totalStock = item.stocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
      const isLowStock = totalStock <= item.minStockLevel;
      if (status === 'low') return isLowStock;
      if (status === 'instock') return totalStock > 0;
      return true;
    });
  }

  return items;
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

  const items = await getInventory(q, status, category).catch(() => []);

  // Use the unique category set from the database if there's any logic you'd like later
  // Currently, we're returning everything in the template directly
  
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
        <Link href="/inventory/new" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
          <PlusCircle className="w-5 h-5" />
          <span>Add Item</span>
        </Link>
      </div>

      {/* Bento Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InventoryFilters currentStatus={status} currentCategory={category} />
        
        <div className="md:col-span-1 p-6 bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost flex items-center gap-5">
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
      <div className="bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost overflow-hidden pb-4">
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
              {items.length > 0 ? items.map((item:any) => {
                const totalStock = item.stocks.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                const isLowStock = totalStock <= item.minStockLevel;
                const rackLocations = Array.from(new Set(item.stocks.map((s: any) => `${s.rack.rackName}-${s.rack.shelf}${s.rack.bin}`))).join(", ");

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
                       <span className="text-xl font-black text-foreground">{totalStock}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                       {rackLocations || "N/A"}
                    </td>
                    <td className="px-8 py-6">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest border border-error/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
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
                      <InventoryTableActions itemId={item.id} />
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
      <div className="p-6 bg-surface-lowest rounded-[2rem] shadow-ambient border border-border-ghost flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Showing <span className="text-foreground">1 to {Math.min(items.length, 10)}</span> of {items.length} SKUs</span>
        <div className="flex items-center gap-1.5">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low text-muted-foreground disabled:opacity-30 border border-transparent hover:border-border-ghost transition-all" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white text-xs font-black shadow-md hover:brightness-110 transition-all">1</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low text-muted-foreground text-xs font-bold border border-transparent hover:border-border-ghost transition-all">2</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low text-muted-foreground text-xs font-bold border border-transparent hover:border-border-ghost transition-all">3</button>
          <span className="px-2 text-muted-foreground font-bold tracking-widest">...</span>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low text-muted-foreground text-xs font-bold border border-transparent hover:border-border-ghost transition-all">14</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-low text-muted-foreground transition-all border border-transparent hover:border-border-ghost">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
