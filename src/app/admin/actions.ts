"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  absensi,
  bisyarahPayout,
  pembayaran,
  pendaftaran,
  pengajar,
  pengumuman,
  santri,
  sessions,
  settings,
  users,
} from "@/db/schema";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { JAM_OPTIONS, METODE_BAYAR } from "@/lib/constants";
import {
  intOr,
  isValidDate,
  isValidPeriode,
  kodeSantri,
  normalizeWa,
  periodeLabel,
  periodeRange,
  rupiah,
  shiftPeriode,
  str,
  strOrNull,
  todayJakarta,
} from "@/lib/format";
import { getNumbers, SETTINGS_KEYS } from "@/lib/settings";
import { withMsg } from "@/lib/url";

/* ---------------- helpers ---------------- */
function backUrl(fd: FormData, fallback: string): string {
  const b = str(fd.get("back"));
  return b.startsWith("/admin") ? b : fallback;
}
function ok(fd: FormData, fallback: string, msg: string): never {
  revalidatePath("/admin", "layout");
  redirect(withMsg(backUrl(fd, fallback), "ok", msg));
}
function fail(fd: FormData, fallback: string, msg: string): never {
  redirect(withMsg(backUrl(fd, fallback), "err", msg));
}
function idOf(fd: FormData, key = "id"): number {
  return intOr(str(fd.get(key)), 0);
}
function pw(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

/* ================= SANTRI ================= */
export async function saveSantri(fd: FormData) {
  await requireAdmin();
  const P = "/admin/santri";
  const id = idOf(fd);
  const nama = str(fd.get("nama"));
  if (nama.length < 2) fail(fd, P, "Nama santri wajib diisi.");
  const tglLahir = str(fd.get("tanggalLahir"));
  const tglMulai = str(fd.get("tanggalMulai"));
  const jam = str(fd.get("jamBelajar"));
  const st = str(fd.get("status"));
  const values = {
    nama: nama.slice(0, 120),
    namaPanggilan: strOrNull(fd.get("namaPanggilan")),
    jenisKelamin: str(fd.get("jenisKelamin")) === "P" ? "P" : "L",
    tanggalLahir: isValidDate(tglLahir) ? tglLahir : null,
    namaWali: strOrNull(fd.get("namaWali")),
    noWa: normalizeWa(str(fd.get("noWa"))) || null,
    email: strOrNull(fd.get("email")),
    kota: strOrNull(fd.get("kota")),
    levelAwal: strOrNull(fd.get("levelAwal")),
    pengajarId: idOf(fd, "pengajarId") || null,
    jamBelajar: JAM_OPTIONS.includes(jam) ? jam : null,
    tanggalMulai: isValidDate(tglMulai) ? tglMulai : null,
    status: ["aktif", "cuti", "nonaktif", "lulus"].includes(st) ? st : "aktif",
    catatan: strOrNull(fd.get("catatan")),
  };
  if (id) {
    await db.update(santri).set(values).where(eq(santri.id, id));
    ok(fd, P, `Data santri ${nama} berhasil diperbarui.`);
  }
  const [row] = await db.insert(santri).values(values).returning({ id: santri.id });
  const kode = kodeSantri(row.id);
  await db.update(santri).set({ kode }).where(eq(santri.id, row.id));
  ok(fd, P, `Santri ${nama} berhasil ditambahkan dengan kode ${kode}.`);
}

export async function deleteSantri(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const [s] = await db.select({ nama: santri.nama }).from(santri).where(eq(santri.id, id)).limit(1);
  if (!s) fail(fd, "/admin/santri", "Santri tidak ditemukan.");
  const [{ n }] = await db
    .select({ n: count() })
    .from(absensi)
    .where(and(eq(absensi.santriId, id), eq(absensi.klaimStatus, "dibayar")));
  if (n > 0) {
    fail(fd, "/admin/santri", `${s.nama} memiliki ${n} absensi yang bisyarahnya sudah dibayar. Ubah status menjadi Nonaktif/Lulus saja.`);
  }
  await db.delete(santri).where(eq(santri.id, id));
  ok(fd, "/admin/santri", `Santri ${s.nama} telah dihapus.`);
}

/* ================= PENGAJAR ================= */
export async function savePengajar(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pengajar";
  const id = idOf(fd);
  const nama = str(fd.get("nama"));
  const username = str(fd.get("username")).toLowerCase();
  const password = pw(fd, "password");
  const status = str(fd.get("status")) === "nonaktif" ? "nonaktif" : "aktif";
  if (nama.length < 2) fail(fd, P, "Nama pengajar wajib diisi.");
  if (!/^[a-z0-9._]{3,32}$/.test(username)) {
    fail(fd, P, "Username 3-32 karakter (huruf kecil, angka, titik, atau garis bawah, tanpa spasi).");
  }
  if (!id && password.length < 6) fail(fd, P, "Password minimal 6 karakter.");
  if (id && password && password.length < 6) fail(fd, P, "Password baru minimal 6 karakter.");
  const tgl = str(fd.get("tanggalBergabung"));
  const profil = {
    nama: nama.slice(0, 120),
    jenisKelamin: str(fd.get("jenisKelamin")) === "P" ? "P" : "L",
    noWa: normalizeWa(str(fd.get("noWa"))) || null,
    email: strOrNull(fd.get("email")),
    alamat: strOrNull(fd.get("alamat")),
    pendidikan: strOrNull(fd.get("pendidikan")),
    pengalaman: strOrNull(fd.get("pengalaman")),
    bank: strOrNull(fd.get("bank")),
    noRekening: strOrNull(fd.get("noRekening")),
    atasNama: strOrNull(fd.get("atasNama")),
    status,
    tanggalBergabung: isValidDate(tgl) ? tgl : null,
  };

  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);

  if (id) {
    const [p] = await db.select().from(pengajar).where(eq(pengajar.id, id)).limit(1);
    if (!p) fail(fd, P, "Pengajar tidak ditemukan.");
    if (taken && taken.id !== p.userId) fail(fd, P, `Username "${username}" sudah digunakan.`);
    let userId = p.userId;
    if (userId) {
      await db
        .update(users)
        .set({
          username,
          nama: profil.nama,
          aktif: status === "aktif",
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        })
        .where(eq(users.id, userId));
    } else {
      if (!password) fail(fd, P, "Isi password untuk membuat akun login pengajar ini.");
      const [u] = await db
        .insert(users)
        .values({ username, nama: profil.nama, role: "pengajar", passwordHash: hashPassword(password), aktif: status === "aktif" })
        .returning({ id: users.id });
      userId = u.id;
    }
    await db.update(pengajar).set({ ...profil, userId }).where(eq(pengajar.id, id));
    if (userId && (status !== "aktif" || password)) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }
    ok(fd, P, `Data ${profil.nama} berhasil diperbarui.`);
  }

  if (taken) fail(fd, P, `Username "${username}" sudah digunakan.`);
  const [u] = await db
    .insert(users)
    .values({ username, nama: profil.nama, role: "pengajar", passwordHash: hashPassword(password), aktif: status === "aktif" })
    .returning({ id: users.id });
  await db.insert(pengajar).values({ ...profil, userId: u.id });
  ok(fd, P, `Pengajar ${profil.nama} berhasil ditambahkan. Username login: ${username}`);
}

