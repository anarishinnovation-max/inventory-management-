"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { getSession, logout } from "./auth";
import { UserRole } from "./types";
import { createActivityLog } from "./logger";
import { isOwner } from "./rbac-utils";
import { redirect } from "next/navigation";

export async function updateUserSettings(data: { emailAlerts?: boolean, twoFactorEnabled?: boolean }) {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error("Unauthorized");
  }

  const oldUser = await (prisma as any).user.findUnique({ where: { id: session.id } });
  const newUser = await (prisma as any).user.update({
    where: { id: session.id },
    data: data,
  });

  await createActivityLog({
    actionType: "UPDATE",
    entityType: "USER",
    entityId: session.id,
    performedBy: session.id,
    performedByName: session.username,
    companyId: session.companyId || "GLOBAL",
    oldValue: oldUser,
    newValue: newUser
  });

  revalidatePath("/settings");
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  // Only an OWNER can change roles
  if (!(await isOwner())) {
    throw new Error("Unauthorized: Only an OWNER can change roles.");
  }

  const oldUser = await prisma.user.findUnique({ where: { id: userId } });
  const newUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  const session = await getSession();
  await createActivityLog({
    actionType: "UPDATE",
    entityType: "USER",
    entityId: userId,
    performedBy: session?.id || "SYSTEM",
    performedByName: session?.username || "SYSTEM",
    companyId: session?.companyId || "GLOBAL",
    oldValue: oldUser,
    newValue: newUser
  });

  revalidatePath("/admin");
}

export async function createCustomer(data: { name: string, contact?: string, email?: string, address?: string }) {
  const session = await getSession();
  if (!session || !session.companyId) throw new Error("Unauthorized");

  const customer = await (prisma as any).customer.create({
    data: {
      ...data,
      companyId: session.companyId
    }
  });

  await createActivityLog({
    actionType: "CREATE",
    entityType: "CUSTOMER",
    entityId: customer.id,
    performedBy: session.id,
    performedByName: session.username,
    companyId: session.companyId,
    newValue: customer
  });

  revalidatePath("/customers");
  return customer;
}

export async function createVendor(data: { name: string, contact?: string, email?: string, preferredPaymentMode?: string }) {
  const session = await getSession();
  if (!session || !session.companyId) throw new Error("Unauthorized");

  const vendor = await (prisma as any).vendor.create({
    data: {
      ...data,
      companyId: session.companyId
    }
  });

  await createActivityLog({
    actionType: "CREATE",
    entityType: "VENDOR",
    entityId: vendor.id,
    performedBy: session.id,
    performedByName: session.username,
    companyId: session.companyId,
    newValue: vendor
  });

  revalidatePath("/vendors");
  return vendor;
}

import bcrypt from "bcryptjs";
import { login } from "./auth";

export async function handleLogout() {
  const session = await getSession();
  if (session) {
    await createActivityLog({
      actionType: "LOGOUT",
      entityType: "USER",
      entityId: session.id,
      performedBy: session.id,
      performedByName: session.username,
      companyId: session.companyId || "GLOBAL",
    });
  }
  await logout();
  redirect("/login");
}

export async function handleLoginAction(formData: FormData) {
  try {
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

    // Pass customPermissions from the user record
    await login(
      user.id, 
      user.username, 
      user.role as UserRole, 
      user.companyId, 
      user.customPermissions
    );

    // Log successful login
    // Log login activity (Wrap in try/catch to prevent login failure if GLOBAL company is missing)
    try {
      await prisma.activityLog.create({
        data: {
          actionType: "LOGIN",
          entityType: "USER",
          entityId: user.id,
          performedBy: user.id,
          performedByName: user.name,
          companyId: user.companyId || "GLOBAL",
        },
      });
    } catch (logError) {
      console.error("Failed to log login activity:", logError);
      // Don't fail the login if logging fails
    }

    if (user.role === "SUPER_ADMIN") {
      redirect("/super-admin");
    } else {
      redirect("/");
    }
  } catch (error: any) {
    // Check if it's a Next.js redirect error and re-throw it
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Critical Login Action Error:", error);
    
    // Check for common Prisma errors
    if (error.code === "P2024") {
      return { error: "Database connection timeout. Please try again." };
    }
    
    return { error: "An unexpected error occurred. Please contact support." };
  }
}
