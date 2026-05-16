import prisma from "@/lib/prisma";

export async function getInventoryDataRaw(companyId: string | null, q: string, status: string, category: string, page: number, pageSize: number) {
  const searchQuery = q?.trim();
  const where: any = {
    AND: [
      companyId ? { companyId } : {},
      searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { sku: { contains: searchQuery, mode: 'insensitive' } },
          { stocks: { some: { rack: { rackNumber: { contains: searchQuery, mode: 'insensitive' } } } } }
        ]
      } : {},
      category && category !== 'all' && category !== 'All Categories' ? {
        category: { 
          name: category, 
          ...(companyId ? { companyId } : {})
        }
      } : {},
    ]
  };

  const allItemsSummary = await prisma.item.findMany({
    where,
    include: {
      category: true,
      inventory: {
        include: {
          batches: true
        }
      },
    },
    orderBy: [
      { inventory: { updatedAt: 'desc' } },
      { createdAt: 'desc' }
    ]
  });

  const itemsWithLogs = await Promise.all(allItemsSummary.map(async (item: any) => {
    let lastLogType = null;
    if (status === 'latest_sent' || status === 'latest_received') {
      const lastLog = await prisma.inventoryTransaction.findFirst({
        where: { itemId: item.id },
        orderBy: { createdAt: 'desc' },
        select: { type: true }
      });
      lastLogType = lastLog?.type;
    }
    return { ...item, lastLogType };
  }));

  const mappedAll = itemsWithLogs.map((item: any) => {
    const total = Number(item.inventory?.quantityAvailable ?? 0);
    const incoming = Number(item.inventory?.incomingQty ?? 0);
    const reserved = Number(item.inventory?.quantityReserved ?? 0);
    const netAvailable = (total + incoming) - reserved;

    const batches = item.inventory?.batches || [];
    const totalRemainingInBatches = batches.reduce((acc: number, b: any) => acc + Number(b.quantity), 0);
    const weightedSum = batches.reduce((acc: number, b: any) => acc + (Number(b.quantity) * Number(b.costPerUnit)), 0);
    const avgPrice = totalRemainingInBatches > 0 ? (weightedSum / totalRemainingInBatches) : 0;

    const isUrgent = netAvailable < 0;
    const isOutOfStock = !isUrgent && total <= 0;
    const isLow = !isUrgent && !isOutOfStock && total > 0 && total <= (Number(item.minStockLevel) ?? 0);
    const isPartial = total > 0 && total < reserved;
    const isOrdered = !isUrgent && !isOutOfStock && !isLow && incoming > 0;
    const isInStock = !isUrgent && !isOutOfStock && !isLow && total > (Number(item.minStockLevel) ?? 0);

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      isCritical: item.isCritical,
      minStockLevel: Number(item.minStockLevel) ?? 0,
      totalStock: total,
      avgPrice,
      netAvailable,
      incomingQty: incoming,
      quantityReserved: reserved,
      quantityInTransit: Number(item.inventory?.quantityInTransit ?? 0),
      isUrgent,
      isLow,
      isOutOfStock,
      isPartial,
      isOrdered,
      isInStock,
      lastLogType: item.lastLogType,
      category: item.category?.name || "Uncategorized",
      updatedAt: item.inventory?.updatedAt || item.createdAt
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  let filteredItems = mappedAll;
  if (status && status !== 'all') {
    filteredItems = mappedAll.filter(item => {
      if (status === 'urgent') return item.isUrgent;
      if (status === 'partial') return item.isPartial;
      if (status === 'low') return item.isLow;
      if (status === 'instock') return item.isInStock;
      if (status === 'outofstock') return item.isOutOfStock || item.isUrgent;
      if (status === 'ordered') return item.isOrdered;
      if (status === 'latest_sent') return item.lastLogType === 'SALE';
      if (status === 'latest_received') return item.lastLogType === 'PURCHASE';
      return true;
    });
  }

  const pageItemsSlice = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const pageWithStocks = await Promise.all(pageItemsSlice.map(async (item) => {
    const stocks = await prisma.stock.findMany({
      where: { itemId: item.id },
      include: { rack: true }
    });
    return {
      ...item,
      stocks: stocks.map(s => ({
        id: s.id,
        quantity: Number(s.quantity),
        rack: {
          id: s.rack?.id || "unknown",
          rackNumber: s.rack?.rackNumber || "N/A"
        }
      }))
    };
  }));

  return {
    items: pageWithStocks,
    totalItems: filteredItems.length,
    absoluteTotal: mappedAll.length,
    totalFilteredQuantity: filteredItems.reduce((acc, item) => acc + item.totalStock, 0),
    absoluteTotalQuantity: mappedAll.reduce((acc, item) => acc + item.totalStock, 0),
    inStockCount: mappedAll.filter(i => i.isInStock || i.isOrdered).length,
    lowCount: mappedAll.filter(i => i.isLow).length,
    outOfStockCount: mappedAll.filter(i => i.isOutOfStock).length,
    urgentCount: mappedAll.filter(i => i.isUrgent).length,
  };
}
