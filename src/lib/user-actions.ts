"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

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
