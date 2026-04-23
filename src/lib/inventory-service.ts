import prisma from "./prisma";
import { Prisma } from "../generated/client";

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
    // 0. Check SKU uniqueness
    const existing = await (prisma as any).item.findFirst({
      where: { sku: data.sku },
    });
    if (existing) {
      throw new Error(`SKU_EXISTS:${data.sku}`);
    }

    return await (prisma as any).$transaction(async (tx: any) => {
      const item = await tx.item.create({
        data: {
          name: data.name,
          sku: data.sku,
          unit: data.unit,
          category: { connect: { id: data.categoryId } },
          minStockLevel: data.minStockLevel || 0,
          isCritical: data.isCritical || false
        },
      });

      await tx.inventory.create({
        data: {
          item: { connect: { id: item.id } },
          quantityAvailable: 0,
          quantityReserved: 0,
          quantityInTransit: 0,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: item.id } },
          type: "INITIAL_REGISTRY",
          quantity: 0,
          referenceType: "ITEM_CREATE",
          referenceId: "System Initialization",
        },
      });

      return item;
    });
  },

  /**
   * Receives items from a Purchase Order.
   */
  async receiveGoods(poId: string, itemQuantities: { itemId: string; receivedQty: number }[], userId?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.findFirst({
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
        const userExists = userId ? await tx.user.findFirst({ where: { id: userId } }) : null;

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
        const currentInv = await tx.inventory.findFirst({
          where: { itemId: update.itemId },
        });

        if (currentInv) {
          await tx.inventory.update({
            where: { id: currentInv.id },
            data: {
              quantityAvailable: { increment: update.receivedQty },
              incomingQty: { decrement: Math.min(currentInv.incomingQty || 0, update.receivedQty) },
              quantityInTransit: { decrement: Math.min(currentInv.quantityInTransit || 0, update.receivedQty) },
            },
          });
        }

        // 3b. Update Stock table (per-rack)
        const defaultRack = await tx.rack.findFirst({
          orderBy: { rackNumber: "asc" }
        });
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

      const allReceived = finalItems.every((i: any) => i.quantityReceived >= i.quantityOrdered);
      const someReceived = finalItems.some((i: any) => i.quantityReceived > 0);
      const newStatus = allReceived ? "DELIVERED" : (someReceived ? "PARTIAL" : "ORDERED");

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newStatus }
      });

      // Handle Batching
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
            for (const row of batchRows) {
               if (row) await tx.inventoryBatch.create({ data: row });
            }
        }
      }

      return await tx.purchaseOrder.findFirst({
        where: { id: poId },
        include: { items: { include: { item: true } } },
      });
    });
  },

  /**
   * Creates a new Dispatch Order.
   */
  async createDispatchOrder(data: { customerId: string; paymentMode?: string; items: any[], status?: string, expectedDelivery?: string | Date }) {
    const status = data.status || "pending";

    return await (prisma as any).$transaction(async (tx: any) => {
      // Create Order
      const order = await tx.dispatchOrder.create({
        data: {
          customerId: data.customerId,
          status: status,
          paymentMode: data.paymentMode || "Cash",
          expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
          items: {
            create: data.items.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
            })),
          },
        },
      });
      return order;
    });
  },

  /**
   * Dispatches a sales order.
   */
  async dispatchGoods(dispatchId: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const order = await tx.dispatchOrder.findFirst({
        where: { id: dispatchId },
        include: { items: true },
      });

      if (!order) throw new Error("Dispatch Order not found");
      if (order.status === "dispatched") throw new Error("Order already dispatched");

      for (const line of order.items) {
        // 1. Update Inventory summary
        await tx.inventory.update({
          where: { itemId: line.itemId },
          data: {
            quantityAvailable: { decrement: line.quantity },
          },
        });

        // 2. Deduct from Racks
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

        // 3. Create Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            item: { connect: { id: line.itemId } },
            customer: order.customerId ? { connect: { id: order.customerId } } : undefined,
            type: "SALE",
            quantity: -line.quantity,
            referenceType: "DISPATCH",
            referenceId: dispatchId,
            rack: usedRackId ? { connect: { id: usedRackId } } : undefined
          },
        });
      }

      return await tx.dispatchOrder.update({
        where: { id: dispatchId },
        data: { status: "dispatched" },
      });
    });
  },

  /**
   * Records scrapped inventory.
   */
  async scrapInventory(itemId: string, qty: number, reason?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          type: "SCRAP",
          quantity: -qty,
          referenceType: "MANUAL",
          referenceId: reason,
        },
      });

      return await tx.inventory.update({
        where: { itemId },
        data: {
          quantityAvailable: { decrement: qty },
        },
      });
    });
  },

  /**
   * Updates stock in a specific rack.
   */
  async updateStock(itemId: string, rackId: string, quantity: number, userId: string, remarks?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const currentStock = await tx.stock.findFirst({
        where: { itemId, rackId },
      });

      const oldQuantity = currentStock?.quantity || 0;
      const adjustmentQty = quantity - oldQuantity;

      if (currentStock) {
        await tx.stock.update({
          where: { id: currentStock.id },
          data: { quantity, updatedAt: new Date() },
        });
      } else {
        await tx.stock.create({
          data: { itemId, rackId, quantity },
        });
      }

      const existingInv = await tx.inventory.findFirst({ where: { itemId } });
      if (existingInv) {
        await tx.inventory.update({
            where: { id: existingInv.id },
            data: { quantityAvailable: { increment: adjustmentQty } }
        });
      } else {
        await tx.inventory.create({
            data: {
                item: { connect: { id: itemId } },
                quantityAvailable: quantity,
                quantityInTransit: 0,
                quantityReserved: 0,
            }
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          rack: { connect: { id: rackId } },
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
    return await (prisma as any).$transaction(async (tx: any) => {
      const stock = await tx.stock.findFirst({
        where: { itemId: params.itemId, rackId: params.rackId },
      });

      if (!stock || stock.quantity < params.quantity) {
        throw new Error("Insufficient stock in the specified rack location.");
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: params.quantity } },
      });

      await tx.inventory.update({
        where: { itemId: params.itemId },
        data: { quantityAvailable: { decrement: params.quantity } },
      });

      return await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: params.itemId } },
          rack: { connect: { id: params.rackId } },
          type: "OUTWARD",
          quantity: -params.quantity,
          referenceType: "MANUAL_DISPATCH",
          referenceId: params.remarks || "Manual Dispatch",
        },
      });
    });
  },

  /**
   * Records scrapped inventory for multiple items.
   */
  async bulkScrapInventory(itemIds: string[], reason?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      for (const itemId of itemIds) {
        const inventory = await tx.inventory.findFirst({ where: { itemId } });
        if (!inventory || inventory.quantityAvailable <= 0) continue;

        const qty = inventory.quantityAvailable;

        await tx.inventoryTransaction.create({
          data: {
            item: { connect: { id: itemId } },
            type: "SCRAP",
            quantity: -qty,
            referenceType: "MANUAL_BULK",
            referenceId: reason || "Bulk Scrap Action",
          },
        });

        await tx.inventory.update({
          where: { itemId },
          data: {
            quantityAvailable: 0,
          },
        });

        // Clear per-rack stock as well
        await tx.stock.deleteMany({
          where: { itemId }
        });

        // Clear batches
        await tx.inventoryBatch.deleteMany({
          where: { inventoryId: inventory.id }
        });
      }
      return { success: true };
    });
  },

  /**
   * Bulk deletes items if they have no inventory dependencies.
   */
  async bulkDeleteItems(itemIds: string[]) {
    return await (prisma as any).$transaction(async (tx: any) => {
      // Check if any have stock
      const stockCheck = await tx.inventory.findMany({
        where: { 
          itemId: { in: itemIds },
          quantityAvailable: { gt: 0 }
        }
      });

      if (stockCheck.length > 0) {
        throw new Error("Cannot delete items that still have available stock. Please scrap them first.");
      }

      // Delete dependencies first
      await tx.inventory.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.inventoryTransaction.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.stock.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.pOLineItem.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.dispatchItem.deleteMany({ where: { itemId: { in: itemIds } } });

      return await tx.item.deleteMany({
        where: { id: { in: itemIds } },
      });
    });
  },

  /**
   * Cancels a dispatch order and releases reserved stock.
   */
  async cancelDispatchOrder(orderId: string) {
    return await (prisma as any).dispatchOrder.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });
  },
};
