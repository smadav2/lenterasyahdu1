"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, gte, inArray, lte, ne, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { absensi, pengajar, santri, sessions, users } from "@/db/schema";
import { hashPassword, requirePengajar, verifyPassword } from "@/lib/auth";
import { addDays, intOr, isValidDate, normalizeWa, periodeRange, rupiah, str, strOrNull, todayJakarta } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { withMsg } from "@/lib/url";

export type AbsensiState = { error?: string; values?: Record<string, string>; n?: number };

const FIELDS = ["id", "santriId", "tanggal", "jamMulai", "status", "materi", "capaian", "nilai", "catatan", "klaim"] as const;

export async function simpanAbsensi(prev: AbsensiState, fd: FormData): Promise<AbsensiState> {
  const me = await requirePengajar();
  const v: Record<string, string> = {};
  for (const k of FIELDS) v[k] = str(fd.get(k));
  const n = (prev.n ?? 0) + 1;
  const err = (error: string): AbsensiState => ({ error, values: v, n });

  const id = intOr(v.id, 0);
  const santriId = intOr(v.santriId, 0);
  const { tarif, minCatatan, pertemuan } = await getNumbers();
  const today = todayJakarta();

  const [s] = await db
    .select({ id: santri.id, nama: santri.nama, pengajarId: santri.pengajarId })
    .from(santri)
    .where(eq(santri.id, santriId))
    .limit(1);
  if (!s || s.pengajarId !== me.pengajarId) return err("Pilih santri yang Anda ajar.");
  if (!isValidDate(v.tanggal)) return err("Tanggal pertemuan tidak valid.");
  if (v.tanggal > today) return err("Tanggal pertemuan tidak boleh melebihi hari ini.");
  if (v.tanggal < addDays(today, -45)) return err("Absensi hanya dapat diisi maksimal 45 hari ke belakang. Silakan hubungi admin.");
  if (!["hadir", "izin", "sakit", "alpa"].includes(v.status)) return err("Pilih status kehadiran santri.");

  const klaim = v.klaim === "on";
  const catatan = v.catatan;
  if (klaim) {
    if (v.status !== "hadir") return err("Bisyarah hanya dapat diklaim untuk pertemuan dengan status Hadir.");
    if (!v.materi) return err("Isi materi pertemuan untuk mengklaim bisyarah.");
    if (catatan.length < minCatatan) {
      return err(`Catatan pertemuan minimal ${minCatatan} karakter untuk mengklaim bisyarah (saat ini ${catatan.length}).`);
    }
    const { start, end } = periodeRange(v.tanggal.slice(0, 7));
    const conds: SQL[] = [
      eq(absensi.santriId, santriId),
      gte(absensi.tanggal, start),
      lte(absensi.tanggal, end),
      inArray(absensi.klaimStatus, ["diajukan", "disetujui", "dibayar"]),
    ];
    if (id) conds.push(ne(absensi.id, id));
    const [{ c }] = await db.select({ c: count() }).from(absensi).where(and(...conds));
    if (c >= pertemuan) return err(`Klaim bisyarah untuk ${s.nama} pada bulan ini sudah mencapai batas ${pertemuan} pertemuan.`);
  }

  const dupConds: SQL[] = [eq(absensi.santriId, santriId), eq(absensi.tanggal, v.tanggal)];
  if (id) dupConds.push(ne(absensi.id, id));
  const [dup] = await db.select({ id: absensi.id }).from(absensi).where(and(...dupConds)).limit(1);
  if (dup) return err(`Absensi ${s.nama} pada tanggal tersebut sudah ada. Silakan edit data yang sudah ada di riwayat.`);

  const values = {
    santriId,
    pengajarId: me.pengajarId,
    tanggal: v.tanggal,
    jamMulai: /^\d{2}:\d{2}$/.test(v.jamMulai) ? v.jamMulai : null,
    status: v.status,
    materi: v.status === "hadir" ? v.materi.slice(0, 120) || null : null,
    capaian: v.status === "hadir" ? v.capaian.slice(0, 200) || null : null,
    nilai: v.status === "hadir" ? v.nilai.slice(0, 60) || null : null,
    catatan: catatan || null,
    klaimStatus: klaim ? "diajukan" : "none",
    nominal: klaim ? tarif : 0,
    alasanTolak: null,
    updatedAt: new Date(),
  };

  if (id) {
    const [old] = await db
      .select({ k: absensi.klaimStatus })
      .from(absensi)
      .where(and(eq(absensi.id, id), eq(absensi.pengajarId, me.pengajarId)))
      .limit(1);
    if (!old) return err("Data absensi tidak ditemukan.");
    if (old.k === "disetujui" || old.k === "dibayar") return err("Absensi yang klaimnya sudah disetujui/dibayar tidak dapat diubah.");
    await db.update(absensi).set(values).where(eq(absensi.id, id));
  } else {
    await db.insert(absensi).values(values);
  }

  revalidatePath("/pengajar", "layout");
  const msg = klaim
    ? `Absensi ${s.nama} tersimpan & klaim bisyarah ${rupiah(tarif)} berhasil diajukan.`
    : `Absensi ${s.nama} berhasil disimpan.`;
  redirect(withMsg(`/pengajar/absensi?bulan=${v.tanggal.slice(0, 7)}`, "ok", msg));
}

