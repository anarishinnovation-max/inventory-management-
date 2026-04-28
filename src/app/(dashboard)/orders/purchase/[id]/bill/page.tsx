"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Printer, Download } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function PurchaseBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch("/api/purchase-orders");
        if (res.ok) {
          const orders = await res.json();
          const found = orders.find((o: any) => o.id === id);
          if (found) {
            setOrder(found);
          }
        }
      } catch (err) {
        showToast("Failed to load bill data.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return <div className="p-20 text-center">Order not found</div>;

  const subTotal = order.items.reduce((acc: number, item: any) => acc + (item.costPrice * item.quantityOrdered), 0);
  const tax = subTotal * 0.05; // Sample 5% tax
  const total = subTotal + tax;

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-[1000px] mx-auto bg-white shadow-2xl p-16 print:shadow-none print:max-w-full">
        {/* Header Controls */}
        <div className="flex justify-end gap-4 mb-8 print:hidden">
          <button 
            onClick={() => window.print()}
            className="btn btn-primary h-12 px-6 rounded-xl flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Bill
          </button>
        </div>

        {/* Bill Content */}
        <div id="bill-content" className="text-slate-800">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-glow-primary">A</div>
                 <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Anarish IMS</h1>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Enterprise Solution</p>
                 </div>
              </div>
              <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-[300px]">
                No 23/2, SBI Colony, Ragavendra Nagar,<br />
                Chennai - 600124
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-6xl font-black text-slate-100 uppercase mb-6">Purchase Order</h1>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">PO No: <span className="text-slate-900 font-black ml-2">2024/PO-{order.id.split('-')[0].toUpperCase()}</span></p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">PO Date: <span className="text-slate-900 font-black ml-2">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg">Vendor</h3>
              <div className="px-4 space-y-2">
                <p className="text-base font-black text-slate-900">{order.vendor?.name}</p>
                <p className="text-sm text-slate-500 font-medium">{order.vendor?.email || "No email provided"}</p>
                <p className="text-sm text-slate-500 font-medium">Contact: {order.vendor?.contact || "N/A"}</p>
                <p className="text-sm text-slate-400 italic">Preferred: {order.paymentMode}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg">Ship To</h3>
              <div className="px-4 space-y-2">
                <p className="text-base font-black text-slate-900">Anarish Warehouse</p>
                <p className="text-sm text-slate-500 font-medium">No 23/2, SBI Colony,</p>
                <p className="text-sm text-slate-500 font-medium">Ragavendra Nagar, Chennai - 600124</p>
                <p className="text-sm text-slate-500 font-medium">Contact: +91-7869825463</p>
              </div>
            </div>
          </div>

          {/* Logistics Section */}
          <div className="grid grid-cols-4 border border-slate-200 rounded-xl overflow-hidden mb-12">
            {[
              { label: "Requisitioner", value: "Purchase Dept" },
              { label: "Ship via", value: "Road Transport" },
              { label: "F.O.B", value: "On destination" },
              { label: "Shipping terms", value: "Standard" }
            ].map((col, idx) => (
              <div key={idx} className={idx !== 3 ? "border-r border-slate-200" : ""}>
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {col.label}
                </div>
                <div className="px-4 py-3 text-sm font-black text-slate-700">
                  {col.value}
                </div>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <table className="w-full mb-12">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest rounded-tl-xl">S.No</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Product Code</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest">Product Name</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest">Quantity</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest">Rate</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest rounded-tr-xl">Amount</th>
              </tr>
            </thead>
            <tbody className="border-x border-b border-slate-200 divide-y divide-slate-100">
              {order.items.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-700">{item.item.sku}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{item.item.name}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-700 tabular-nums">
                    {item.quantityOrdered} <span className="text-[10px] text-slate-400 font-bold ml-1">{item.item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-700 tabular-nums">₹{item.costPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-primary tabular-nums">₹{(item.costPrice * item.quantityOrdered).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-20">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="font-black text-slate-900 tabular-nums">₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Tax (5%)</span>
                <span className="font-black text-slate-900 tabular-nums">₹{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-black text-primary uppercase tracking-widest">Grand Total</span>
                <span className="font-black text-primary tabular-nums">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-12">
            <div className="max-w-[400px]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4">Terms and conditions:</h4>
              <ul className="text-[11px] text-slate-400 font-medium space-y-2 list-decimal list-inside leading-relaxed">
                <li>We deserve the right to cancel the purchase order anytime before product shipment.</li>
                <li>Invoice raised to us should contain the details of purchase order with date mentioned.</li>
                <li>Delivery should be strictly done within the agreed timeline.</li>
              </ul>
            </div>
            <div className="text-center space-y-20 border-t border-slate-200 pt-12 w-64">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Authorized signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
