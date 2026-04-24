import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac-utils";
import { UserRole } from "@/lib/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Both Owner and Manager should be able to see the team list
    await requirePermission("users:manage");

    const users = await prisma.user.findMany({
      where: {
        companyId: session.companyId
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        emailAlerts: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only Owner can create new users in this way
    if (session.role !== UserRole.OWNER) {
      return NextResponse.json({ error: "Forbidden: Only Owners can create team members" }, { status: 403 });
    }

    const data = await request.json();
    const { username, password, name, role } = data;

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role as UserRole,
        companyId: session.companyId
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
