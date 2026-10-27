import { LiveTree, type LiveNode } from "@/components/live-tree";
import { requireUser } from "@/lib/auth";
import { loadMenu, type CategoryNode } from "@/lib/db";

export const instant = false;

function liveNodes(nodes: CategoryNode[]): LiveNode[] {
  return nodes.map((node) => {
    const children = liveNodes(node.children);
    return {
      id: node.id,
      name: node.name,
      categories: node.insideCount,
      products: node.productCount + children.reduce((sum, child) => sum + child.products, 0),
      children,
    };
  });
}

export default async function TreePage() {
  await requireUser();
  const menu = await loadMenu();

  return <LiveTree tree={liveNodes(menu.tree)} categoryTotal={menu.categories.length} productTotal={menu.products.length} />;
}
