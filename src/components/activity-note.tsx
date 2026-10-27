export type ActivityNote = {
  action: string;
  kind: string;
  name: string;
  detail: string;
  actor: string;
  createdAt: string;
  targetId: number | null;
  placeId: number | null;
};

export type NoteView = {
  title: string;
  lines: { label: string; before: string; after: string }[];
  when: string;
};

function whenLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function person(actor: string) {
  const name = actor.replace(/\s*\([^)]*@[^)]*\)\s*$/, "").trim();
  return name || "Koi";
}

function thingLabel(kind: string) {
  return kind === "product" ? "product" : "category";
}

function title(item: ActivityNote) {
  const who = person(item.actor);
  const thing = thingLabel(item.kind);
  if (item.action === "deleted") return `${who} ne ${item.name} delete kiya`;
  if (item.action === "added") return `${who} ne yeh ${thing} add kiya`;
  return `${who} ne yeh ${thing} change kiya`;
}

function changeLines(detail: string) {
  return detail
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("→"));
}

function splitChange(line: string) {
  const splitAt = line.indexOf(": ");
  const label = splitAt === -1 ? "" : line.slice(0, splitAt);
  const rest = splitAt === -1 ? line : line.slice(splitAt + 2);
  const arrow = rest.indexOf(" → ");
  return {
    label,
    before: arrow === -1 ? rest : rest.slice(0, arrow),
    after: arrow === -1 ? "" : rest.slice(arrow + 3),
  };
}

export function noteView(item: ActivityNote | null): NoteView | null {
  if (!item) return null;
  return {
    title: title(item),
    lines: changeLines(item.detail).map(splitChange),
    when: whenLabel(item.createdAt),
  };
}

function ChangeLine({ line }: { line: string }) {
  const { label, before, after } = splitChange(line);
  return (
    <li className="text-[#1a1a1a]">
      {label ? <p className="text-[#5d6880]">{label}</p> : null}
      <p className="text-[#8a90a5] line-through">{before}</p>
      <p className="font-medium">→ {after}</p>
    </li>
  );
}

export function ChangeNote({ item }: { item: ActivityNote | null }) {
  if (!item) return null;
  const lines = changeLines(item.detail);
  return (
    <div className="mt-2 max-w-xl rounded-xl border border-[#d9deea] bg-[#f7f8fc] px-3 py-2">
      <p className="text-sm font-medium text-[#1c2c86]">{title(item)}</p>
      {lines.length > 0 ? (
        <ul className="mt-1 space-y-0.5 text-xs leading-5">
          {lines.map((line) => (
            <ChangeLine key={line} line={line} />
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-[#5d6880]">{whenLabel(item.createdAt)}</p>
    </div>
  );
}

export function findNote(items: ActivityNote[], id: number, kind: "category" | "product") {
  return items.find((item) => item.targetId === id && item.kind === kind) ?? null;
}

export function findRemoved(items: ActivityNote[], placeId: number, kind: "category" | "product") {
  return items.find((item) => item.action === "deleted" && item.kind === kind && item.placeId === placeId) ?? null;
}
