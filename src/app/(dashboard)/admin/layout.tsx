import { getSession } from "@/lib/auth";
import { UserRole } from "@/lib/types";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  // If not logged in or not an OWNER, redirect to home
  if (!session || session.role !== UserRole.OWNER) {
    redirect("/");
  }

  return <>{children}</>;
}
