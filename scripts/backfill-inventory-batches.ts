import prisma from "../src/lib/prisma";
import type { Prisma } from "../src/generated/client";

type Args = {
  commit: boolean;
  pageSize: number;
  maxPos?: number;
  fromDate?: Date;
};

type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{
  include: { items: true };
}>;

function parseArgs(argv: string[]): Args {
  const args: Args = { commit: false, pageSize: 100 };
  for (const raw of argv) {
    if (raw === "--commit") args.commit = true;
    if (raw.startsWith("--pageSize=")) {
      args.pageSize = Math.max(1, Number(raw.split("=", 2)[1] || 100));
    }
    if (raw.startsWith("--maxPos=")) {
      args.maxPos = Math.max(0, Number(raw.split("=", 2)[1] || 0));
    }
    if (raw.startsWith("--from=")) {
      const value = raw.split("=", 2)[1];
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --from date: ${value}`);
      }
      args.fromDate = parsed;
    }
    if (raw === "--help" || raw === "-h") {
      console.log(
        [
          "Backfill InventoryBatch rows from historical fully-received Purchase Orders.",
          "",
          "Usage:",
          "  tsx scripts/backfill-inventory-batches.ts [--commit] [--pageSize=100] [--maxPos=0] [--from=YYYY-MM-DD]",
          "",
          "Defaults to DRY-RUN unless --commit is provided.",
          "",
          "Notes:",
          "- Aggregates duplicate item lines per PO (sum qty, weighted avg costPerUnit) to match unique (purchaseOrderId, inventoryId).",
          "- Does NOT modify inventory totals; it only adds batch trace rows.",
        ].join("\n")
      );
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.pageSize) || args.pageSize <= 0) {
    throw new Error(`Invalid --pageSize value`);
  }
  if (args.maxPos !== undefined && (!Number.isFinite(args.maxPos) || args.maxPos < 0)) {
    throw new Error(`Invalid --maxPos value`);
  }

  return args;
}

function isFullyReceived(po: { items: Array<{ quantityOrdered: number; quantityReceived: number }> }) {
  if (!po.items || po.items.length === 0) return false;
  return po.items.every((line) => Number(line.quantityReceived) >= Number(line.quantityOrdered));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = !args.commit;

  // Quick smoke check so failures are clearer if migrations aren't applied yet.
  await prisma.inventoryBatch.count().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `InventoryBatch model not available. Apply migrations and run prisma generate first. Underlying error: ${message}`
    );
  });

  let cursorId: string | undefined;
  let processedPos = 0;
  let eligiblePos = 0;
  let wouldCreateBatches = 0;
  let createdBatches = 0;

  console.log(dryRun ? "[DRY-RUN] Backfill starting..." : "Backfill starting...");

  while (true) {
    const pos: PurchaseOrderWithItems[] = await prisma.purchaseOrder.findMany({
      take: args.pageSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      where: args.fromDate ? { createdAt: { gte: args.fromDate } } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        items: true,
      },
    });

    if (pos.length === 0) break;
    cursorId = pos[pos.length - 1]?.id;

    for (const po of pos) {
      processedPos += 1;
      if (args.maxPos && processedPos > args.maxPos) break;

      if (!isFullyReceived(po)) continue;
      eligiblePos += 1;

      // Aggregate per PO+itemId to match unique (purchaseOrderId, inventoryId).
      const aggregatedByItemId = new Map<
        string,
        { qty: number; costWeightedSum: number }
      >();

      for (const line of po.items) {
        const qty = Number(line.quantityReceived || 0);
        if (qty <= 0) continue;
        const costPerUnit = Number(line.costPrice || 0);

        const existing = aggregatedByItemId.get(line.itemId) || { qty: 0, costWeightedSum: 0 };
        aggregatedByItemId.set(line.itemId, {
          qty: existing.qty + qty,
          costWeightedSum: existing.costWeightedSum + qty * costPerUnit,
        });
      }

      if (aggregatedByItemId.size === 0) continue;

      // Ensure inventories exist for all itemIds referenced.
      const itemIds = Array.from(aggregatedByItemId.keys());
      const inventories = await prisma.inventory.findMany({
        where: { itemId: { in: itemIds } },
        select: { id: true, itemId: true },
      });
      const inventoryIdByItemId = new Map(inventories.map((inv) => [inv.itemId, inv.id]));

      if (!dryRun) {
        // Create missing inventory rows (if any) without altering totals.
        const missingItemIds = itemIds.filter((itemId) => !inventoryIdByItemId.has(itemId));
        if (missingItemIds.length > 0) {
          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            for (const itemId of missingItemIds) {
              await tx.inventory.upsert({
                where: { itemId },
                create: {
                  item: { connect: { id: itemId } },
                  quantityAvailable: 0,
                  quantityReserved: 0,
                  quantityInTransit: 0,
                },
                update: {},
              });
            }
          });

          const reloaded = await prisma.inventory.findMany({
            where: { itemId: { in: missingItemIds } },
            select: { id: true, itemId: true },
          });
          for (const inv of reloaded) inventoryIdByItemId.set(inv.itemId, inv.id);
        }
      }

      const batchData: Prisma.InventoryBatchCreateManyInput[] = [];
      for (const [itemId, agg] of aggregatedByItemId.entries()) {
        const inventoryId = inventoryIdByItemId.get(itemId);
        if (!inventoryId) continue;

        const costPerUnit = agg.qty > 0 ? agg.costWeightedSum / agg.qty : 0;
        batchData.push({
          inventoryId,
          vendorId: po.vendorId,
          quantity: agg.qty,
          remainingQty: agg.qty,
          costPerUnit,
          purchaseDate: po.orderDate,
          purchaseOrderId: po.id,
        });
      }

      if (batchData.length === 0) continue;
      wouldCreateBatches += batchData.length;

      if (!dryRun) {
        // Use skipDuplicates to make this safe to re-run.
        const result = await prisma.inventoryBatch.createMany({
          data: batchData,
          skipDuplicates: true,
        });
        createdBatches += result.count;
      }
    }

    if (args.maxPos && processedPos >= args.maxPos) break;
  }

  console.log(
    [
      `Processed POs: ${processedPos}`,
      `Eligible POs (fully received): ${eligiblePos}`,
      dryRun ? `Would create batch rows: ${wouldCreateBatches}` : `Created batch rows: ${createdBatches} (planned: ${wouldCreateBatches})`,
    ].join(" | ")
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
