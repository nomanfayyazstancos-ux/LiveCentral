"use client";

import { useSearchParams } from "next/navigation";

export function MenuSearch() {
  const query = useSearchParams().get("q") ?? "";
  return (
    <form action="/" className="w-full sm:w-80">
      <input
        key={query}
        name="q"
        defaultValue={query}
        placeholder="Category ya product dhoondo"
        className="w-full rounded-full border border-[#d9deea] bg-[#f4f6fb] px-4 py-2 text-sm outline-none focus:border-[#1c2c86]"
      />
    </form>
  );
}
