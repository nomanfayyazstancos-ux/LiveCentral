import { recentActivity, type Activity } from "@/lib/db";

export type { ActivityNote, NoteView } from "@/components/activity-note";
export { ChangeNote, findNote, findRemoved, noteView } from "@/components/activity-note";

export async function notesForPage() {
  const items = await recentActivity(80);
  return {
    on(id: number, kind: "category" | "product") {
      return items.find((item) => item.targetId === id && item.kind === kind) ?? null;
    },
    removed(placeId: number, kind: "category" | "product") {
      return items.find((item) => item.action === "deleted" && item.kind === kind && item.placeId === placeId) ?? null;
    },
  };
}

export type { Activity };
