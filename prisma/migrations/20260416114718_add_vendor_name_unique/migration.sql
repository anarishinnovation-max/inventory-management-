/*
  Warnings:

  - You are about to drop the column `paymentMode` on the `DispatchOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DispatchOrder" DROP COLUMN "paymentMode";

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");
