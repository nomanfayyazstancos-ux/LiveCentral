import { approveAccount, rejectAccount, saveUserRole } from "@/app/actions";
import { btn, btnDanger, field } from "@/components/ui";
import type { User } from "@/lib/db";

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function RoleBadge({ role }: { role: User["role"] }) {
  const label = role === "admin" ? "Admin" : role === "edit" ? "Edit" : "View";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${role === "view" ? "bg-[#f4f6fb] text-[#5d6880]" : "bg-[#e8ebf7] text-[#1c2c86]"}`}>
      {label}
    </span>
  );
}

export function UserList({
  users,
  pending,
  currentId,
  canEdit,
  error,
  saved,
}: {
  users: User[];
  pending: User[];
  currentId: number;
  canEdit: boolean;
  error: string;
  saved: string;
}) {
  const savedText =
    saved === "approved"
      ? "Account approve ho gaya. Ab woh login kar sakta hai."
      : saved === "rejected"
        ? "Request reject ho gayi."
        : saved === "role"
          ? "Role save ho gayi."
          : "";

  return (
    <section>
      {error ? (
        <p className="mb-4 rounded-lg border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-sm text-[#c62828]">{error}</p>
      ) : null}
      {savedText ? (
        <p className="mb-4 rounded-lg border border-[#c9e8d4] bg-[#f3fbf6] px-4 py-3 text-sm text-[#1b7a3a]">{savedText}</p>
      ) : null}
      {canEdit ? (
        <div className="mb-8">
          <h2 className="text-2xl font-medium text-[#1c2c86]">Approval</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6880]">
            Nayi sign up request yahan aati hai. Approve karne ke baad hi account banta hai. Role yahin se Edit ya View set karo.
          </p>
          {pending.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#e3e6ef] bg-white px-4 py-5 text-sm text-[#5d6880]">Koi request pending nahi.</p>
          ) : (
            <ul className="mt-4 overflow-hidden rounded-xl border border-[#e3e6ef] bg-white">
              {pending.map((user) => (
                <li key={user.id} className="grid grid-cols-1 items-center gap-3 border-b border-[#eef1f6] px-3 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-[#5d6880]">{when(user.createdAt)}</p>
                  </div>
                  <p className="truncate text-sm text-[#5d6880]">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={approveAccount} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <select name="role" defaultValue={user.role} aria-label={`${user.name} ka role`} className={`${field} w-28 py-1.5`}>
                        <option value="edit">Edit</option>
                        <option value="view">View</option>
                      </select>
                      <button type="submit" className={`${btn} px-3 py-1.5`}>Approve</button>
                    </form>
                    <form action={rejectAccount}>
                      <input type="hidden" name="id" value={user.id} />
                      <button type="submit" className={`${btnDanger} px-3 py-1.5`}>Reject</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <h2 className="text-2xl font-medium text-[#1c2c86]">Users</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6880]">
        Yahan woh sab log hain jinhon ne account banaya hai. Admin users approve karta hai. Edit category aur product change kar sakta hai. View sirf dekh sakta hai.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#e3e6ef] bg-white">
        <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_auto_6.5rem] items-center gap-3 border-b border-[#e3e6ef] bg-[#f7f8fc] px-3 py-2 text-xs font-medium tracking-wide text-[#5d6880] uppercase lg:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
        </div>
        <ul>
          {users.map((user) => {
            const mine = user.id === currentId;
            return (
              <li
                key={user.id}
                className="grid grid-cols-1 items-center gap-x-3 gap-y-1 border-b border-[#eef1f6] px-3 py-2 last:border-b-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_auto_6.5rem]"
              >
                <p className="truncate text-sm font-medium">
                  {user.name}
                  {mine ? <span className="ml-2 text-xs font-medium text-[#1c2c86]">Aap</span> : null}
                </p>
                <p className="truncate text-sm text-[#5d6880]">{user.email}</p>
                {canEdit && !mine && user.role !== "admin" ? (
                  <form action={saveUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <select name="role" defaultValue={user.role} aria-label={`${user.name} ka role`} className={`${field} w-28 py-1.5`}>
                      <option value="edit">Edit</option>
                      <option value="view">View</option>
                    </select>
                    <button type="submit" className={`${btn} px-3 py-1.5`}>Save</button>
                  </form>
                ) : (
                  <RoleBadge role={user.role} />
                )}
                <p className="text-xs text-[#5d6880]">{when(user.createdAt)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
