import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/login-panel";
import { currentUser } from "@/lib/auth";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await currentUser()) redirect("/");
  const query = await searchParams;
  const error = one(query.error);
  const form = one(query.form) === "signup" ? "signup" : "login";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#d9e0f6_0%,#eef2fb_40%,#f7f8fc_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(28,44,134,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,44,134,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-[#1c2c86]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#2b3991]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] bottom-0 h-80 w-80 rounded-full bg-[#1c2c86]/15 blur-3xl" />
      <div className="relative">
        <LoginPanel error={error} sent={one(query.sent) === "1"} initialForm={form} />
      </div>
    </main>
  );
}
