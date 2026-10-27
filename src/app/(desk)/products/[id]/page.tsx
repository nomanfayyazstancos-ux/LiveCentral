import { ProductPanel } from "@/components/product-panel";
import { requireUser } from "@/lib/auth";
import { canEditMenu, loadMenu, productsInCategory } from "@/lib/db";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const menu = await loadMenu();
  const categoryId = Number(id);
  const category = menu.byId.get(categoryId);
  const products = category ? await productsInCategory(category.id) : [];

  return category ? (
    <ProductPanel
      category={category}
      byId={menu.byId}
      products={products}
      error={one(query.error)}
      saved={one(query.saved)}
      canEdit={canEditMenu(user.role)}
    />
  ) : (
    <p className="text-sm text-[#5d6880]">This category does not exist.</p>
  );
}
