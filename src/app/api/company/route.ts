import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const company = await prisma.company.findUnique({
      where: { id: session.companyId }
    });

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== UserRole.OWNER) {
      return NextResponse.json({ error: "Forbidden: Owners only" }, { status: 403 });
    }

    const data = await request.json();
    const { name, settings } = data;

    const updatedCompany = await prisma.company.update({
      where: { id: session.companyId },
      data: {
        name: name !== undefined ? name : undefined,
        settings: settings !== undefined ? settings : undefined,
      }
    });

    return NextResponse.json(updatedCompany);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
