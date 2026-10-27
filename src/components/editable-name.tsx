"use client";

import Link from "next/link";
import { useState } from "react";
import type { NoteView } from "@/components/activity-list";
import { DeleteButton } from "@/components/delete-button";
import { btn, btnQuiet, field } from "@/components/ui";

function Pencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" strokeLinejoin="round" />
    </svg>
  );
}

function NoteTip({ note }: { note: NoteView }) {
  return (
    <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-72 rounded-xl border border-[#d9deea] bg-white p-3 text-left shadow-lg group-hover/tip:block">
      <span className="block text-sm font-medium text-[#1c2c86]">{note.title}</span>
      {note.lines.length > 0 ? (
        <span className="mt-1 block space-y-1 text-xs leading-5">
          {note.lines.map((line) => (
            <span key={`${line.label}-${line.before}-${line.after}`} className="block text-[#1a1a1a]">
              {line.label ? <span className="block text-[#5d6880]">{line.label}</span> : null}
              <span className="block text-[#8a90a5] line-through">{line.before}</span>
              <span className="block font-medium">→ {line.after}</span>
            </span>
          ))}
        </span>
      ) : null}
      <span className="mt-1 block text-xs text-[#5d6880]">{note.when}</span>
    </span>
  );
}

export function EditableName({
  action,
  name,
  hidden,
  note,
  href,
  onClick,
  className = "font-medium",
  canEdit = true,
  remove,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  hidden: Record<string, string>;
  note: NoteView | null;
  href?: string;
  onClick?: (event: { preventDefault: () => void; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) => void;
  className?: string;
  canEdit?: boolean;
  remove?: {
    action: (formData: FormData) => void | Promise<void>;
    id: number;
    categoryId?: number;
    confirm: string;
  };
}) {
  const [editing, setEditing] = useState(false);
  const dotted = note ? "underline decoration-dotted decoration-[#1c2c86] underline-offset-4" : "";
  const label = <span className={`${className} ${dotted}`}>{name}</span>;

  if (!canEdit) {
    return (
      <span className="group/tip relative inline-flex max-w-full min-w-0">
        {href ? <Link href={href} onClick={onClick} className="hover:text-[#15246d]">{label}</Link> : label}
        {note ? <NoteTip note={note} /> : null}
      </span>
    );
  }

  if (editing) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        {Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <input name="name" required defaultValue={name} autoFocus aria-label="Name" className={`${field} w-64`} />
        <button type="submit" className={btn}>Save</button>
        <button type="button" className={btnQuiet} onClick={() => setEditing(false)}>Cancel</button>
      </form>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <button
        type="button"
        aria-label="Change name"
        title="Name change karo"
        onClick={() => setEditing(true)}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#1c2c86] hover:bg-[#e8ebf7]"
      >
        <Pencil />
      </button>
      {remove ? (
        <DeleteButton
          action={remove.action}
          id={remove.id}
          categoryId={remove.categoryId}
          label="Delete"
          confirm={remove.confirm}
          icon
        />
      ) : null}
      <span className="group/tip relative min-w-0">
        {href ? (
          <Link href={href} onClick={onClick} className="hover:text-[#15246d]">{label}</Link>
        ) : (
          label
        )}
        {note ? <NoteTip note={note} /> : null}
      </span>
    </span>
  );
}
