import prisma from "./prisma";

export const InventoryService = {
  /**
   * Adds a new item to the system and initializes its cached inventory.
   */
  async addItem(data: {
    name: string;
    sku: string;
    categoryId: string;
    unit: string;
    minStockLevel?: number;
    isCritical?: boolean;
  }) {
    return await prisma.$transaction(async (tx) => {
      const item = await (tx as any).item.create({
        data: {
          name: data.name,
          sku: data.sku,
          unit: data.unit,
          category: { connect: { id: data.categoryId } },
          minStockLevel: data.minStockLevel || 0,
          isCritical: data.isCritical || false
        },
      });

      await (tx as any).inventory.create({
        data: {
          item: { connect: { id: item.id } },
          quantityAvailable: 0,
          quantityReserved: 0,
          quantityInTransit: 0,
        },
      });

      return item;
    });
  },

  /**
   * Receives items from a Purchase Order.
   * Updates quantities received, adds inventory transactions, and updates the cached snapshot.
   */
  async receiveGoods(poId: string, itemQuantities: { itemId: string; receivedQty: number }[], userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const po = await (tx as any).purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) throw new Error("Purchase Order not found");

      for (const update of itemQuantities) {
        const poItem = po.items.find((i: { itemId: string; }) => i.itemId === update.itemId);
        if (!poItem) continue;

        // 1. Update PO Item received quantity
        await (tx as any).pOLineItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: { increment: update.receivedQty },
          },
        });

        // 2. Create Inventory Transaction (PURCHASE)
        const userExists = userId ? await (tx as any).user.findUnique({ where: { id: userId } }) : null;

        await (tx as any).inventoryTransaction.create({
          data: {
            item: { connect: { id: update.itemId } },
            vendor: { connect: { id: po.vendorId } },
            user: userExists ? { connect: { id: userId } } : undefined,
            type: "PURCHASE",
            quantity: update.receivedQty,
            referenceType: "PO",
            referenceId: poId,
          },
        });

        // 3. Update Cached Inventory summary
        // Increase available, decrease in-transit
        await (tx as any).inventory.upsert({
          where: { itemId: update.itemId },
          create: {
            itemId: update.itemId,
            quantityAvailable: update.receivedQty,
            quantityInTransit: 0,
            quantityReserved: 0,
          },
          update: {
            quantityAvailable: { increment: update.receivedQty },
            quantityInTransit: { decrement: update.receivedQty },
          },
        });

        // 3b. Update Stock table (per-rack) — inventory page reads from here
        // Default receiving rack is rack "1". Upsert so repeated receipts accumulate.
        const defaultRack = await (tx as any).rack.findFirst({ orderBy: { rackNumber: "asc" } });
        if (defaultRack) {
          const existingStock = await (tx as any).stock.findFirst({
            where: { itemId: update.itemId, rackId: defaultRack.id },
          });
          if (existingStock) {
            await (tx as any).stock.update({
              where: { id: existingStock.id },
              data: { quantity: { increment: update.receivedQty } },
            });
          } else {
            await (tx as any).stock.create({
              data: { itemId: update.itemId, rackId: defaultRack.id, quantity: update.receivedQty },
            });
          }
        }
      }

      // 4. Update overall PO Status
      const finalItems = await (tx as any).pOLineItem.findMany({
        where: { purchaseOrderId: poId }
      });

      const allReceived = finalItems.every((i: { quantityReceived: number; quantityOrdered: number; }) => i.quantityReceived >= i.quantityOrdered);
      const someReceived = finalItems.some((i: { quantityReceived: number; }) => i.quantityReceived > 0);
      
      const newStatus = allReceived ? "RECEIVED" : (someReceived ? "PARTIAL" : "ORDERED");

      await (tx as any).purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus }
      });

      return await (tx as any).purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: { include: { item: true } } },
      });
    });
  },

  /**
   * Dispatches a sales order.
   * Creates sale transactions and updates cached inventory.
   */
  async dispatchGoods(dispatchId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.dispatchOrder.findUnique({
        where: { id: dispatchId },
        include: { items: true },
      });

      if (!order) throw new Error("Dispatch Order not found");
      if (order.status === "dispatched") throw new Error("Order already dispatched");

      for (const line of order.items) {
        // 1. Validate Available Stock
        const inv = await (tx as any).inventory.findUnique({
          where: { itemId: line.itemId },
        });

        if (!inv || inv.quantityAvailable < line.quantity) {
          throw new Error(`Insufficient stock for item ${line.itemId}`);
        }

        // 2. Create Inventory Transaction (SALE)
        await (tx as any).inventoryTransaction.create({
          data: {
            item: { connect: { id: line.itemId } },
            customer: order.customerId ? { connect: { id: order.customerId } } : undefined,
            type: "SALE",
            quantity: -line.quantity,
            referenceType: "DISPATCH",
            referenceId: dispatchId,
          },
        });

        // 3. Update Cached Inventory
        // Decrease available and decrease reserved (assuming it was reserved on order creation)
        await (tx as any).inventory.update({
          where: { itemId: line.itemId },
          data: {
            quantityAvailable: { decrement: line.quantity },
            quantityReserved: { decrement: line.quantity },
          },
        });
      }

      const updatedOrder = await (tx as any).dispatchOrder.update({
        where: { id: dispatchId },
        data: { status: "dispatched" },
      });

      return updatedOrder;
    });
  },

  /**
   * Records scrapped inventory.
   */
  async scrapInventory(itemId: string, qty: number, reason?: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Transaction (SCRAP)
      await (tx as any).inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          type: "SCRAP",
          quantity: -qty,
          referenceType: "MANUAL",
          referenceId: reason,
        },
      });

      // 2. Update Cached Inventory
      return await (tx as any).inventory.update({
        where: { itemId },
        data: {
          quantityAvailable: { decrement: qty },
        },
      });
    });
  },

  /**
   * Updates stock in a specific rack and synchronizes the global inventory summary.
   */
  async updateStock(itemId: string, rackId: string, quantity: number, userId: string, remarks?: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get current stock for this rack
      const currentStock = await (tx as any).stock.findFirst({
        where: { itemId, rackId },
      });

      const oldQuantity = currentStock?.quantity || 0;
      const adjustmentQty = quantity - oldQuantity;

      // 2. Upsert Stock record
      if (currentStock) {
        await (tx as any).stock.update({
          where: { id: currentStock.id },
          data: { quantity, updatedAt: new Date() },
        });
      } else {
        await (tx as any).stock.create({
          data: { itemId, rackId, quantity },
        });
      }

      // 3. Update Global Inventory Summary
      await (tx as any).inventory.upsert({
        where: { itemId },
        create: {
          item: { connect: { id: itemId } },
          quantityAvailable: quantity, // If it didn't exist, we assume this is the first entry
          quantityInTransit: 0,
          quantityReserved: 0,
        },
        update: {
          quantityAvailable: { increment: adjustmentQty },
        },
      });

      // 4. Create Audit Transaction
      const userExists = userId ? await (tx as any).user.findUnique({ where: { id: userId } }) : null;

      await (tx as any).inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          rack: { connect: { id: rackId } },
          user: userExists ? { connect: { id: userId } } : undefined,
          type: adjustmentQty >= 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          quantity: Math.abs(adjustmentQty),
          referenceType: "MANUAL",
          referenceId: remarks || "Manual Adjustment",
        },
      });

      return { success: true, newQuantity: quantity };
    });
  },

  /**
   * Manually dispatches stock for a specific item and rack directly to a customer.
   */
  async dispatchManual(params: {
    itemId: string;
    rackId: string;
    userId: string;
    quantity: number;
    customerId?: string;
    remarks?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate Stock
      const stock = await (tx as any).stock.findFirst({
        where: { itemId: params.itemId, rackId: params.rackId },
      });

      if (!stock || stock.quantity < params.quantity) {
        throw new Error("Insufficient stock in the specified rack location.");
      }

      // 2. Update Stock
      await (tx as any).stock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: params.quantity } },
      });

      // 3. Update Global Inventory
      await (tx as any).inventory.update({
        where: { itemId: params.itemId },
        data: { quantityAvailable: { decrement: params.quantity } },
      });

      // 4. Create Audit Transaction
      const userExists = params.userId ? await tx.user.findUnique({ where: { id: params.userId } }) : null;

      return await (tx as any).inventoryTransaction.create({
        data: {
          item: { connect: { id: params.itemId } },
          rack: { connect: { id: params.rackId } },
          user: userExists ? { connect: { id: params.userId } } : undefined,
          customer: params.customerId ? { connect: { id: params.customerId } } : undefined,
          type: "OUTWARD",
          quantity: -params.quantity,
          referenceType: "MANUAL_DISPATCH",
          referenceId: params.remarks || "Manual Dispatch",
        },
      });
    });
  },
};
