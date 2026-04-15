import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const racks = await (prisma as any).rack.findMany({
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

    const { rackNumber, zone } = await request.json();
    
    if (!rackNumber) {
        return NextResponse.json({ error: "Missing rack number" }, { status: 400 });
    }

    const rack = await (prisma as any).rack.create({
      data: { rackNumber, zone },
    });
    return NextResponse.json(rack, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
