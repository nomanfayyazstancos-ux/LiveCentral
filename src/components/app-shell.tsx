import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { logout } from "@/app/actions";
import { MenuSearch } from "@/components/menu-search";
import { DeskMain } from "@/components/desk-main";
import type { ActivityNote } from "@/components/activity-note";
import { btnQuiet } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listPending, type CategoryNode, type Product } from "@/lib/db";

function slim(nodes: CategoryNode[]) {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    childCount: node.children.length,
    productCount: node.productCount,
    children: slim(node.children),
  }));
}

export async function AppShell({
  tree,
  products,
  activities,
  canEdit,
  categoryCount,
  children,
}: {
  tree: CategoryNode[];
  products: Product[];
  activities: ActivityNote[];
  canEdit: boolean;
  categoryCount: number;
  children: ReactNode;
}) {
  const user = await requireUser();
  const waiting = user.role === "admin" ? (await listPending()).length : 0;
  const roleLabel = user.role === "admin" ? "Admin" : user.role === "edit" ? "Edit" : "View";
  return (
    <div className="min-h-full">
      <header className="border-b border-[#e3e6ef] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="min-w-0">
            <p className="text-lg font-medium text-[#1c2c86]">LiveCentral</p>
            <p className="text-xs text-[#5d6880]">{categoryCount} categories</p>
          </Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-[#1a1a1a]">{user.name}</p>
              <p className="truncate text-[#5d6880]">{user.email}</p>
              <p className="text-xs font-medium text-[#1c2c86]">{roleLabel}</p>
            </div>
            <Link href="/tree" className={btnQuiet}>Tree</Link>
            {user.role === "admin" ? (
              <Link href="/users" className={btnQuiet}>
                Users{waiting > 0 ? ` (${waiting})` : ""}
              </Link>
            ) : null}
            <form action={logout}>
              <button type="submit" className={btnQuiet}>Logout</button>
            </form>
            <Suspense fallback={<div className="h-10 w-full sm:w-80" />}>
              <MenuSearch />
            </Suspense>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="mx-auto h-[70vh] max-w-[1600px]" />}>
        <DeskMain tree={tree} sidebar={slim(tree)} products={products} activities={activities} canEdit={canEdit}>
          {children}
        </DeskMain>
      </Suspense>
    </div>
  );
}
