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
    // Note: If this data object doesn't have tenantId, the extension might fail or work depending on how it's handled.
    // For now, ensuring we keep the logic as close to original but formatted.
    const vendor = await prisma.vendor.create({ 
      data: {
        ...data,
        // tenantId is usually passed from the UI or resolved in user-actions.ts
      } 
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
