import { AppShell } from "@/components/app-shell";
import { CategoryPanel } from "@/components/category-panel";
import { requireUser } from "@/lib/auth";
import { breadcrumb, canEditMenu, loadMenu } from "@/lib/db";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const menu = await loadMenu();
  const categoryRaw = Number(one(params.category));
  const categoryId = Number.isFinite(categoryRaw) && categoryRaw > 0 ? categoryRaw : null;
  const activeId = categoryId ? breadcrumb(categoryId, menu.byId).at(-1)?.id ?? null : null;

  return (
    <AppShell tree={menu.tree} activeId={activeId} categoryCount={menu.categories.length} query={one(params.q)}>
      <CategoryPanel
        tree={menu.tree}
        byId={menu.byId}
        nodeById={menu.nodeById}
        productsByCategory={menu.productsByCategory}
        categoryId={categoryId}
        error={one(params.error)}
        saved={one(params.saved)}
        query={one(params.q).trim()}
        canEdit={canEditMenu(user.role)}
      />
    </AppShell>
  );
}
