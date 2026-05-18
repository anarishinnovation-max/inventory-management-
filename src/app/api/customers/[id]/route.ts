import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, email, contact, address } = body;

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    // Verify companyId matches and update
    const updatedCustomer = await prisma.customer.update({
      where: { 
        id,
        companyId: session.companyId 
      },
      data: {
        name,
        email: email || null,
        contact: contact || null,
        address: address || null,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error("[CUSTOMER PATCH ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Check for linked dispatch orders
    const ordersCount = await prisma.dispatchOrder.count({
      where: {
        customerId: id,
        companyId: session.companyId,
      },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete customer. They are linked to ${ordersCount} historical dispatch order(s).` },
        { status: 400 }
      );
    }

    // Check for linked transactions
    const transactionsCount = await prisma.inventoryTransaction.count({
      where: {
        customerId: id,
        companyId: session.companyId,
      },
    });

    if (transactionsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete customer. They are linked to ${transactionsCount} historical transaction(s).` },
        { status: 400 }
      );
    }

    // Delete customer securely
    await prisma.customer.delete({
      where: {
        id,
        companyId: session.companyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CUSTOMER DELETE ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to delete customer" }, { status: 500 });
  }
}
