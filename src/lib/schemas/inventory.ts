import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required").default("PCS"),
  minStockLevel: z.number().min(0).default(0),
  isCritical: z.boolean().default(false),
  rackId: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().describe("The new absolute quantity or adjustment amount depending on the endpoint logic"),
  rackId: z.string().min(1, "Rack ID is required"),
  type: z.enum(["ADJUSTMENT", "SALE", "PURCHASE", "RETURN", "DAMAGE"]).default("ADJUSTMENT"),
  reason: z.string().optional(),
});

export const rackSchema = z.object({
  rackNumber: z.string().min(1, "Rack number is required"),
  zone: z.string().min(1, "Zone is required"),
  capacity: z.number().min(0).optional(),
});
