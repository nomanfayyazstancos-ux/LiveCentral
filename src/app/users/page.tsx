import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UserList } from "@/components/user-list";
import { requireUser } from "@/lib/auth";
import { listPending, listUsers, loadMenu } from "@/lib/db";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  const query = await searchParams;
  const menu = await loadMenu();

  return (
    <AppShell tree={menu.tree} activeId={null} categoryCount={menu.categories.length} query="">
      <UserList
        users={await listUsers()}
        pending={await listPending()}
        currentId={user.id}
        canEdit
        error={one(query.error)}
        saved={one(query.saved)}
      />
    </AppShell>
  );
}
