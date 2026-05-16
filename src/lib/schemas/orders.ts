import { z } from "zod";

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  orderDate: z.string().optional(),
  expectedDelivery: z.string().optional().nullable(),
  paymentMode: z.string().optional().default("Cash"),
  items: z.array(z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantityOrdered: z.number().positive("Quantity must be greater than zero"),
    costPrice: z.number().positive("Cost price must be greater than zero"),
  })).min(1, "At least one item is required"),
});

export const dispatchOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().optional(),
  expectedDelivery: z.string().optional().nullable(),
  paymentMode: z.string().optional().default("Cash"),
  status: z.string().optional().default("pending"),
  items: z.array(z.object({
    itemId: z.string().min(1, "Item ID is required"),
    quantity: z.number().positive("Quantity must be greater than zero"),
    sellingPrice: z.number().positive("Selling price must be greater than zero"),
  })).min(1, "At least one item is required"),
  collectedBy: z.string().optional(),
  dispatchedBy: z.string().optional(),
  transportMode: z.string().optional(),
});
