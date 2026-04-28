"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { getSession, logout } from "./auth";
import { UserRole } from "./types";
import { isOwner } from "./rbac-utils";
import { redirect } from "next/navigation";

export async function updateUserSettings(data: { emailAlerts?: boolean, twoFactorEnabled?: boolean }) {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error("Unauthorized");
  }

  await (prisma as any).user.update({
    where: { id: session.id },
    data: data,
  });

  revalidatePath("/settings");
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  // Only an OWNER can change roles
  if (!(await isOwner())) {
    throw new Error("Unauthorized: Only an OWNER can change roles.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin");
}

export async function createCustomer(data: { name: string, contact?: string, email?: string, address?: string }) {
  const customer = await (prisma as any).customer.create({
    data: data
  });

  revalidatePath("/customers");
  return customer;
}

export async function createVendor(data: { name: string, contact?: string, email?: string, preferredPaymentMode?: string }) {
  const vendor = await (prisma as any).vendor.create({
    data: data
  });

  revalidatePath("/vendors");
  return vendor;
}

import bcrypt from "bcryptjs";
import { login } from "./auth";

export async function handleLogout() {
  await logout();
  redirect("/login");
}

export async function handleLoginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Missing fields" };
  }

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return { error: "Invalid credentials" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Invalid credentials" };
  }

  await login(user.id, user.username, user.role as UserRole, user.companyId);
  if (user.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  } else {
    redirect("/");
  }
}
