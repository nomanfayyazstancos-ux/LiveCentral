import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { canEditMenu, loadMenu, recentActivity } from "@/lib/db";

export const instant = false;

export default async function DeskLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const menu = await loadMenu();
  return (
    <AppShell
      tree={menu.tree}
      products={menu.products}
      activities={await recentActivity(80)}
      canEdit={canEditMenu(user.role)}
      categoryCount={menu.categories.length}
    >
      {children}
    </AppShell>
  );
}