export async function deletePengajar(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pengajar";
  const id = idOf(fd);
  const [p] = await db.select().from(pengajar).where(eq(pengajar.id, id)).limit(1);
  if (!p) fail(fd, P, "Pengajar tidak ditemukan.");
  const [{ n }] = await db.select({ n: count() }).from(absensi).where(eq(absensi.pengajarId, id));
  if (n > 0) fail(fd, P, `${p.nama} memiliki ${n} riwayat absensi sehingga tidak dapat dihapus. Ubah status menjadi Nonaktif.`);
  await db.delete(pengajar).where(eq(pengajar.id, id));
  if (p.userId) await db.delete(users).where(eq(users.id, p.userId));
  ok(fd, P, `Pengajar ${p.nama} telah dihapus.`);
}

/* ================= PENDAFTARAN ================= */
export async function terimaPendaftaran(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pendaftaran";
  const id = idOf(fd);
  const [r] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, id)).limit(1);
  if (!r) fail(fd, P, "Data pendaftaran tidak ditemukan.");
  if (r.status === "diterima") fail(fd, P, "Pendaftaran ini sudah diterima sebelumnya.");
  const jam = str(fd.get("jamBelajar"));
  const mulai = str(fd.get("tanggalMulai"));
  const tglMulai = isValidDate(mulai) ? mulai : todayJakarta();
  const { biaya } = await getNumbers();

  const [row] = await db
    .insert(santri)
    .values({
      nama: r.nama,
      namaPanggilan: r.namaPanggilan,
      jenisKelamin: r.jenisKelamin,
      tanggalLahir: r.tanggalLahir,
      namaWali: r.namaWali,
      noWa: r.noWa,
      email: r.email,
      kota: r.kota,
      levelAwal: r.pernahBelajar ? r.levelSebelumnya : "Belum pernah belajar",
      pengajarId: idOf(fd, "pengajarId") || null,
      jamBelajar: JAM_OPTIONS.includes(jam) ? jam : r.jamPreferensi,
      tanggalMulai: tglMulai,
      status: "aktif",
      catatan: r.tujuan ? `Tujuan: ${r.tujuan}` : null,
    })
    .returning({ id: santri.id });
  const kode = kodeSantri(row.id);
  await db.update(santri).set({ kode }).where(eq(santri.id, row.id));
  await db.update(pendaftaran).set({ status: "diterima", santriId: row.id }).where(eq(pendaftaran.id, id));

  const startPer = tglMulai.slice(0, 7);
  const bills = Array.from({ length: Math.max(1, r.lamaBulan) }, (_, i) => ({
    santriId: row.id,
    periode: shiftPeriode(startPer, i),
    nominal: biaya,
    status: "belum",
  }));
  await db.insert(pembayaran).values(bills).onConflictDoNothing();
  ok(fd, P, `${r.nama} diterima sebagai santri (kode ${kode}). ${bills.length} tagihan SPP otomatis dibuat.`);
}

