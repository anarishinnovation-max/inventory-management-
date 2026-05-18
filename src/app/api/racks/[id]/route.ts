export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rackSchema } from "@/lib/schemas/inventory";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const result = rackSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    // Check if rack exists and belongs to company
    const existing = await prisma.rack.findFirst({
      where: { id, companyId: session.companyId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Rack not found" }, { status: 444 });
    }

    // If changing rack number, check uniqueness
    if (result.data.rackNumber && result.data.rackNumber !== existing.rackNumber) {
      const duplicate = await prisma.rack.findFirst({
        where: {
          rackNumber: result.data.rackNumber,
          companyId: session.companyId,
          NOT: { id }
        }
      });
      if (duplicate) {
        return NextResponse.json({ error: "Rack number already exists" }, { status: 409 });
      }
    }

    const rack = await prisma.rack.update({
      where: { id, companyId: session.companyId },
      data: result.data,
    });

    return NextResponse.json(rack);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Check if rack belongs to company and has active stocks
    const rackWithStocks = await prisma.rack.findUnique({
      where: { id, companyId: session.companyId },
      include: {
        stocks: {
          where: { quantity: { gt: 0 } }
        }
      }
    });

    if (!rackWithStocks) {
      return NextResponse.json({ error: "Rack not found" }, { status: 444 });
    }

    if (rackWithStocks.stocks.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete rack that contains items. Please transfer or adjust stocks first." 
      }, { status: 400 });
    }

    // Clean up empty stocks associated with this rack first to avoid prisma constraint errors
    await prisma.stock.deleteMany({
      where: { rackId: id }
    });

    await prisma.rack.delete({
      where: { id, companyId: session.companyId }
    });

    return NextResponse.json({ success: true, message: "Rack deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
