import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== UserRole.OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { name, role, username } = data;

    // Fetch the target user to ensure they belong to the same company
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser || targetUser.companyId !== session.companyId) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
    }

    // Check if new username is taken
    if (username && username !== targetUser.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        role: role !== undefined ? (role as UserRole) : undefined,
        username: username !== undefined ? username : undefined,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== UserRole.OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


    // Prevent self-deletion
    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser || targetUser.companyId !== session.companyId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
