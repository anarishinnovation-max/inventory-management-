-- This migration is for reference and documentation of the seed data structure
-- The actual seeding is done via seed.ts using Prisma

-- This SQL represents the relationships created by the TypeScript seed script:
-- 1. Creates 6 vendors (SOHAM ENTERPRISES, K K TOOLS, V V TOOLS, CNC TOOLS, A K MAHCINE, YASH ENTERPRISES)
-- 2. Creates 17 items (bearings, clamps, boring bars, tools, etc.)
-- 3. Creates 3 customers (CNC TOOLS, A K MAHCINE, YASH ENTERPRISES)
-- 4. Creates 3 purchase orders with 26 line items total
-- 5. Creates 3 dispatch orders with 26 line items total
-- 6. Populates inventory and batches based on PO and dispatch data

-- Statistics of created data:
-- Purchase Bills: 24 records, 3050 total qty, ₹756,000 total value
-- Sale Bills: 17 records, 1339 total qty, ₹453,700 total value
-- Purchase Orders: 9 records, 1300 total qty, ₹645,000 total value
-- Sale Orders: 8 records, 1000 total qty, ₹285,000 total value
