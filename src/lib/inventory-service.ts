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
    return await prisma.$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) throw new Error("Purchase Order not found");

      for (const update of itemQuantities) {
        const poItem = po.items.find((i: { itemId: string; }) => i.itemId === update.itemId);
        if (!poItem) continue;

        // 1. Update PO Item received quantity
        await tx.pOLineItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: { increment: update.receivedQty },
          },
        });

        // 2. Create Inventory Transaction (PURCHASE)
        const userExists = userId ? await tx.user.findUnique({ where: { id: userId } }) : null;

        await tx.inventoryTransaction.create({
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
        // Increase available, decrease in-transit without going below 0
        const currentInv = await tx.inventory.findUnique({
          where: { itemId: update.itemId },
        });

        if (currentInv) {
          await tx.inventory.update({
            where: { itemId: update.itemId },
            data: {
              quantityAvailable: { increment: update.receivedQty },
              incomingQty: { decrement: Math.min(currentInv.incomingQty || 0, update.receivedQty) },
              quantityInTransit: { decrement: Math.min(currentInv.quantityInTransit || 0, update.receivedQty) },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              itemId: update.itemId,
              quantityAvailable: update.receivedQty,
              incomingQty: 0,
              quantityInTransit: 0,
              quantityReserved: 0,
            },
          });
        }

        // 3b. Update Stock table (per-rack) — inventory page reads from here
        const defaultRack = await tx.rack.findFirst({ orderBy: { rackNumber: "asc" } });
        if (defaultRack) {
          const existingStock = await tx.stock.findFirst({
            where: { itemId: update.itemId, rackId: defaultRack.id },
          });
          if (existingStock) {
            await tx.stock.update({
              where: { id: existingStock.id },
              data: { quantity: { increment: update.receivedQty } },
            });
          } else {
            await tx.stock.create({
              data: { itemId: update.itemId, rackId: defaultRack.id, quantity: update.receivedQty },
            });
          }
        }
      }

      // 4. Update overall PO Status
      const finalItems = await tx.pOLineItem.findMany({
        where: { purchaseOrderId: poId }
      });

      const allReceived = finalItems.every((i: { quantityReceived: number; quantityOrdered: number; }) => i.quantityReceived >= i.quantityOrdered);
      const someReceived = finalItems.some((i: { quantityReceived: number; }) => i.quantityReceived > 0);
      
      const newStatus = allReceived ? "DELIVERED" : (someReceived ? "PARTIAL" : "ORDERED");

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus }
      });

      // When an order is fully delivered, create batch rows once (idempotent on retries).
      // Inventory quantities are already updated above during receipt operations.
      if (allReceived && String(po.status || "").toUpperCase() !== "DELIVERED") {
        const inventories = await tx.inventory.findMany({
          where: { itemId: { in: finalItems.map((entry: any) => entry.itemId) } },
          select: { id: true, itemId: true },
        });
        const inventoryIdByItemId = new Map<string, string>(
          inventories.map((inv: any) => [inv.itemId, inv.id])
        );

        const batchRows = finalItems
          .map((line: any) => {
            const inventoryId = inventoryIdByItemId.get(line.itemId);
            if (!inventoryId) return null;

            return {
              inventoryId,
              vendorId: po.vendorId,
              quantity: line.quantityReceived,
              remainingQty: line.quantityReceived,
              costPerUnit: line.costPrice,
              purchaseDate: po.orderDate,
              purchaseOrderId: poId,
            };
          })
          .filter(Boolean);

        if (batchRows.length > 0) {
          try {
            await tx.inventoryBatch.createMany({
              data: batchRows,
              skipDuplicates: true,
            });
          } catch (error: unknown) {
            const code = (error as { code?: string } | null)?.code;
            // Common prod footgun: code updated but DB not migrated yet.
            if (code === "P2021") {
              throw new Error(
                "Inventory batch tracking is not migrated in the database yet. Run `npx prisma migrate dev` (or `npx prisma migrate deploy`) and then `npx prisma generate`."
              );
            }
            throw error;
          }
        }
      }

      return await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: { include: { item: true } } },
      });
    });
  },

  /**
   * Creates a new Dispatch Order and reserves stock immediately.
   * Decrements quantityAvailable to prevent overallocation.
   */
  async createDispatchOrder(data: { customerId: string; paymentMode?: string; items: any[] }) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Validation & Availability Check
      for (const item of data.items) {
        const inv = await tx.inventory.findUnique({
          where: { itemId: item.itemId },
        });

        if (!inv || inv.quantityAvailable < item.quantity) {
          throw new Error(`Insufficient available stock for item ID: ${item.itemId}. Requested: ${item.quantity}, Available: ${inv?.quantityAvailable || 0}`);
        }
      }

      // 2. Create Order
      const order = await tx.dispatchOrder.create({
        data: {
          customerId: data.customerId,
          status: "pending",
          paymentMode: data.paymentMode || "Cash",
          items: {
            create: data.items.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
            })),
          },
        },
      });

      // 3. Move from Available to Reserved
      for (const item of data.items) {
        await tx.inventory.update({
          where: { itemId: item.itemId },
          data: {
            quantityAvailable: { decrement: item.quantity },
            quantityReserved: { increment: item.quantity },
          },
        });
      }

      return order;
    });
  },

  /**
   * Dispatches a sales order.
   * Creates sale transactions, decrements reserved inventory, and specific rack stock.
   */
  async dispatchGoods(dispatchId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const order = await tx.dispatchOrder.findUnique({
        where: { id: dispatchId },
        include: { items: true },
      });

      if (!order) throw new Error("Dispatch Order not found");
      if (order.status === "dispatched") throw new Error("Order already dispatched");

      for (const line of order.items) {
        // 1. Update Inventory summary (Only Reserved, Available was already decremented at order creation)
        await tx.inventory.update({
          where: { itemId: line.itemId },
          data: {
            quantityReserved: { decrement: line.quantity },
          },
        });

        // 2. Deduct from Racks (Greedy Approach)
        let remainingToDeduct = line.quantity;
        const availableStocks = await tx.stock.findMany({
          where: { itemId: line.itemId, quantity: { gt: 0 } },
          orderBy: { quantity: "desc" },
        });

        let usedRackId = null;
        for (const stock of availableStocks) {
          if (remainingToDeduct <= 0) break;

          const deduction = Math.min(stock.quantity, remainingToDeduct);
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: deduction } },
          });
          remainingToDeduct -= deduction;
          usedRackId = stock.rackId;
        }

        // 3. Create Inventory Transaction (SALE)
        await tx.inventoryTransaction.create({
          data: {
            item: { connect: { id: line.itemId } },
            customer: order.customerId ? { connect: { id: order.customerId } } : undefined,
            type: "SALE",
            quantity: -line.quantity,
            referenceType: "DISPATCH",
            referenceId: dispatchId,
            rackId: usedRackId
          },
        });
      }

      const updatedOrder = await tx.dispatchOrder.update({
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
