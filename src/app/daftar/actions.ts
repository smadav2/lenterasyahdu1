"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { pendaftaran } from "@/db/schema";
import { JAM_OPTIONS, LAMA_BULAN_OPTIONS, SUMBER_INFO } from "@/lib/constants";
import { isValidDate, normalizeWa, str, todayJakarta } from "@/lib/format";

export type DaftarState = { error?: string; values?: Record<string, string>; n?: number };

const FIELDS = [
  "nama",
  "namaPanggilan",
  "tanggalLahir",
  "jenisKelamin",
  "kota",
  "pernahBelajar",
  "levelSebelumnya",
  "namaWali",
  "noWa",
  "email",
  "jamPreferensi",
  "lamaBulan",
  "tujuan",
  "sumberInfo",
] as const;

export async function daftarAction(prev: DaftarState, fd: FormData): Promise<DaftarState> {
  const v: Record<string, string> = {};
  for (const k of FIELDS) v[k] = str(fd.get(k));
  const n = (prev.n ?? 0) + 1;
  const err = (error: string): DaftarState => ({ error, values: v, n });

  if (v.nama.length < 3) return err("Nama lengkap santri wajib diisi (minimal 3 huruf).");
  if (!v.namaPanggilan) return err("Nama panggilan wajib diisi.");
  if (!isValidDate(v.tanggalLahir) || v.tanggalLahir >= todayJakarta()) return err("Tanggal lahir santri tidak valid.");
  if (v.jenisKelamin !== "L" && v.jenisKelamin !== "P") return err("Pilih jenis kelamin santri.");
  if (!v.kota) return err("Kota domisili wajib diisi.");
  if (v.pernahBelajar === "sudah" && !v.levelSebelumnya) return err("Isi level / tingkat belajar sebelumnya.");
  if (v.namaWali.length < 3) return err("Nama orang tua / wali wajib diisi.");
  const wa = normalizeWa(v.noWa);
  if (wa.length < 9 || wa.length > 15) return err("Nomor WhatsApp tidak valid. Contoh: 081234567890");
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return err("Format email tidak valid.");
  if (!JAM_OPTIONS.includes(v.jamPreferensi)) return err("Pilih jam belajar yang diinginkan.");
  if (!v.tujuan) return err("Tujuan pembelajaran wajib diisi.");
  if (!SUMBER_INFO.includes(v.sumberInfo)) return err("Pilih dari mana Anda mengetahui Lentera Syahdu.");
  if (fd.get("setuju") !== "on") return err("Mohon centang persetujuan sebelum mendaftar.");

  const lama = LAMA_BULAN_OPTIONS.includes(Number(v.lamaBulan)) ? Number(v.lamaBulan) : 1;

  const [row] = await db
    .insert(pendaftaran)
    .values({
      nama: v.nama.slice(0, 120),
      namaPanggilan: v.namaPanggilan.slice(0, 60),
      jenisKelamin: v.jenisKelamin,
      tanggalLahir: v.tanggalLahir,
      kota: v.kota.slice(0, 120),
      pernahBelajar: v.pernahBelajar === "sudah",
      levelSebelumnya: v.pernahBelajar === "sudah" ? v.levelSebelumnya.slice(0, 120) : null,
      namaWali: v.namaWali.slice(0, 120),
      noWa: wa,
      email: v.email || null,
      jamPreferensi: v.jamPreferensi,
      lamaBulan: lama,
      tujuan: v.tujuan,
      sumberInfo: v.sumberInfo,
      status: "menunggu",
    })
    .returning({ id: pendaftaran.id });

  const q = new URLSearchParams({
    no: String(row.id),
    nama: v.namaPanggilan || v.nama,
    bln: String(lama),
    jam: v.jamPreferensi,
  });
  redirect(`/daftar/sukses?${q.toString()}`);
}
