"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pengajar, users } from "@/db/schema";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { str } from "@/lib/format";
import { ensureSeed } from "@/lib/seed";

export type LoginState = { error?: string; username?: string; n?: number };

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  await ensureSeed();
  const username = str(formData.get("username")).toLowerCase();
  const pw = formData.get("password");
  const password = typeof pw === "string" ? pw : "";
  const n = (prev.n ?? 0) + 1;

  if (!username || !password) return { error: "Username dan password wajib diisi.", username, n };

  const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!u || !verifyPassword(password, u.passwordHash)) {
    return { error: "Username atau password salah.", username, n };
  }
  if (!u.aktif) return { error: "Akun Anda dinonaktifkan. Silakan hubungi admin.", username, n };

  if (u.role === "pengajar") {
    const [p] = await db
      .select({ status: pengajar.status })
      .from(pengajar)
      .where(eq(pengajar.userId, u.id))
      .limit(1);
    if (!p || p.status !== "aktif") {
      return { error: "Akun pengajar tidak aktif. Silakan hubungi admin.", username, n };
    }
  }

  await createSession(u.id);
  redirect(u.role === "admin" ? "/admin" : "/pengajar");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
