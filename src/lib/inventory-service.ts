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
    companyId: string;
    minStockLevel?: number;
    isCritical?: boolean;
    rackId?: string | null;
  }) {
    // 0. Check SKU uniqueness within company
    const existing = await prisma.item.findFirst({
      where: { 
        sku: data.sku,
        companyId: data.companyId
      },
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
          company: { connect: { id: data.companyId } },
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
          company: { connect: { id: data.companyId } },
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: item.id } },
          company: { connect: { id: data.companyId } },
          type: "INITIAL_REGISTRY",
          quantity: 0,
          referenceType: "ITEM_CREATE",
          referenceId: "System Initialization",
        },
      });

      if (data.rackId && data.rackId !== "null" && data.rackId !== "") {
        await tx.stock.create({
          data: {
            item: { connect: { id: item.id } },
            rack: { connect: { id: data.rackId } },
            quantity: 0,
            company: { connect: { id: data.companyId } }
          }
        });
      }

      return item;
    });
  },

  /**
   * Receives items from a Purchase Order.
   */
  async receiveGoods(poId: string, itemQuantities: { itemId: string; receivedQty: number }[], userId?: string) {
    if (itemQuantities.some(i => i.receivedQty <= 0)) {
        throw new Error("Received quantity must be greater than zero.");
    }
    return await (prisma as any).$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) throw new Error("Purchase Order not found");

      for (const update of itemQuantities) {
        const poItem = po.items.find((i: { itemId: string; }) => i.itemId === update.itemId);
        if (!poItem) continue;

        // 1. Update PO Line Item received quantity
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
            company: { connect: { id: po.companyId } },
            user: userExists ? { connect: { id: userId } } : undefined,
            type: "PURCHASE",
            quantity: update.receivedQty,
            referenceType: "PO",
            referenceId: poId,
          },
        });

        // 3. Update Cached Inventory summary
        let currentInv = await tx.inventory.findFirst({
          where: { itemId: update.itemId },
        });

        if (!currentInv) {
          currentInv = await tx.inventory.create({
            data: {
              itemId: update.itemId,
              quantityAvailable: update.receivedQty,
              incomingQty: 0,
              quantityReserved: 0,
              quantityInTransit: 0,
              companyId: po.companyId
            }
          });
        } else {
          await tx.inventory.update({
            where: { id: currentInv.id },
            data: {
              quantityAvailable: { increment: update.receivedQty },
              incomingQty: { decrement: Math.min(currentInv.incomingQty || 0, update.receivedQty) },
              quantityInTransit: { decrement: Math.min(currentInv.quantityInTransit || 0, update.receivedQty) },
            },
          });
        }

        // 3a. Create Inventory Batch for this specific receipt (FIFO)
        await tx.inventoryBatch.create({
          data: {
            inventoryId: currentInv.id,
            vendorId: po.vendorId,
            quantity: update.receivedQty,
            remainingQty: update.receivedQty,
            costPerUnit: poItem.costPrice,
            purchaseDate: po.orderDate,
            purchaseOrderId: poId,
            receivedById: userId,
          },
        });

        // 3b. Update Stock table (per-rack) - Fixed scoping to company
        const defaultRack = await tx.rack.findFirst({
          where: { companyId: po.companyId },
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
              data: { 
                itemId: update.itemId, 
                rackId: defaultRack.id, 
                quantity: update.receivedQty,
                companyId: po.companyId
              },
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

      return await tx.purchaseOrder.findFirst({
        where: { id: poId },
        include: { items: { include: { item: true } } },
      });
    });
  },

  /**
   * Creates a new Dispatch Order.
   */
  async createDispatchOrder(data: { customerId: string; companyId: string; paymentMode?: string; items: any[], status?: string, expectedDelivery?: string | Date, orderDate?: string | Date, collectedBy?: string, dispatchedBy?: string, transportMode?: string }) {
    if (data.items.some((i: any) => i.quantity <= 0 || i.sellingPrice <= 0)) {
        throw new Error("Quantity and selling price must be greater than zero.");
    }
    const status = data.status || "pending";

    return await (prisma as any).$transaction(async (tx: any) => {
      // Create Order
      const order = await tx.dispatchOrder.create({
        data: {
          customerId: data.customerId,
          companyId: data.companyId,
          status: status,
          paymentMode: data.paymentMode || "Cash",
          expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          collectedBy: data.collectedBy,
          dispatchedBy: data.dispatchedBy,
          transportMode: data.transportMode,
          items: {
            create: data.items.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              sellingPrice: item.sellingPrice,
            })),
          },
        },
      });

      // Update Reservations if pending
      if (status === "pending") {
        for (const item of data.items) {
          await tx.inventory.update({
            where: { itemId: item.itemId },
            data: {
              quantityReserved: { increment: item.quantity },
            },
          });
        }
      }

      return order;
    });
  },

  /**
   * Dispatches a sales order.
   */
  async dispatchGoods(dispatchId: string, details?: { collectedBy?: string, dispatchedBy?: string, transportMode?: string }) {
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
            quantityReserved: { decrement: line.quantity },
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

        // 3. Deduct from Batches (FIFO)
        let batchRemaining = line.quantity;
        const batches = await tx.inventoryBatch.findMany({
          where: { 
            inventory: { itemId: line.itemId },
            remainingQty: { gt: 0 }
          },
          orderBy: { purchaseDate: "asc" }
        });

        for (const batch of batches) {
          if (batchRemaining <= 0) break;
          const deduction = Math.min(batch.remainingQty, batchRemaining);
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { remainingQty: { decrement: deduction } }
          });
          batchRemaining -= deduction;
        }

        // 4. Create Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            item: { connect: { id: line.itemId } },
            company: { connect: { id: order.companyId } },
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
        data: { 
          status: "dispatched",
          collectedBy: details?.collectedBy,
          dispatchedBy: details?.dispatchedBy,
          transportMode: details?.transportMode
        },
      });
    });
  },

  /**
   * Records scrapped inventory.
   */
  async scrapInventory(itemId: string, companyId: string, qty: number, reason?: string, userId?: string) {
    if (qty <= 0) throw new Error("Scrap quantity must be greater than zero.");
    return await (prisma as any).$transaction(async (tx: any) => {
      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          company: { connect: { id: companyId } },
          user: userId ? { connect: { id: userId } } : undefined,
          type: "SCRAP",
          quantity: -qty,
          referenceType: "MANUAL",
          referenceId: reason,
        },
      });

      // Deduct from Batches (FIFO)
      let scrapRemaining = qty;
      const batches = await tx.inventoryBatch.findMany({
        where: { 
          inventory: { itemId, companyId },
          remainingQty: { gt: 0 }
        },
        orderBy: { purchaseDate: "asc" }
      });

      for (const batch of batches) {
        if (scrapRemaining <= 0) break;
        const deduction = Math.min(batch.remainingQty, scrapRemaining);
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { remainingQty: { decrement: deduction } }
        });
        scrapRemaining -= deduction;
      }

      // Deduct from Racks (FIFO/Arbitrary)
      let rRemaining = qty;
      const stocks = await tx.stock.findMany({
        where: { itemId, companyId, quantity: { gt: 0 } },
        orderBy: { updatedAt: "asc" }
      });

      for (const s of stocks) {
        if (rRemaining <= 0) break;
        const deduction = Math.min(s.quantity, rRemaining);
        if (s.quantity === deduction) {
            await tx.stock.delete({ where: { id: s.id } });
        } else {
            await tx.stock.update({
                where: { id: s.id },
                data: { quantity: { decrement: deduction } }
            });
        }
        rRemaining -= deduction;
      }

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
  async updateStock(itemId: string, rackId: string, quantity: number, userId: string, companyId: string, remarks?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      const currentStock = await tx.stock.findFirst({
        where: { itemId, rackId },
      });

      const oldQuantity = currentStock?.quantity || 0;
      const adjustmentQty = quantity - oldQuantity;

      if (currentStock) {
        if (quantity === 0) {
          await tx.stock.delete({
            where: { id: currentStock.id },
          });
        } else {
          await tx.stock.update({
            where: { id: currentStock.id },
            data: { quantity, updatedAt: new Date() },
          });
        }
      } else {
        // Create stock record even if quantity is 0 to designate a rack location
        await tx.stock.create({
          data: { itemId, rackId, quantity, companyId },
        });
      }

      const existingInv = await tx.inventory.findUnique({ where: { itemId } });
      if (existingInv) {
        await tx.inventory.update({
            where: { id: existingInv.id },
            data: { quantityAvailable: { increment: adjustmentQty } }
        });
      } else {
        await tx.inventory.create({
            data: {
                itemId: itemId,
                quantityAvailable: quantity,
                quantityInTransit: 0,
                quantityReserved: 0,
                companyId: companyId
            }
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: itemId } },
          rack: { connect: { id: rackId } },
          company: { connect: { id: companyId } },
          type: adjustmentQty >= 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
          quantity: Math.abs(adjustmentQty),
          referenceType: "MANUAL",
          referenceId: remarks || "Manual Adjustment",
        },
      });

      // Handle Batches for Manual Adjustment
      if (adjustmentQty < 0) {
        let adjRemaining = Math.abs(adjustmentQty);
        const batches = await tx.inventoryBatch.findMany({
          where: { 
            inventory: { itemId },
            remainingQty: { gt: 0 }
          },
          orderBy: { purchaseDate: "asc" }
        });

        for (const batch of batches) {
          if (adjRemaining <= 0) break;
          const deduction = Math.min(batch.remainingQty, adjRemaining);
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { remainingQty: { decrement: deduction } }
          });
          adjRemaining -= deduction;
        }
      } else if (adjustmentQty > 0) {
        const inventory = await tx.inventory.findUnique({ where: { itemId } });
        const firstVendor = await tx.vendor.findFirst({ where: { companyId } });
        if (inventory && firstVendor) {
          await tx.inventoryBatch.create({
            data: {
              inventoryId: inventory.id,
              vendorId: firstVendor.id,
              quantity: adjustmentQty,
              remainingQty: adjustmentQty,
              costPerUnit: 0,
              purchaseDate: new Date(),
              receivedById: userId,
            },
          });
        }
      }

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
    companyId: string;
    quantity: number;
    customerId?: string;
    remarks?: string;
  }) {
    if (params.quantity <= 0) throw new Error("Dispatch quantity must be greater than zero.");
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

      // Also deduct from Batches (FIFO) to keep breakdown in sync
      let batchRemaining = params.quantity;
      const batches = await tx.inventoryBatch.findMany({
        where: { 
          inventory: { itemId: params.itemId },
          remainingQty: { gt: 0 }
        },
        orderBy: { purchaseDate: "asc" }
      });

      for (const batch of batches) {
        if (batchRemaining <= 0) break;
        const deduction = Math.min(batch.remainingQty, batchRemaining);
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { remainingQty: { decrement: deduction } }
        });
        batchRemaining -= deduction;
      }

      return await tx.inventoryTransaction.create({
        data: {
          item: { connect: { id: params.itemId } },
          rack: { connect: { id: params.rackId } },
          company: { connect: { id: params.companyId } },
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
  async bulkScrapInventory(itemIds: string[], companyId: string, reason?: string, userId?: string) {
    return await (prisma as any).$transaction(async (tx: any) => {
      for (const itemId of itemIds) {
        const inventory = await tx.inventory.findFirst({ where: { itemId, companyId } });
        if (!inventory || inventory.quantityAvailable <= 0) continue;

        const qty = inventory.quantityAvailable;

        await tx.inventoryTransaction.create({
          data: {
            item: { connect: { id: itemId } },
            company: { connect: { id: companyId } },
            user: userId ? { connect: { id: userId } } : undefined,
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
          where: { itemId, companyId }
        });

        // Deplete batches (preserve history instead of deleting)
        await tx.inventoryBatch.updateMany({
          where: { inventoryId: inventory.id },
          data: { remainingQty: 0 }
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
      await tx.inventoryBatch.deleteMany({ where: { inventory: { itemId: { in: itemIds } } } });
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
    return await (prisma as any).$transaction(async (tx: any) => {
      const order = await tx.dispatchOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new Error("Order not found");
      if (order.status === "cancelled") return order;
      if (order.status === "dispatched") throw new Error("Cannot cancel a dispatched order");

      // Release reservations if it was pending
      if (order.status === "pending") {
        for (const item of order.items) {
          await tx.inventory.update({
            where: { itemId: item.itemId },
            data: {
              quantityReserved: { decrement: item.quantity },
            },
          });
        }
      }

      return await tx.dispatchOrder.update({
        where: { id: orderId },
        data: { status: "cancelled" },
      });
    });
  },
};
