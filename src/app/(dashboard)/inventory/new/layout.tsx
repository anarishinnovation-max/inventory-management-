import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/types";

export default async function NewItemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // Only Owner and Manager can access this page
  if (!session || (session.role !== UserRole.OWNER && session.role !== UserRole.MANAGER)) {
    redirect("/inventory");
  }

  return <>{children}</>;
}
