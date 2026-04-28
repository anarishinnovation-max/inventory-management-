import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import { Star } from "lucide-react";
import {
  Calendar,
  ChevronRight,
  MapPin,
  MoreVertical,
  Users
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import SearchInput from "@/components/SearchInput";
import { CustomerModal } from "./CustomerModal";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getCustomersWithStats(query?: string, companyId?: string) {
  if (!companyId) return [];

  const where: any = { companyId };
  if (query) {
    where.name = { contains: query, mode: "insensitive" };
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      transactions: {
        select: {
          id: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    contact: c.contact,
    address: c.address,
    totalTransactions: c.transactions.length,
    lastInteraction: c.transactions[0]?.createdAt || null
  }));
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q } = await searchParams;
  const customers = await getCustomersWithStats(q, session.companyId).catch((e) => {
    console.error("Failed to fetch customers:", e);
    return [];
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Home</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">CRM</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Customer Ledger</h1>
          <p className="text-muted-foreground mt-2 font-medium">Tracking relationship history and order distributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-80">
            <SearchInput
              defaultValue={q}
              placeholder="Search by Name or Email..."
            />
          </div>
          {(session.role === 'OWNER' || session.role === 'MANAGER') && <CustomerModal />}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="heading-md uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            Active Clients
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {customers.map((customer: any) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="p-4 card-premium group hover:border-primary/30 transition-all cursor-pointer bg-white/50 block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{customer.name}</p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest truncate">{customer.email || customer.contact || "No contact"}</p>
                  </div>
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    {customer.name[0]}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="badge badge-primary">
                    {customer.totalTransactions} Orders
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
            {customers.length === 0 && <p className="text-center py-10 text-[10px] font-black text-muted-foreground uppercase tracking-widest">No customers found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="heading-md flex items-center gap-3">
              Customer Registry
            </h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-surface-low text-muted-foreground transition-all border border-transparent hover:border-border-ghost">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell-header">Customer</th>
                    <th className="table-cell-header">Contact Details</th>
                    <th className="table-cell-header">Location</th>
                    <th className="table-cell-header">Relationship</th>
                    <th className="table-cell-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ghost">
                  {customers.length > 0 ? customers.map((c: any) => (
                    <tr key={c.id} className="table-row group">
                      <td className="table-cell">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-primary/20 text-xs">
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{c.name}</p>
                            <p className="text-[9px] font-black text-muted-foreground mt-0.5 uppercase tracking-widest">IDX-{c.id.slice(0, 4).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-xs font-bold text-foreground">
                        {c.contact || "—"}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-start gap-2 text-muted-foreground group-hover:text-foreground transition-colors max-w-[200px]">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                          <span className="text-xs font-medium line-clamp-1">{c.address || "No address yet"}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground">{c.totalTransactions} Orders</span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Lifetime value</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          className="btn btn-neutral h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:text-primary transition-all border border-border-ghost"
                        >
                          View History
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="table-cell text-center text-muted-foreground py-40">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <Users className="w-16 h-16" />
                          <p className="text-2xl font-black text-foreground">No customers found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-premium flex items-center gap-5 group border-primary/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform  shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tighter">{customers.length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total Customers</p>
              </div>
            </div>
            <div className="card-premium flex items-center gap-5 group border-success/5">
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform  shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground tracking-tighter">
                  {customers.filter((c: any) => c.totalTransactions > 0).length}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Active Customers</p>
              </div>
            </div>
            <div className="card-premium bg-error/[0.02] border-error/5 flex items-center gap-5 group">
              <div className="w-12 h-12 rounded-xl bg-error text-white flex items-center justify-center transition-transform group-hover:rotate-12 shadow-lg shadow-error/10">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-error tracking-tighter">
                  {customers.filter((c: any) => {
                    const last = c.lastInteraction ? new Date(c.lastInteraction) : null;
                    if (!last) return false;
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return last < thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-error/60 mt-1">Not visited recently</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

