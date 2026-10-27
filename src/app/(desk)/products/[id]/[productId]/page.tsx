import { ProductForm } from "@/components/product-form";
import { requireUser } from "@/lib/auth";
import { canEditMenu, loadMenu } from "@/lib/db";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, productId } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const menu = await loadMenu();
  const category = menu.byId.get(Number(id));
  const product = (menu.productsByCategory.get(Number(id)) ?? []).find((item) => item.id === Number(productId)) ?? null;

  return category && product ? (
    <ProductForm category={category} byId={menu.byId} product={product} error={one(query.error)} canEdit={canEditMenu(user.role)} />
  ) : (
    <p className="text-sm text-[#5d6880]">This product does not exist.</p>
  );
}
