"use client";

import { btnDanger } from "@/components/ui";

function Trash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9 7V5h6v2" strokeLinejoin="round" />
      <path d="M7 7l1 13h8l1-13" strokeLinejoin="round" />
    </svg>
  );
}

export function DeleteButton({
  action,
  id,
  categoryId,
  label,
  confirm,
  icon = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  categoryId?: number;
  label: string;
  confirm: string;
  icon?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {categoryId ? <input type="hidden" name="categoryId" value={categoryId} /> : null}
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={icon ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#c62828] hover:bg-[#fff5f5]" : btnDanger}
      >
        {icon ? <Trash /> : label}
      </button>
    </form>
  );
}
