"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type TreeItem = {
  id: number;
  name: string;
  childCount: number;
  productCount: number;
  children: TreeItem[];
};

function findAncestors(nodes: TreeItem[], id: number, trail: number[] = []): number[] | null {
  for (const node of nodes) {
    if (node.id === id) return trail;
    const found = findAncestors(node.children, id, [...trail, node.id]);
    if (found) return found;
  }
  return null;
}

function Branch({
  nodes,
  open,
  activeId,
  onToggle,
}: {
  nodes: TreeItem[];
  open: number[];
  activeId: number | null;
  onToggle: (id: number) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const expanded = open.includes(node.id);
        const active = node.id === activeId;
        return (
          <li key={node.id}>
            <div className={`flex items-stretch rounded-lg ${active ? "bg-[#1c2c86] text-white" : "hover:bg-[#eef1f8]"}`}>
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={expanded ? `Hide categories inside ${node.name}` : `Show categories inside ${node.name}`}
                  aria-expanded={expanded}
                  onClick={() => onToggle(node.id)}
                  className={`grid w-8 shrink-0 place-items-center text-sm ${active ? "text-white" : "text-[#1c2c86]"}`}
                >
                  {expanded ? "▾" : "▸"}
                </button>
              ) : (
                <span className="w-8 shrink-0" />
              )}
              <Link
                href={hasChildren ? `/?category=${node.id}` : `/products/${node.id}`}
                scroll={false}
                className={`flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-sm font-medium ${active ? "text-white" : "text-[#1a1a1a]"}`}
              >
                <span className="min-w-0 flex-1 leading-5">{node.name}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {node.childCount > 0 ? (
                    <span
                      title={`${node.childCount} categories inside`}
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${active ? "bg-white/20 text-white" : "bg-[#e8ebf7] text-[#1c2c86]"}`}
                    >
                      {node.childCount}
                    </span>
                  ) : null}
                  {node.childCount === 0 || node.productCount > 0 ? (
                    <span
                      title={`${node.productCount} products in this list`}
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${active ? "bg-white/20 text-white" : "bg-[#e7f6ec] text-[#17663a]"}`}
                    >
                      {node.productCount} products
                    </span>
                  ) : null}
                </span>
              </Link>
            </div>
            {hasChildren && expanded ? (
              <div className="ml-4 border-l border-[#d9deea] pl-1">
                <Branch nodes={node.children} open={open} activeId={activeId} onToggle={onToggle} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function readOpen() {
  try {
    const saved = sessionStorage.getItem("sidebar-open");
    const parsed = saved ? (JSON.parse(saved) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "number") : [];
  } catch {
    return [];
  }
}

export function Sidebar({ tree }: { tree: TreeItem[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const categoryParam = Number(params.get("category") ?? "");
  const productMatch = pathname.match(/^\/products\/(\d+)/);
  const activeId = productMatch
    ? Number(productMatch[1])
    : pathname === "/" && Number.isFinite(categoryParam) && categoryParam > 0
      ? categoryParam
      : null;
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number[]>([]);

  useEffect(() => {
    const ancestors = activeId ? findAncestors(tree, activeId) ?? [] : [];
    setOpen(Array.from(new Set([...readOpen(), ...ancestors])));
    const node = listRef.current;
    const top = Number(sessionStorage.getItem("sidebar-scroll") ?? "0");
    if (!node || !Number.isFinite(top)) return;
    requestAnimationFrame(() => {
      node.scrollTop = top;
    });
  }, [activeId, tree]);

  useEffect(() => {
    sessionStorage.setItem("sidebar-open", JSON.stringify(open));
  }, [open]);

  function rememberScroll() {
    const node = listRef.current;
    if (!node) return;
    sessionStorage.setItem("sidebar-scroll", String(node.scrollTop));
  }

  function toggle(id: number) {
    setOpen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#e3e6ef] bg-white max-lg:max-h-[46vh] lg:sticky lg:top-0 lg:h-screen lg:w-96 lg:border-r lg:border-b-0">
      <div className="border-b border-[#e3e6ef] px-5 py-4">
        <p className="text-xs font-medium tracking-wide text-[#5d6880] uppercase">Menu</p>
        <h2 className="mt-1 text-lg font-medium text-[#1c2c86]">Categories</h2>
        <p className="mt-1 text-xs leading-5 text-[#5d6880]">
          Arrow dabao, andar ki categories khul jayengi.
        </p>
      </div>
      <div ref={listRef} onScroll={rememberScroll} className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <Branch nodes={tree} open={open} activeId={activeId} onToggle={toggle} />
      </div>
    </aside>
  );
}
