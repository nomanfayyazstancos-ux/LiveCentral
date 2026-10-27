import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { logout } from "@/app/actions";
import { MenuSearch } from "@/components/menu-search";
import { Sidebar, type TreeItem } from "@/components/sidebar";
import { btnQuiet } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listPending, type CategoryNode } from "@/lib/db";

function slim(nodes: CategoryNode[]): TreeItem[] {
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
  categoryCount,
  children,
}: {
  tree: CategoryNode[];
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
      <div className="mx-auto flex max-w-[1600px] flex-col lg:items-start lg:flex-row">
        <Suspense fallback={<div className="w-full shrink-0 border-b border-[#e3e6ef] bg-white lg:h-screen lg:w-96 lg:border-r lg:border-b-0" />}>
          <Sidebar tree={slim(tree)} />
        </Suspense>
        <main className="min-w-0 flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
