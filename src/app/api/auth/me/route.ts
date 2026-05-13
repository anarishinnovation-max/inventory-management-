import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { company: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  console.log(`[auth/me] Successfully authenticated user: ${user.username}`);

  return NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name || "Platform Admin",
    customPermissions: user.customPermissions || []
  });
}
