import { db } from "@/db";
import { settings } from "@/db/schema";

export const DEFAULT_SETTINGS = {
  namaLembaga: "Lentera Syahdu",
  namaProgram: "Kelas Tahsin Online",
  biayaBulanan: "500000",
  jumlahPertemuan: "18",
  durasiMenit: "60",
  hariBelajar: "Senin - Kamis",
  tarifBisyarah: "25000",
  minCatatan: "15",
  noWa: "6281234567890",
  email: "admin@lenterasyahdu.id",
  alamat: "Indonesia",
  bankNama: "Bank Syariah Indonesia (BSI)",
  bankNoRek: "7123456789",
  bankAtasNama: "Lentera Syahdu",
  instagram: "https://instagram.com/lenterasyahdu",
  youtube: "https://youtube.com/@lenterasyahdu",
  tiktok: "https://tiktok.com/@lenterasyahdu",
  statSantri: "500+",
  statPengajar: "30+",
  statKepuasan: "98%",
  statRating: "4.9",
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingsKey, string>;

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];

export async function getSettings(): Promise<Settings> {
  const result: Settings = { ...DEFAULT_SETTINGS };
  try {
    const rows = await db.select().from(settings);
    for (const r of rows) {
      if ((SETTINGS_KEYS as string[]).includes(r.key)) {
        result[r.key as SettingsKey] = r.value;
      }
    }
  } catch (e) {
    console.error("Gagal memuat pengaturan", e);
  }
  return result;
}

export function toNum(s: string | undefined, fallback = 0): number {
  const n = parseInt(String(s ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function getNumbers() {
  const s = await getSettings();
  return {
    s,
    biaya: toNum(s.biayaBulanan, 500000),
    pertemuan: toNum(s.jumlahPertemuan, 18),
    durasi: toNum(s.durasiMenit, 60),
    tarif: toNum(s.tarifBisyarah, 25000),
    minCatatan: toNum(s.minCatatan, 15),
  };
}
