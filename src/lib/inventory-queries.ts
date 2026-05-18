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

  // 1. Fetch lightweight item summary for all items matching filters
  const allItemsSummary = await prisma.item.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      isCritical: true,
      minStockLevel: true,
      createdAt: true,
      category: {
        select: { name: true }
      },
      inventory: {
        select: {
          quantityAvailable: true,
          incomingQty: true,
          quantityReserved: true,
          quantityInTransit: true,
          updatedAt: true
        }
      }
    }
  });

  // 2. Fetch the latest transactions for all items in a single batch query (if filtering by activity log type)
  const latestTxMap = new Map<string, string>();
  if (status === 'latest_sent' || status === 'latest_received') {
    const latestTransactions = await prisma.inventoryTransaction.findMany({
      where: companyId ? { companyId } : {},
      distinct: ['itemId'],
      orderBy: [
        { itemId: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        itemId: true,
        type: true
      }
    });
    latestTransactions.forEach(tx => {
      latestTxMap.set(tx.itemId, tx.type);
    });
  }

  // 3. Map status flags in Node.js memory
  const mappedAll = allItemsSummary.map((item: any) => {
    const total = Number(item.inventory?.quantityAvailable ?? 0);
    const incoming = Number(item.inventory?.incomingQty ?? 0);
    const reserved = Number(item.inventory?.quantityReserved ?? 0);
    const netAvailable = (total + incoming) - reserved;

    const isUrgent = netAvailable < 0;
    const isOutOfStock = !isUrgent && total <= 0;
    const isLow = !isUrgent && !isOutOfStock && total > 0 && total <= (Number(item.minStockLevel) ?? 0);
    const isPartial = total > 0 && total < reserved;
    const isOrdered = !isUrgent && !isOutOfStock && !isLow && incoming > 0;
    const isInStock = !isUrgent && !isOutOfStock && !isLow && total > (Number(item.minStockLevel) ?? 0);
    
    const lastLogType = latestTxMap.get(item.id) || null;

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      isCritical: item.isCritical,
      minStockLevel: Number(item.minStockLevel) ?? 0,
      totalStock: total,
      avgPrice: 0, // Calculated lazily inside the detail Modal rather than slowing down list loads
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
      lastLogType,
      category: item.category?.name || "Uncategorized",
      updatedAt: item.inventory?.updatedAt || item.createdAt
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 4. In-Memory status filtering
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

  // 5. Slice down to page items
  const pageItemsSlice = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const pageItemIds = pageItemsSlice.map(i => i.id);

  // 6. Batch fetch physical stocks & rack numbers for page items ONLY (1 query instead of 20 N+1 queries)
  const allStocks = pageItemIds.length > 0 ? await prisma.stock.findMany({
    where: { itemId: { in: pageItemIds } },
    include: { rack: true }
  }) : [];

  const stocksByItemId = new Map<string, any[]>();
  allStocks.forEach(s => {
    const list = stocksByItemId.get(s.itemId) || [];
    list.push({
      id: s.id,
      quantity: Number(s.quantity),
      rack: {
        id: s.rack?.id || "unknown",
        rackNumber: s.rack?.rackNumber || "N/A"
      }
    });
    stocksByItemId.set(s.itemId, list);
  });

  const pageWithStocks = pageItemsSlice.map(item => ({
    ...item,
    stocks: stocksByItemId.get(item.id) || []
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
