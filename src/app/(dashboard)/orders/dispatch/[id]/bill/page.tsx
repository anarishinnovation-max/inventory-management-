
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

async function getOrder(id: string, companyId: string) {
  return await prisma.dispatchOrder.findUnique({
    where: { id, companyId },
    include: {
      customer: true,
      items: {
        include: { item: true }
      }
    }
  });
}

export default async function SaleBillPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const order = await getOrder(id, session.companyId);

  if (!order) notFound();

  const subTotal = order.items.reduce((acc: number, item: any) => acc + (item.sellingPrice * item.quantity), 0);
  const tax = subTotal * 0.12; // Sample 12% GST
  const total = subTotal + tax;

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-[1000px] mx-auto bg-white shadow-2xl p-16 print:shadow-none print:max-w-full">
        {/* Header Controls */}
        <div className="flex justify-end gap-4 mb-8 print:hidden">
          <PrintButton label="Print Sale Bill" />
        </div>

        {/* Bill Content */}
        <div className="text-slate-800">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-glow-success">A</div>
                 <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Anarish IMS</h1>
                    <p className="text-xs font-bold text-success uppercase tracking-[0.2em]">Tax Invoice / Sale Bill</p>
                 </div>
              </div>
              <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-[300px]">
                No 23/2, SBI Colony, Ragavendra Nagar,<br />
                Chennai - 600124
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-6xl font-black text-slate-100 uppercase mb-6">Sale Invoice</h1>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Bill No: <span className="text-slate-900 font-black ml-2">INV-{order.id.split('-')[0].toUpperCase()}</span></p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Date: <span className="text-slate-900 font-black ml-2">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg">Billed From</h3>
              <div className="px-4 space-y-2">
                <p className="text-base font-black text-slate-900">Anarish IMS Private Ltd</p>
                <p className="text-sm text-slate-500 font-medium">GSTIN: 33AAACX9911B1Z2</p>
                <p className="text-sm text-slate-500 font-medium">Email: support@anarish.com</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg">Billed To</h3>
              <div className="px-4 space-y-2">
                <p className="text-base font-black text-slate-900">{order.customer.name}</p>
                <p className="text-sm text-slate-500 font-medium">{order.customer.email || "No email provided"}</p>
                <p className="text-sm text-slate-500 font-medium">{order.customer.address || "Address not provided"}</p>
                <p className="text-sm text-slate-500 font-medium">Contact: {order.customer.contact || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Logistics Section */}
          <div className="grid grid-cols-3 border border-slate-200 rounded-xl overflow-hidden mb-12">
            {[
              { label: "Payment Mode", value: order.paymentMode || "Cash" },
              { label: "Dispatch Date", value: order.status === "dispatched" ? new Date().toLocaleDateString('en-IN') : "Pending" },
              { label: "Transport", value: order.transportMode || "Direct Collection" }
            ].map((col, idx) => (
              <div key={idx} className={idx !== 2 ? "border-r border-slate-200" : ""}>
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400">
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
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest rounded-tl-xl">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest">Item Description</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-widest">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-widest">Price</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-widest rounded-tr-xl">Total</th>
              </tr>
            </thead>
            <tbody className="border-x border-b border-slate-200 divide-y divide-slate-100">
              {order.items.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-700">{item.item.sku}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{item.item.name}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-700 tabular-nums">
                    {item.quantity} <span className="text-xs text-slate-400 font-bold ml-1">{item.item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-700 tabular-nums">₹{item.sellingPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-success tabular-nums">₹{(item.sellingPrice * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-20">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Net Value</span>
                <span className="font-black text-slate-900 tabular-nums">₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest">GST (12%)</span>
                <span className="font-black text-slate-900 tabular-nums">₹{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-center text-lg">
                <span className="font-black text-success uppercase tracking-widest">Final Amount</span>
                <span className="font-black text-success tabular-nums">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-12">
            <div className="max-w-[400px]">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-4">Note:</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                This is a computer generated invoice and does not require a physical signature under the Information Technology Act, 2000. All disputes are subject to Chennai jurisdiction.
              </p>
            </div>
            <div className="text-center space-y-4">
               <div className="w-48 h-12 border-b border-slate-200 mx-auto" />
               <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Authorized signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
