import { Prisma } from "@/generated/client";
import prisma from "@/lib/prisma";
import { clsx, type ClassValue } from "clsx";
import {
    CheckCircle2,
    Clock,
    Plus
} from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import DispatchList from "./DispatchList";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDispatchOrders(query?: string, companyId?: string, searchParams?: any) {
  if (!companyId) return [];
  const where: Prisma.DispatchOrderWhereInput = { companyId };
  
  if (query) {
    where.OR = [
      { id: { contains: query, mode: 'insensitive' } },
      { customer: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const sParams: any = await searchParams;
  if (sParams.status && sParams.status !== 'all') {
    where.status = sParams.status;
  }

  const orders = await prisma.dispatchOrder.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return orders;
}

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sParams = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const q = typeof sParams.q === 'string' ? sParams.q : '';
  
  const orders = await getDispatchOrders(q, session.companyId, sParams).catch(() => []);

  // Calculate stats
  const pendingCount = orders.filter((o: any) => o.status === "pending").length;
  const dispatchedCount = orders.filter((o: any) => o.status === "dispatched").length;

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <nav className="flex gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <span>Selling</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Outgoing items</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Selling Bills</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage selling and sending items to customers.</p>
        </div>
        {(session.role === 'OWNER' || session.role === 'MANAGER') && (
          <Link href="/orders/dispatch/new" className="btn btn-primary h-14 px-8 shadow-glow-primary">
              <Plus className="w-5 h-5" />
              <span>New Sale Order</span>
          </Link>
        )}
      </header>

      {/* Stats row */}
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[140px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-warning/5 text-warning border border-warning/10">
                <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-warning uppercase tracking-[0.15em]">Waiting to Send</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{pendingCount}</h2>
            </div>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2.5 w-fit rounded-xl bg-success/5 text-success border border-success/10">
                <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-success uppercase tracking-[0.15em]">Items Sent</p>
              <h2 className="text-3xl font-black text-foreground mt-1 tracking-tighter tabular-nums">{dispatchedCount}</h2>
            </div>
        </div>

        {/* Empty Bento Slots for Balance */}
        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient opacity-40 border-dashed">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Growth Track</p>
        </div>

        <div className="card-premium h-[140px] flex flex-col justify-between group border-primary/5 bg-white shadow-ambient opacity-40 border-dashed">
            <div className="p-2.5 w-fit rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Plus className="w-5 h-5" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Revenue Flow</p>
        </div>
      </div>

      <DispatchList
        items={orders.map((o: any) => ({
          ...o,
          items: o.items.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            sellingPrice: Number(item.sellingPrice),
          })),
        }))}
        searchQuery={q}
        currentStatus={typeof sParams.status === "string" ? sParams.status : "all"}
        role={session.role}
      />
    </div>
  );
}


