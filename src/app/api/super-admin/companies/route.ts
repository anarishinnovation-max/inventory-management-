import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/types";

async function checkSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function GET() {
  try {
    await checkSuperAdmin();
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(companies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await checkSuperAdmin();
    const { name, settings } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        settings: settings || {}
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
