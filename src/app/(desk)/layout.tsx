import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { loadMenu } from "@/lib/db";

export const instant = false;

export default async function DeskLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const menu = await loadMenu();
  return (
    <AppShell tree={menu.tree} categoryCount={menu.categories.length}>
      {children}
    </AppShell>
  );
}
