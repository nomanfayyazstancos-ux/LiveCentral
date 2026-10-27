"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrowseProvider } from "@/components/browse";
import { CategoryPanel } from "@/components/category-panel";
import { Sidebar, type TreeItem } from "@/components/sidebar";
import type { ActivityNote } from "@/components/activity-note";
import type { CategoryNode, Product } from "@/lib/db";

export function DeskMain({
  tree,
  sidebar,
  products,
  activities,
  canEdit,
  children,
}: {
  tree: CategoryNode[];
  sidebar: TreeItem[];
  products: Product[];
  activities: ActivityNote[];
  canEdit: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const home = pathname === "/";
  return (
    <BrowseProvider>
      <div className="mx-auto flex max-w-[1600px] flex-col lg:items-start lg:flex-row">
        <Sidebar tree={sidebar} />
        <main className="min-w-0 flex-1 px-5 py-6">
          {home ? (
            <CategoryPanel tree={tree} products={products} activities={activities} categoryId={null} error="" saved="" query="" canEdit={canEdit} />
          ) : (
            children
          )}
        </main>
      </div>
    </BrowseProvider>
  );
}
