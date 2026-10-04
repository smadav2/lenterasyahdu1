export type Tone = { label: string; cls: string };

export const STATUS_ABSENSI: Record<string, Tone> = {
  hadir: { label: "Hadir", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  izin: { label: "Izin", cls: "bg-sky-100 text-sky-700 ring-sky-200" },
  sakit: { label: "Sakit", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  alpa: { label: "Alpa", cls: "bg-rose-100 text-rose-700 ring-rose-200" },
};

export const KLAIM_STATUS: Record<string, Tone> = {
  none: { label: "Tidak diklaim", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  diajukan: { label: "Menunggu", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  disetujui: { label: "Disetujui", cls: "bg-sky-100 text-sky-700 ring-sky-200" },
  ditolak: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 ring-rose-200" },
  dibayar: { label: "Dibayar", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
};

export const STATUS_SANTRI: Record<string, Tone> = {
  aktif: { label: "Aktif", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  cuti: { label: "Cuti", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  nonaktif: { label: "Nonaktif", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  lulus: { label: "Lulus", cls: "bg-brand-100 text-brand-700 ring-brand-200" },
};

export const STATUS_PENGAJAR: Record<string, Tone> = {
  aktif: { label: "Aktif", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  nonaktif: { label: "Nonaktif", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export const STATUS_PENDAFTARAN: Record<string, Tone> = {
  menunggu: { label: "Menunggu", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  diterima: { label: "Diterima", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  ditolak: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 ring-rose-200" },
};

export const STATUS_BAYAR: Record<string, Tone> = {
  lunas: { label: "Lunas", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  belum: { label: "Belum Bayar", cls: "bg-rose-100 text-rose-700 ring-rose-200" },
};

export const MATERI_OPTIONS = [
  "Makharijul Huruf",
  "Sifatul Huruf",
  "Iqro' Jilid 1",
  "Iqro' Jilid 2",
  "Iqro' Jilid 3",
  "Iqro' Jilid 4",
  "Iqro' Jilid 5",
  "Iqro' Jilid 6",
  "Hukum Nun Sukun & Tanwin",
  "Hukum Mim Sukun",
  "Ghunnah & Tasydid",
  "Mad Thabi'i & Mad Far'i",
  "Qalqalah",
  "Tafkhim & Tarqiq (Ra' / Lam)",
  "Waqaf & Ibtida'",
  "Gharib & Musykilat",
  "Tilawah Al-Qur'an (Tartil)",
  "Murajaah / Evaluasi",
];

export const NILAI_OPTIONS = [
  "Mumtaz (Istimewa)",
  "Jayyid Jiddan (Sangat Baik)",
  "Jayyid (Baik)",
  "Maqbul (Cukup)",
  "Perlu Mengulang",
];

/** Slot jam belajar 05:00 - 21:00 WIB (60 menit / pertemuan) */
export const JAM_OPTIONS = Array.from({ length: 17 }, (_, i) => `${String(i + 5).padStart(2, "0")}:00`);

export const SUMBER_INFO = [
  "Google / Pencarian Online",
  "Media Sosial (Instagram, Facebook, TikTok)",
  "YouTube Lentera Syahdu",
  "Rekomendasi Teman / Keluarga",
  "WhatsApp / Grup WA",
  "Lainnya",
];

export const METODE_BAYAR = ["Transfer Bank", "QRIS", "E-Wallet", "Tunai"];

export const LAMA_BULAN_OPTIONS = [1, 3, 6, 12];