export async function tolakPendaftaran(fd: FormData) {
  await requireAdmin();
  await db.update(pendaftaran).set({ status: "ditolak" }).where(eq(pendaftaran.id, idOf(fd)));
  ok(fd, "/admin/pendaftaran", "Pendaftaran ditandai ditolak.");
}

export async function hapusPendaftaran(fd: FormData) {
  await requireAdmin();
  await db.delete(pendaftaran).where(eq(pendaftaran.id, idOf(fd)));
  ok(fd, "/admin/pendaftaran", "Data pendaftaran dihapus.");
}

/* ================= ABSENSI ================= */
export async function hapusAbsensiAdmin(fd: FormData) {
  await requireAdmin();
  const P = "/admin/absensi";
  const id = idOf(fd);
  const [a] = await db.select({ k: absensi.klaimStatus }).from(absensi).where(eq(absensi.id, id)).limit(1);
  if (!a) fail(fd, P, "Absensi tidak ditemukan.");
  if (a.k === "dibayar") fail(fd, P, "Absensi yang bisyarahnya sudah dibayar tidak dapat dihapus. Batalkan pembayaran terlebih dahulu.");
  await db.delete(absensi).where(eq(absensi.id, id));
  ok(fd, P, "Absensi dihapus.");
}

/* ================= BISYARAH ================= */
export async function setKlaim(fd: FormData) {
  await requireAdmin();
  const P = "/admin/bisyarah";
  const id = idOf(fd);
  const status = str(fd.get("status"));
  if (!["disetujui", "ditolak", "diajukan"].includes(status)) fail(fd, P, "Status klaim tidak valid.");
  const [a] = await db.select().from(absensi).where(eq(absensi.id, id)).limit(1);
  if (!a) fail(fd, P, "Klaim tidak ditemukan.");
  if (a.klaimStatus === "dibayar") fail(fd, P, "Klaim yang sudah dibayar tidak dapat diubah.");
  const { tarif } = await getNumbers();
  await db
    .update(absensi)
    .set({
      klaimStatus: status,
      alasanTolak: status === "ditolak" ? strOrNull(fd.get("alasan")) ?? "Catatan pertemuan belum memenuhi syarat." : null,
      nominal: a.nominal || tarif,
      updatedAt: new Date(),
    })
    .where(eq(absensi.id, id));
  ok(fd, P, status === "disetujui" ? "Klaim disetujui." : status === "ditolak" ? "Klaim ditolak." : "Klaim dikembalikan ke status menunggu.");
}

