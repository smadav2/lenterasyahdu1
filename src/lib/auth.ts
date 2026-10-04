import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { pengajar, sessions, users } from "@/db/schema";

const COOKIE = "ls_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 hari

export type Role = "admin" | "pengajar";

export type SessionUser = {
  id: number;
  username: string;
  nama: string;
  role: Role;
  pengajarId: number | null;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  if (target.length !== test.length) return false;
  return crypto.timingSafeEqual(test, target);
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE_SEC * 1000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      nama: users.nama,
      role: users.role,
      aktif: users.aktif,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.aktif) return null;

  let pengajarId: number | null = null;
  if (row.role === "pengajar") {
    const p = await db
      .select({ id: pengajar.id, status: pengajar.status })
      .from(pengajar)
      .where(eq(pengajar.userId, row.id))
      .limit(1);
    if (!p[0] || p[0].status !== "aktif") return null;
    pengajarId = p[0].id;
  }
  return { id: row.id, username: row.username, nama: row.nama, role: row.role, pengajarId };
});

export async function requireAdmin(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login");
  return u;
}

export async function requirePengajar(): Promise<SessionUser & { pengajarId: number }> {
  const u = await getCurrentUser();
  if (!u || u.role !== "pengajar" || !u.pengajarId) redirect("/login");
  return { ...u, pengajarId: u.pengajarId };
}
