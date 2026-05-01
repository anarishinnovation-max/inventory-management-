
import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();

async function syncReservations() {
  console.log("Starting Reservation Sync...");
  
  // Get all items
  const items = await prisma.item.findMany({
    include: { inventory: true }
  });

  for (const item of items) {
    // Calculate actual reserved quantity from pending dispatch orders
    // The correct model is dispatchItem (from DispatchItem model)
    const dispatchItems = await prisma.dispatchItem.findMany({
      where: {
        itemId: item.id,
        dispatchOrder: {
          status: {
            in: ['pending', 'partially_dispatched'] as any
          }
        }
      },
      select: {
        quantity: true
      }
    });

    const actualReserved = dispatchItems.reduce((acc: number, di: any) => {
      return acc + di.quantity;
    }, 0);

    if (item.inventory) {
      if (item.inventory.quantityReserved !== actualReserved) {
        console.log(`Syncing ${item.sku}: ${item.inventory.quantityReserved} -> ${actualReserved}`);
        await prisma.inventory.update({
          where: { id: item.inventory.id },
          data: { quantityReserved: actualReserved }
        });
      }
    } else {
       // Create inventory record if missing
       await prisma.inventory.create({
         data: {
           itemId: item.id,
           companyId: item.companyId,
           quantityAvailable: 0,
           quantityReserved: actualReserved
         }
       });
    }
  }

  console.log("Sync Complete!");
}

syncReservations().catch(console.error).finally(() => prisma.$disconnect());
