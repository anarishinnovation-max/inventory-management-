export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get("minimal") === "true";

    if (minimal) {
      const customers = await prisma.customer.findMany({
        where: { companyId: session.companyId },
        select: {
          id: true,
          name: true
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(customers);
    }

    const customers = await prisma.customer.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const customer = await prisma.customer.create({ 
      data: {
        ...data,
        companyId: session.companyId
      }
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
