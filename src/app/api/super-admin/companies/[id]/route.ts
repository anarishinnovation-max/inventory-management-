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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkSuperAdmin();
    const { id } = await params;
    const { name, settings } = await req.json();

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        settings
      }
    });

    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkSuperAdmin();
    const { id } = await params;

    // Check if there are users in the company
    const userCount = await prisma.user.count({ where: { companyId: id } });
    if (userCount > 0) {
      return NextResponse.json({ error: "Cannot delete company with active users. Remove users first." }, { status: 400 });
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
