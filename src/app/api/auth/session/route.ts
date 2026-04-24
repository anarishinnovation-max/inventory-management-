import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(null);
  }
  return NextResponse.json({
    id: session.id,
    username: session.username,
    role: session.role,
    companyId: session.companyId
  });
}
