export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";
import { UserRole } from "@/lib/types";
import { createActivityLog } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Login with company context and Role enum
    await login(user.id, user.username, user.role as UserRole, user.companyId, user.customPermissions);

    // Log action (if not super admin)
    if (user.companyId) {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      
      await createActivityLog({
        actionType: "LOGIN",
        entityType: "USER",
        entityId: user.id,
        performedBy: user.id,
        performedByName: user.name,
        companyId: user.companyId,
        ipAddress: ip,
        userAgent: userAgent
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        companyId: user.companyId,
        customPermissions: user.customPermissions
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
