import { redirect } from "next/navigation";
import { UserList } from "@/components/user-list";
import { requireUser } from "@/lib/auth";
import { listPending, listUsers } from "@/lib/db";

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

  return (
    <UserList
      users={await listUsers()}
      pending={await listPending()}
      currentId={user.id}
      canEdit
      error={one(query.error)}
      saved={one(query.saved)}
    />
  );
}
