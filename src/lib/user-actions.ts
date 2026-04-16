"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function updateUserSettings(data: { emailAlerts?: boolean, twoFactorEnabled?: boolean }) {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.id },
    data: data,
  });

  revalidatePath("/settings");
}

export async function createCustomer(data: { name: string, contact?: string, email?: string, address?: string }) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const customer = await prisma.customer.create({
    data: data
  });

  revalidatePath("/customers");
  return customer;
}

export async function createVendor(data: { name: string, contact?: string, email?: string, preferredPaymentMode?: string }) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const vendor = await prisma.vendor.create({
    data: data
  });

  revalidatePath("/vendors");
  return vendor;
}
