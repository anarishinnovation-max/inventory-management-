import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("vendors:update");

    const { id } = await params;
    const body = await request.json();
    const { name, email, contact, preferredPaymentMode } = body;

    if (!name) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { 
        id,
        companyId: session.companyId 
      },
      data: {
        name,
        email: email || null,
        contact: contact || null,
        preferredPaymentMode: preferredPaymentMode || "Cash",
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error: any) {
    console.error("[VENDOR PATCH ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requirePermission("vendors:delete");

    const { id } = await params;

    // Check for linked purchase orders
    const poCount = await prisma.purchaseOrder.count({
      where: {
        vendorId: id,
        companyId: session.companyId,
      },
    });

    if (poCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete vendor. They are linked to ${poCount} historical purchase order(s).` },
        { status: 400 }
      );
    }

    // Check for linked inventory batches
    const batchCount = await prisma.inventoryBatch.count({
      where: {
        vendorId: id,
      },
    });

    if (batchCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete vendor. They are linked to ${batchCount} historical inventory batch(es).` },
        { status: 400 }
      );
    }

    // Delete vendor securely
    await prisma.vendor.delete({
      where: {
        id,
        companyId: session.companyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[VENDOR DELETE ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to delete vendor" }, { status: 500 });
  }
}
