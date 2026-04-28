import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { History, Clock, User, Filter, ArrowUpRight, ChevronRight, Activity, Search } from "lucide-react";
import ActivityLogList from "./ActivityLogList";
import { ActivityLogFilters } from "./ActivityLogFilters";

export const dynamic = "force-dynamic";

async function getActivityData(companyId: string, searchParams: any) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    companyId
  };

  if (searchParams.actionType && searchParams.actionType !== 'all') {
    where.actionType = searchParams.actionType;
  }
  if (searchParams.entityType && searchParams.entityType !== 'all') {
    where.entityType = searchParams.entityType;
  }
  if (searchParams.performedBy && searchParams.performedBy !== 'all') {
    where.performedBy = searchParams.performedBy;
  }

  if (searchParams.q) {
    where.OR = [
      { performedByName: { contains: searchParams.q, mode: 'insensitive' } },
      { entityId: { contains: searchParams.q, mode: 'insensitive' } }
    ];
  }

  const [logs, total] = await Promise.all([
    (prisma as any).activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    (prisma as any).activityLog.count({ where })
  ]);

  return { logs, total, page, limit };
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === 'EMPLOYEE') redirect("/");

  const sParams = await searchParams;
  const { logs, total, page, limit } = await getActivityData(session.companyId, sParams);

  const users = await prisma.user.findMany({
    where: { companyId: session.companyId },
    select: { id: true, name: true }
  });

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <span>Audit</span>
            <span className="opacity-30">/</span>
            <span className="text-primary">Full Activity Log</span>
          </nav>
          <h1 className="heading-xl tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-2 font-medium">Tracking every change and operation across your system.</p>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="card-premium h-[120px] flex flex-col justify-between group border-primary/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-lg bg-primary/5 text-primary border border-primary/10">
                <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">Total Operations</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter">{total}</h2>
            </div>
        </div>

        <div className="card-premium h-[120px] flex flex-col justify-between group border-success/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-lg bg-success/5 text-success border border-success/10">
                <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-success uppercase tracking-[0.15em]">System Health</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter">100%</h2>
            </div>
        </div>

        <div className="card-premium h-[120px] flex flex-col justify-between group border-warning/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-lg bg-warning/5 text-warning border border-warning/10">
                <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-warning uppercase tracking-[0.15em]">Last Action</p>
              <h2 className="text-[11px] font-black text-foreground mt-1 uppercase tracking-widest truncate">
                {logs[0] ? new Date(logs[0].createdAt).toLocaleTimeString() : 'N/A'}
              </h2>
            </div>
        </div>

        <div className="card-premium h-[120px] flex flex-col justify-between group border-indigo-500/10 bg-white shadow-ambient">
            <div className="p-2 w-fit rounded-lg bg-indigo-500/5 text-indigo-500 border border-indigo-500/10">
                <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">Active Actors</p>
              <h2 className="text-2xl font-black text-foreground mt-1 tracking-tighter">{users.length}</h2>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <ActivityLogFilters users={users} />
        
        <ActivityLogList 
          logs={JSON.parse(JSON.stringify(logs))} 
          total={total}
          currentPage={page}
          pageSize={limit}
        />
      </div>
    </div>
  );
}
