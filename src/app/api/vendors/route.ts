export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(vendors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const vendor = await prisma.vendor.create({ 
      data: data
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
