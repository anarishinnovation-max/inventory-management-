import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const actionType = searchParams.get("actionType");
    const entityType = searchParams.get("entityType");
    const performedBy = searchParams.get("performedBy");
    const query = searchParams.get("q");

    const skip = (page - 1) * limit;

    const where: any = {
      companyId: session.companyId
    };

    if (actionType && actionType !== "all") {
      where.actionType = actionType;
    }

    if (entityType && entityType !== "all") {
      where.entityType = entityType;
    }

    if (performedBy && performedBy !== "all") {
      where.performedBy = performedBy;
    }

    if (query) {
      where.OR = [
        { performedByName: { contains: query, mode: 'insensitive' } },
        { entityId: { contains: query, mode: 'insensitive' } },
        { 
          newValue: {
            path: ['name'],
            string_contains: query
          }
        },
        {
          oldValue: {
            path: ['name'],
            string_contains: query
          }
        }
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

    return NextResponse.json({
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error: any) {
    console.error("Activity log fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
