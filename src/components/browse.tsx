"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type BrowseValue = {
  categoryId: number | null;
  browsing: boolean;
  openCategory: (id: number | null) => void;
};

const BrowseContext = createContext<BrowseValue | null>(null);

function categoryFromLocation(pathname: string, raw: string | null) {
  if (pathname !== "/") return null;
  const id = Number(raw ?? "");
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function BrowseProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const urlId = categoryFromLocation(pathname, params.get("category"));
  const [override, setOverride] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    setOverride(undefined);
  }, [urlId, pathname]);

  useEffect(() => {
    function onPop() {
      const id = Number(new URLSearchParams(window.location.search).get("category") ?? "");
      setOverride(window.location.pathname === "/" && Number.isFinite(id) && id > 0 ? id : null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openCategory(id: number | null) {
    window.history.pushState(null, "", id ? `/?category=${id}` : "/");
    setOverride(id);
  }

  return (
    <BrowseContext.Provider value={{ categoryId: override === undefined ? urlId : override, browsing: override !== undefined, openCategory }}>
      {children}
    </BrowseContext.Provider>
  );
}

export function useBrowse() {
  return useContext(BrowseContext);
}
