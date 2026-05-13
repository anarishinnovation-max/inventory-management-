import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/types";
import bcrypt from "bcryptjs";

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
    const { username, password, name, role, companyId, customPermissions } = await req.json();
    console.log("Updating user:", id, { username, name, role, companyId, customPermissions });

    const data: any = {
      username,
      name,
      role,
      companyId,
      customPermissions
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkSuperAdmin();
    const { id } = await params;

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
