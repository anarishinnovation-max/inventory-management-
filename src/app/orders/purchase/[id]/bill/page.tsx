
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

async function getOrder(id: string, companyId: string) {
  return await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: {
      vendor: true,
      items: {
        include: { item: true }
      }
    }
  });
}

export default async function PurchaseBillPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ iframe?: string, download?: string }>
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { iframe } = await searchParams;
  const order = await getOrder(id, session.companyId);

  if (!order) notFound();

  const subTotal = order.items.reduce((acc: number, item: any) => acc + (Number(item.costPrice) * item.quantityOrdered), 0);
  const tax = subTotal * 0.05; // Sample 5% tax
  const total = subTotal + tax;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {iframe !== 'true' && (
        <div className="max-w-[950px] mx-auto mb-8 flex justify-between items-center print:hidden">
          <Link 
            href={`/orders/purchase/${id}`}
            className="btn btn-neutral h-12 px-6 rounded-2xl flex items-center gap-2 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Purchase Order</span>
          </Link>
          <PrintButton 
            label="Download Purchase Bill" 
            className="btn btn-primary h-12 px-8 rounded-2xl flex items-center gap-2 shadow-glow-primary font-black text-xs uppercase tracking-widest"
          />
        </div>
      )}
      <div 
        className="max-w-[950px] mx-auto bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-full rounded-3xl border border-slate-200"
        style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}
      >
        {/* Hidden internal trigger for parent modal */}
        <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <PrintButton />
        </div>

        {/* Bill Content */}
        <div id="bill-content" style={{ padding: '64px', position: 'relative', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
          {/* Top Banner / Accent */}
          <div style={{ height: '8px', width: '100%', backgroundColor: '#2563eb', position: 'absolute', top: 0, left: 0 }} />

          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '64px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '64px', height: '64px', backgroundColor: '#2563eb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '30px' }}>A</div>
                 <div>
                    <h1 style={{ fontSize: '30px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1 }}>Anarish IMS</h1>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.3em', margin: '4px 0 0 0' }}>Supply Chain Intelligence</p>
                 </div>
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, lineHeight: 1.6, maxWidth: '320px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <p style={{ fontWeight: 900, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em', margin: 0 }}>Office Address</p>
                No 23/2, SBI Colony, Ragavendra Nagar,<br />
                Chennai, Tamil Nadu - 600124
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '9999px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                Official Document
              </div>
              <h1 style={{ fontSize: '60px', fontWeight: 600, color: '#f1f5f9', textTransform: 'uppercase', margin: 0, lineHeight: 1, marginBottom: '24px' }}>Purchase</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Order Number</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>#PO-{order.id.split('-')[0].toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Issue Date</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#334155' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', width: '100%', backgroundColor: '#f1f5f9', marginBottom: '48px' }} />

          {/* Parties Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', marginBottom: '64px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '16px', backgroundColor: '#2563eb', borderRadius: '9999px' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0f172a', margin: 0 }}>Vendor Information</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', margin: 0 }}>{order.vendor?.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>{order.vendor?.email || "No email provided"}</p>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>Contact: {order.vendor?.contact || "N/A"}</p>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Payment Terms</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb', margin: 0 }}>{order.paymentMode}</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '16px', backgroundColor: '#2563eb', borderRadius: '9999px' }} />
                <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0f172a', margin: 0 }}>Shipping Destination</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', margin: 0 }}>Anarish Warehouse</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>No 23/2, SBI Colony,</p>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>Ragavendra Nagar, Chennai - 600124</p>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Warehouse Contact</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>+91-7869825463</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '48px', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>#</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Product Code</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Description</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Quantity</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Unit Price</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, idx: number) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 900, color: '#334155' }}>{item.item.sku}</td>
                    <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{item.item.name}</td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 900, color: '#334155' }}>
                      {item.quantityOrdered} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginLeft: '4px' }}>{item.item.unit}</span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 900, color: '#334155' }}>₹{Number(item.costPrice).toLocaleString()}</td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 900, color: '#2563eb' }}>₹{(Number(item.costPrice) * item.quantityOrdered).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '80px' }}>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', maxWidth: '400px' }}>
              <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0f172a', marginBottom: '12px', margin: 0 }}>Logistics Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Ship Via</p>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: '#334155', margin: 0 }}>Road Transport</p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Terms</p>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: '#334155', margin: 0 }}>On destination</p>
                </div>
              </div>
            </div>
            <div style={{ width: '288px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '0 8px' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>Subtotal</span>
                <span style={{ fontWeight: 900, color: '#0f172a' }}>₹{subTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '0 8px' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}>Tax (5%)</span>
                <span style={{ fontWeight: 900, color: '#0f172a' }}>₹{tax.toLocaleString()}</span>
              </div>
              <div style={{ backgroundColor: '#2563eb', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>Total Amount</span>
                <span style={{ fontWeight: 900, color: '#ffffff', fontSize: '20px' }}>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', borderTop: '1px solid #f1f5f9', paddingTop: '48px' }}>
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', margin: 0 }}>Terms & Conditions</h4>
              <ul style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, padding: 0, margin: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '8px' }}>1. Valid for 30 days from the issue date mentioned above.</li>
                <li style={{ marginBottom: '8px' }}>2. Subject to stock availability at the time of processing.</li>
                <li>3. All disputes are subject to Chennai jurisdiction only.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'center' }}>
              <div style={{ width: '100%', borderTop: '2px solid #0f172a', paddingTop: '16px', maxWidth: '200px' }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#0f172a', margin: 0 }}>Authorized Signatory</p>
                <p style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Seal & Signature Required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '10px', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Computer Generated Purchase Order - No Signature Required Unless Specified
      </div>
    </div>
  );
}
