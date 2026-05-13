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

export async function GET() {
  try {
    await checkSuperAdmin();
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    await checkSuperAdmin();
    const { username, password, name, role, companyId, customPermissions } = await req.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        companyId: role === UserRole.SUPER_ADMIN ? null : companyId,
        customPermissions: customPermissions || []
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
