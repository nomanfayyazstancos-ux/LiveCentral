import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions";
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
  activeId,
  categoryCount,
  query,
  children,
}: {
  tree: CategoryNode[];
  activeId: number | null;
  categoryCount: number;
  query: string;
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
            <form action="/" className="w-full sm:w-80">
              <input
                name="q"
                defaultValue={query}
                placeholder="Category ya product dhoondo"
                className="w-full rounded-full border border-[#d9deea] bg-[#f4f6fb] px-4 py-2 text-sm outline-none focus:border-[#1c2c86]"
              />
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px] flex-col lg:items-start lg:flex-row">
        <Sidebar tree={slim(tree)} activeId={activeId} />
        <main className="min-w-0 flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
