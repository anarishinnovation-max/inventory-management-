export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rackSchema } from "@/lib/schemas/inventory";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const racks = await prisma.rack.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          rackNumber: true,
          zone: true
        },
        orderBy: { rackNumber: "asc" },
      });
      return NextResponse.json(racks);
    }

    const racks = await prisma.rack.findMany({
      where: { companyId: session.companyId },
      orderBy: { rackNumber: "asc" },
      include: {
        _count: {
          select: { stocks: true }
        }
      }
    });
    return NextResponse.json(racks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      // Allow during development or specific roles
    }

    const body = await request.json();
    const result = rackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { rackNumber, zone } = result.data;

    const rack = await prisma.rack.create({
      data: { 
        rackNumber, 
        zone,
        companyId: session.companyId
      },
    });
    return NextResponse.json(rack, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Rack number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
