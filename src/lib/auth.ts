import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, signIn, userBySession, type User } from "@/lib/db";

const sessionCookie = "menu_session";

export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(sessionCookie)?.value ?? "";
  if (!token) return null;
  return await userBySession(token);
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

async function saveSession(token: string) {
  const jar = await cookies();
  jar.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function startSession(name: string, email: string) {
  await saveSession(await signIn(name, email));
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value ?? "";
  await endSession(token);
  jar.delete(sessionCookie);
}
