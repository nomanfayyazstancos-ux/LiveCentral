"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type LiveNode = {
  id: number;
  name: string;
  categories: number;
  products: number;
  children: LiveNode[];
};

function branchHas(node: LiveNode, needle: string): boolean {
  if (node.name.toLowerCase().includes(needle)) return true;
  return node.children.some((child) => branchHas(child, needle));
}

function filterTree(nodes: LiveNode[], needle: string): LiveNode[] {
  if (!needle) return nodes;
  return nodes.flatMap((node) => {
    if (node.name.toLowerCase().includes(needle)) return [node];
    const children = filterTree(node.children, needle);
    if (children.length === 0) return [];
    return [{ ...node, children }];
  });
}

function openForSearch(nodes: LiveNode[], needle: string, ids: number[] = []) {
  for (const node of nodes) {
    if (node.children.some((child) => branchHas(child, needle))) {
      ids.push(node.id);
      openForSearch(node.children, needle, ids);
    }
  }
  return ids;
}

function Count({ value, label, tone }: { value: number; label: string; tone: "blue" | "green" }) {
  const color = tone === "blue" ? "bg-[#e8ebf7] text-[#1c2c86]" : "bg-[#e7f6ec] text-[#17663a]";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {value} {label}
    </span>
  );
}

function Rows({ nodes, open, onToggle, depth }: { nodes: LiveNode[]; open: number[]; onToggle: (id: number) => void; depth: number }) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-[#d9deea] pl-3"}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const expanded = open.includes(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f7f8fc]">
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={expanded ? `Hide ${node.name}` : `Show ${node.name}`}
                  aria-expanded={expanded}
                  onClick={() => onToggle(node.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm text-[#1c2c86] hover:bg-[#e8ebf7]"
                >
                  {expanded ? "▾" : "▸"}
                </button>
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center text-xs text-[#c5cad8]">•</span>
              )}
              <Link href={hasChildren ? `/?category=${node.id}` : `/products/${node.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-[#15246d]">
                {node.name}
              </Link>
              <Count value={node.categories} label={node.categories === 1 ? "category" : "categories"} tone="blue" />
              <Count value={node.products} label={node.products === 1 ? "product" : "products"} tone="green" />
            </div>
            {hasChildren && expanded ? <Rows nodes={node.children} open={open} onToggle={onToggle} depth={depth + 1} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function LiveTree({ tree, categoryTotal, productTotal }: { tree: LiveNode[]; categoryTotal: number; productTotal: number }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number[]>([]);
  const [extra, setExtra] = useState<number[]>([]);
  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => filterTree(tree, needle), [tree, needle]);
  const shownOpen = needle ? Array.from(new Set([...openForSearch(tree, needle), ...extra])) : open;

  function toggle(id: number) {
    const update = (current: number[]) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (needle) setExtra(update);
    else setOpen(update);
  }

  return (
    <section>
      <h2 className="text-2xl font-medium text-[#1c2c86]">Live tree</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5d6880]">
        Har category ke saamne do numbers hain. Neela number andar ki categories hai. Hara number us category aur uske andar ke products hai. Arrow dabao, tree khul jayegi.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[#e8ebf7] px-3 py-1 font-medium text-[#1c2c86]">{categoryTotal} categories</span>
        <span className="rounded-full bg-[#e7f6ec] px-3 py-1 font-medium text-[#17663a]">{productTotal} products</span>
      </div>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setExtra([]);
        }}
        placeholder="Tree mein category dhoondo"
        className="mt-4 w-full max-w-md rounded-full border border-[#d9deea] bg-white px-4 py-2 text-sm outline-none focus:border-[#1c2c86]"
      />
      <div className="mt-4 rounded-xl border border-[#e3e6ef] bg-white p-3">
        {visible.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[#5d6880]">Koi category nahi mili.</p>
        ) : (
          <Rows nodes={visible} open={shownOpen} onToggle={toggle} depth={0} />
        )}
      </div>
    </section>
  );
}