export async function setujuiSemua(fd: FormData) {
  await requireAdmin();
  const P = "/admin/bisyarah";
  const pengajarId = idOf(fd, "pengajarId");
  const periode = str(fd.get("periode"));
  if (!isValidPeriode(periode)) fail(fd, P, "Periode tidak valid.");
  const { start, end } = periodeRange(periode);
  const res = await db
    .update(absensi)
    .set({ klaimStatus: "disetujui", alasanTolak: null, updatedAt: new Date() })
    .where(
      and(
        eq(absensi.pengajarId, pengajarId),
        eq(absensi.klaimStatus, "diajukan"),
        gte(absensi.tanggal, start),
        lte(absensi.tanggal, end),
      ),
    )
    .returning({ id: absensi.id });
  ok(fd, P, `${res.length} klaim bisyarah disetujui.`);
}

export async function bayarBisyarah(fd: FormData) {
  await requireAdmin();
  const P = "/admin/bisyarah";
  const pengajarId = idOf(fd, "pengajarId");
  const periode = str(fd.get("periode"));
  if (!isValidPeriode(periode)) fail(fd, P, "Periode tidak valid.");
  const tglInput = str(fd.get("tanggalBayar"));
  const tanggalBayar = isValidDate(tglInput) ? tglInput : todayJakarta();
  const keterangan = strOrNull(fd.get("keterangan"));
  const { start, end } = periodeRange(periode);
  const rows = await db
    .select({ id: absensi.id, nominal: absensi.nominal })
    .from(absensi)
    .where(
      and(
        eq(absensi.pengajarId, pengajarId),
        eq(absensi.klaimStatus, "disetujui"),
        gte(absensi.tanggal, start),
        lte(absensi.tanggal, end),
      ),
    );
  if (!rows.length) fail(fd, P, "Tidak ada klaim berstatus Disetujui untuk dibayarkan.");
  const total = rows.reduce((a, r) => a + r.nominal, 0);
  await db.transaction(async (tx) => {
    const [po] = await tx
      .insert(bisyarahPayout)
      .values({ pengajarId, periode, jumlahPertemuan: rows.length, total, tanggalBayar, keterangan })
      .returning({ id: bisyarahPayout.id });
    await tx
      .update(absensi)
      .set({ klaimStatus: "dibayar", payoutId: po.id, updatedAt: new Date() })
      .where(inArray(absensi.id, rows.map((r) => r.id)));
  });
  ok(fd, P, `Bisyarah ${rows.length} pertemuan (${rupiah(total)}) berhasil ditandai sudah dibayar.`);
}

export async function batalkanPayout(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  await db.transaction(async (tx) => {
    await tx
      .update(absensi)
      .set({ klaimStatus: "disetujui", payoutId: null, updatedAt: new Date() })
      .where(eq(absensi.payoutId, id));
    await tx.delete(bisyarahPayout).where(eq(bisyarahPayout.id, id));
  });
  ok(fd, "/admin/bisyarah", "Pembayaran dibatalkan. Klaim dikembalikan ke status Disetujui.");
}

/* ================= PEMBAYARAN SPP ================= */
export async function buatTagihan(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pembayaran";
  const periode = str(fd.get("periode"));
  if (!isValidPeriode(periode)) fail(fd, P, "Periode tidak valid.");
  const { biaya } = await getNumbers();
  const aktif = await db.select({ id: santri.id }).from(santri).where(eq(santri.status, "aktif"));
  if (!aktif.length) fail(fd, P, "Belum ada santri aktif.");
  const res = await db
    .insert(pembayaran)
    .values(aktif.map((s) => ({ santriId: s.id, periode, nominal: biaya, status: "belum" })))
    .onConflictDoNothing()
    .returning({ id: pembayaran.id });
  ok(
    fd,
    P,
    res.length
      ? `${res.length} tagihan baru dibuat untuk ${periodeLabel(periode)}.`
      : `Semua santri aktif sudah memiliki tagihan ${periodeLabel(periode)}.`,
  );
}

