export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoriesList from "./CategoriesList";
import { cacheQuery } from "@/lib/cache";

async function getCategoriesRaw(companyId?: string) {
  if (!companyId) return [];

  const categories = await prisma.category.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { items: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    itemsCount: c._count?.items || 0
  }));
}

const getCategories = (companyId?: string) =>
  cacheQuery(
    () => getCategoriesRaw(companyId),
    ["categories", companyId || "none"],
    60
  )();

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const categories = await getCategories(session.companyId).catch((e: any) => {
    console.error("Failed to fetch categories:", e);
    return [];
  });

  // Calculate high-quality analytics for Bento cards
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: any) => c.itemsCount > 0).length;
  const emptyCategories = categories.filter((c: any) => c.itemsCount === 0).length;
  
  // Find the category with the most items
  let topCategoryName = "None";
  let topCategoryCount = 0;
  if (categories.length > 0) {
    const sorted = [...categories].sort((a: any, b: any) => b.itemsCount - a.itemsCount);
    if (sorted[0] && sorted[0].itemsCount > 0) {
      topCategoryName = sorted[0].name;
      topCategoryCount = sorted[0].itemsCount;
    }
  }

  const metrics = {
    totalCategories,
    activeCategories,
    emptyCategories,
    topCategoryName,
    topCategoryCount
  };

  return (
    <div className="space-y-8 pb-10">
      <CategoriesList 
        initialCategories={categories} 
        metrics={metrics}
        session={session}
      />
    </div>
  );
}