function backOf(fd: FormData, fallback: string): string {
  const b = str(fd.get("back"));
  return b.startsWith("/pengajar") ? b : fallback;
}

export async function hapusAbsensi(fd: FormData) {
  const me = await requirePengajar();
  const back = backOf(fd, "/pengajar/absensi");
  const id = intOr(str(fd.get("id")), 0);
  const [a] = await db
    .select({ k: absensi.klaimStatus })
    .from(absensi)
    .where(and(eq(absensi.id, id), eq(absensi.pengajarId, me.pengajarId)))
    .limit(1);
  if (!a) redirect(withMsg(back, "err", "Absensi tidak ditemukan."));
  if (a.k === "disetujui" || a.k === "dibayar") {
    redirect(withMsg(back, "err", "Absensi yang klaimnya sudah disetujui/dibayar tidak dapat dihapus."));
  }
  await db.delete(absensi).where(eq(absensi.id, id));
  revalidatePath("/pengajar", "layout");
  redirect(withMsg(back, "ok", "Absensi berhasil dihapus."));
}

export async function updateProfil(fd: FormData) {
  const me = await requirePengajar();
  await db
    .update(pengajar)
    .set({
      noWa: normalizeWa(str(fd.get("noWa"))) || null,
      email: strOrNull(fd.get("email")),
      alamat: strOrNull(fd.get("alamat")),
      bank: strOrNull(fd.get("bank")),
      noRekening: strOrNull(fd.get("noRekening")),
      atasNama: strOrNull(fd.get("atasNama")),
    })
    .where(eq(pengajar.id, me.pengajarId));
  redirect(withMsg("/pengajar/profil", "ok", "Profil berhasil diperbarui."));
}

export async function gantiPasswordPengajar(fd: FormData) {
  const me = await requirePengajar();
  const P = "/pengajar/profil";
  const lama = typeof fd.get("lama") === "string" ? (fd.get("lama") as string) : "";
  const baru = typeof fd.get("baru") === "string" ? (fd.get("baru") as string) : "";
  const konf = typeof fd.get("konfirmasi") === "string" ? (fd.get("konfirmasi") as string) : "";
  const [u] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!u || !verifyPassword(lama, u.passwordHash)) redirect(withMsg(P, "err", "Password lama salah."));
  if (baru.length < 6) redirect(withMsg(P, "err", "Password baru minimal 6 karakter."));
  if (baru !== konf) redirect(withMsg(P, "err", "Konfirmasi password baru tidak cocok."));
  await db.update(users).set({ passwordHash: hashPassword(baru) }).where(eq(users.id, me.id));
  await db.delete(sessions).where(and(eq(sessions.userId, me.id), ne(sessions.id, "")));
  redirect("/login");
}