export async function tandaiLunas(fd: FormData) {
  await requireAdmin();
  const tgl = str(fd.get("tanggalBayar"));
  const metode = str(fd.get("metode"));
  await db
    .update(pembayaran)
    .set({
      status: "lunas",
      tanggalBayar: isValidDate(tgl) ? tgl : todayJakarta(),
      metode: METODE_BAYAR.includes(metode) ? metode : "Transfer Bank",
      keterangan: strOrNull(fd.get("keterangan")),
    })
    .where(eq(pembayaran.id, idOf(fd)));
  ok(fd, "/admin/pembayaran", "Pembayaran ditandai lunas.");
}

export async function batalLunas(fd: FormData) {
  await requireAdmin();
  await db
    .update(pembayaran)
    .set({ status: "belum", tanggalBayar: null, metode: null })
    .where(eq(pembayaran.id, idOf(fd)));
  ok(fd, "/admin/pembayaran", "Status pembayaran dikembalikan menjadi Belum Bayar.");
}

export async function hapusTagihan(fd: FormData) {
  await requireAdmin();
  await db.delete(pembayaran).where(eq(pembayaran.id, idOf(fd)));
  ok(fd, "/admin/pembayaran", "Tagihan dihapus.");
}

/* ================= PENGUMUMAN ================= */
export async function savePengumuman(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pengumuman";
  const id = idOf(fd);
  const judul = str(fd.get("judul"));
  const isi = str(fd.get("isi"));
  if (!judul || !isi) fail(fd, P, "Judul dan isi pengumuman wajib diisi.");
  const values = { judul: judul.slice(0, 200), isi, penting: fd.get("penting") === "on" };
  if (id) {
    await db.update(pengumuman).set(values).where(eq(pengumuman.id, id));
    ok(fd, P, "Pengumuman diperbarui.");
  }
  await db.insert(pengumuman).values(values);
  ok(fd, P, "Pengumuman dipublikasikan ke seluruh pengajar.");
}

export async function deletePengumuman(fd: FormData) {
  await requireAdmin();
  await db.delete(pengumuman).where(eq(pengumuman.id, idOf(fd)));
  ok(fd, "/admin/pengumuman", "Pengumuman dihapus.");
}

/* ================= PENGATURAN ================= */
export async function saveSettings(fd: FormData) {
  await requireAdmin();
  for (const key of SETTINGS_KEYS) {
    const v = fd.get(key);
    if (typeof v !== "string") continue;
    const value = v.trim();
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  revalidatePath("/", "layout");
  ok(fd, "/admin/pengaturan", "Pengaturan berhasil disimpan.");
}

export async function gantiPasswordAdmin(fd: FormData) {
  const me = await requireAdmin();
  const P = "/admin/pengaturan";
  const lama = pw(fd, "lama");
  const baru = pw(fd, "baru");
  const konf = pw(fd, "konfirmasi");
  const [u] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!u || !verifyPassword(lama, u.passwordHash)) fail(fd, P, "Password lama salah.");
  if (baru.length < 6) fail(fd, P, "Password baru minimal 6 karakter.");
  if (baru !== konf) fail(fd, P, "Konfirmasi password baru tidak cocok.");
  await db.update(users).set({ passwordHash: hashPassword(baru) }).where(eq(users.id, me.id));
  ok(fd, P, "Password admin berhasil diganti.");
}

export async function tambahAdmin(fd: FormData) {
  await requireAdmin();
  const P = "/admin/pengaturan";
  const nama = str(fd.get("nama"));
  const username = str(fd.get("username")).toLowerCase();
  const password = pw(fd, "password");
  if (nama.length < 2) fail(fd, P, "Nama admin wajib diisi.");
  if (!/^[a-z0-9._]{3,32}$/.test(username)) fail(fd, P, "Username 3-32 karakter (huruf kecil, angka, titik, garis bawah).");
  if (password.length < 6) fail(fd, P, "Password minimal 6 karakter.");
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (taken) fail(fd, P, `Username "${username}" sudah digunakan.`);
  await db.insert(users).values({ username, nama, role: "admin", passwordHash: hashPassword(password) });
  ok(fd, P, `Admin ${nama} berhasil ditambahkan.`);
}

export async function hapusAdmin(fd: FormData) {
  const me = await requireAdmin();
  const P = "/admin/pengaturan";
  const id = idOf(fd);
  if (id === me.id) fail(fd, P, "Tidak dapat menghapus akun yang sedang digunakan.");
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "admin")));
  ok(fd, P, "Akun admin dihapus.");
}
