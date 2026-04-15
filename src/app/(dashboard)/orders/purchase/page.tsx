import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Truck
} from "lucide-react";
import pool from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

async function getPurchaseOrders() {
  const query = `
    SELECT 
      po.*,
      json_build_object('name', v.name) as vendor,
      COALESCE(
        json_agg(
          json_build_object(
            'quantity', poli.quantity,
            'price', poli.price,
            'item', json_build_object(
              'name', i.name,
              'unit', i.unit
            )
          )
        ) FILTER (WHERE poli.id IS NOT NULL),
        '[]'
      ) as items
    FROM "PurchaseOrder" po
    JOIN "Vendor" v ON po."vendorId" = v.id
    LEFT JOIN "POLineItem" poli ON po.id = poli."poId"
    LEFT JOIN "Item" i ON poli."itemId" = i.id
    GROUP BY po.id, v.name
    ORDER BY po."createdAt" DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export default async function PurchaseOrdersPage() {
  const pos = await getPurchaseOrders().catch(() => []);

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="heading-xl">Inbound Procurement</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage purchase orders and monitor goods-in-transit.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          Create Purchase Order
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium flex items-center justify-between !p-6">
           <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Orders</p>
              <p className="text-3xl font-black text-foreground mt-1">{pos.filter(o => o.status === "PENDING").length}</p>
           </div>
           <div className="p-4 rounded-2xl bg-orange-100 text-orange-600">
              <Clock className="w-6 h-6" />
           </div>
        </div>
        <div className="card-premium flex items-center justify-between !p-6">
           <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Dispatched/Ordered</p>
              <p className="text-3xl font-black text-foreground mt-1">{pos.filter(o => o.status === "ORDERED").length}</p>
           </div>
           <div className="p-4 rounded-2xl bg-blue-100 text-blue-600">
              <Truck className="w-6 h-6" />
           </div>
        </div>
        <div className="card-premium flex items-center justify-between !p-6">
           <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fulfilled (GRN)</p>
              <p className="text-3xl font-black text-foreground mt-1">{pos.filter(o => o.status === "RECEIVED").length}</p>
           </div>
           <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="bg-surface-lowest rounded-3xl shadow-ambient border border-border-ghost overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th className="table-cell-header">Order ID</th>
                <th className="table-cell-header">Vendor</th>
                <th className="table-cell-header">Items</th>
                <th className="table-cell-header">Total Value</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header">Date</th>
                <th className="table-cell-header w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ghost">
              {pos.length > 0 ? pos.map((po: any) => {
                const totalValue = po.items.reduce((acc: number, curr: any) => acc + (Number(curr.price) * curr.quantity), 0);
                return (
                  <tr key={po.id} className="hover:bg-surface-low/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-mono font-bold text-muted-foreground">#{po.id.split('-')[0].toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-foreground">{po.vendor.name}</p>
                    </td>
                    <td className="px-8 py-6">
                      {po.items.length === 1 ? (
                         <span className="text-foreground font-medium">{po.items[0].item.name} (+{po.items[0].quantity} {po.items[0].item.unit})</span>
                      ) : (
                         <span className="text-foreground font-medium">{po.items.length} line items</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-bold text-foreground">₹{totalValue.toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "badge-status",
                        po.status === "PENDING" ? "bg-orange-50 text-orange-600 border-orange-100" :
                        po.status === "ORDERED" ? "bg-blue-50 text-blue-600 border-blue-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {po.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                        {po.status === "ORDERED" && <Truck className="w-3 h-3 mr-1" />}
                        {po.status === "RECEIVED" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {po.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-muted-foreground font-medium">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <button className="px-4 py-2 rounded-xl bg-surface-low text-primary font-bold hover:bg-primary/10 transition-all text-xs">
                        Details
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={7} className="px-8 py-32 text-center text-muted-foreground font-medium">
                      No purchase orders generated. Use the '+ Create' button to start procurement.
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
