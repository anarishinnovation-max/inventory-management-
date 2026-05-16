export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac-utils";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("vendors:view");

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const vendors = await prisma.vendor.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          name: true,
          preferredPaymentMode: true
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(vendors);
    }

    const vendors = await prisma.vendor.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(vendors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("vendors:create");

    const data = await request.json();
    const vendor = await prisma.vendor.create({ 
      data: {
        ...data,
        companyId: session.companyId
      }
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
