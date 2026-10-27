import { ProductForm } from "@/components/product-form";
import { requireUser } from "@/lib/auth";
import { canEditMenu, loadMenu } from "@/lib/db";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function NewProductPage({
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
  const category = menu.byId.get(Number(id));

  return category ? (
    <ProductForm category={category} byId={menu.byId} product={null} error={one(query.error)} canEdit={canEditMenu(user.role)} />
  ) : (
    <p className="text-sm text-[#5d6880]">This category does not exist.</p>
  );
}
