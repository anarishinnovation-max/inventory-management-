-- Enable UUID extension as Prisma relies on uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('OWNER', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM ('INWARD', 'OUTWARD', 'RETURN', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "POStatus" AS ENUM ('PENDING', 'ORDERED', 'RECEIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop Tables if they exist (to allow re-seeding safely during development)
DROP TABLE IF EXISTS "POLineItem" CASCADE;
DROP TABLE IF EXISTS "PurchaseOrder" CASCADE;
DROP TABLE IF EXISTS "VendorItem" CASCADE;
DROP TABLE IF EXISTS "Vendor" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Stock" CASCADE;
DROP TABLE IF EXISTS "Rack" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rack" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "rackName" TEXT NOT NULL,
    "shelf" TEXT NOT NULL,
    "bin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "itemId" TEXT NOT NULL,
    "rackId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "itemId" TEXT NOT NULL,
    "rackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "customerId" TEXT,
    "vendorId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorItem" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "itemId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "leadTime" INTEGER NOT NULL,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "vendorId" TEXT NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POLineItem" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    "poId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "POLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Item_sku_key" ON "Item"("sku");
CREATE INDEX IF NOT EXISTS "Item_sku_idx" ON "Item"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Rack_rackName_shelf_bin_key" ON "Rack"("rackName", "shelf", "bin");
CREATE UNIQUE INDEX IF NOT EXISTS "Stock_itemId_rackId_key" ON "Stock"("itemId", "rackId");
CREATE INDEX IF NOT EXISTS "Transaction_itemId_idx" ON "Transaction"("itemId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "VendorItem_vendorId_idx" ON "VendorItem"("vendorId");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorItem_itemId_vendorId_key" ON "VendorItem"("itemId", "vendorId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");
CREATE UNIQUE INDEX IF NOT EXISTS "POLineItem_poId_itemId_key" ON "POLineItem"("poId", "itemId");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "Rack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorItem" ADD CONSTRAINT "VendorItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorItem" ADD CONSTRAINT "VendorItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POLineItem" ADD CONSTRAINT "POLineItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POLineItem" ADD CONSTRAINT "POLineItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
