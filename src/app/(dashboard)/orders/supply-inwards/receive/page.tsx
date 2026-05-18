import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReceiveItemsForm from "./ReceiveItemsForm";

export default async function ReceiveItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sParams = await searchParams;
  const idsParam = typeof sParams.ids === 'string' ? sParams.ids : '';
  
  if (!idsParam) {
    redirect("/orders/supply-inwards");
  }

  const compositeIds = idsParam.split(',');
  const itemRequests = compositeIds.map(id => {
    const [poId, itemId] = id.split('|');
    return { poId, itemId };
  });

  // Fetch all requested items
  const items = await Promise.all(
    itemRequests.map(async ({ poId, itemId }) => {
      return prisma.pOLineItem.findFirst({
        where: {
          itemId: itemId,
          purchaseOrderId: poId,
          purchaseOrder: {
            companyId: session.companyId
          }
        },
        include: {
          item: true,
          purchaseOrder: {
            include: {
              vendor: true
            }
          }
        }
      });
    })
  );

  const validItems = items.filter((i: any): i is NonNullable<typeof i> => i !== null && i.quantityReceived < i.quantityOrdered);

  if (validItems.length === 0) {
    redirect("/orders/supply-inwards");
  }

  return (
    <div className="container mx-auto">
      <ReceiveItemsForm initialItems={validItems.map((i: any) => ({
        poId: i.purchaseOrderId,
        itemId: i.itemId,
        name: i.item.name,
        sku: i.item.sku,
        unit: i.item.unit,
        ordered: Number(i.quantityOrdered),
        received: Number(i.quantityReceived),
        vendorName: i.purchaseOrder.vendor.name
      }))} />
    </div>
  );
}
