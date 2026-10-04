import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  absensi,
  bisyarahPayout,
  pembayaran,
  pendaftaran,
  pengajar,
  pengumuman,
  santri,
  users,
} from "@/db/schema";
import { hashPassword } from "./auth";
import {
  addDays,
  currentPeriode,
  isHariBelajar,
  kodeSantri,
  periodeLabel,
  periodeRange,
  shiftPeriode,
  todayJakarta,
} from "./format";

const g = globalThis as typeof globalThis & {
  __lsSeedDone?: boolean;
  __lsSeedPromise?: Promise<void>;
};

/** Membuat akun admin default + data contoh saat database masih kosong. */
export async function ensureSeed(): Promise<void> {
  if (g.__lsSeedDone) return;
  if (!g.__lsSeedPromise) {
    g.__lsSeedPromise = (async () => {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);
      if (existing.length === 0) await seedDemo();
      g.__lsSeedDone = true;
    })().catch((e) => {
      g.__lsSeedPromise = undefined;
      console.error("Seed gagal:", e);
    });
  }
  await g.__lsSeedPromise;
}

const MATERI_DEMO = [
  "Makharijul Huruf",
  "Sifatul Huruf",
  "Hukum Nun Sukun & Tanwin",
  "Hukum Mim Sukun",
  "Mad Thabi'i & Mad Far'i",
  "Qalqalah",
  "Tilawah Al-Qur'an (Tartil)",
];
const CAPAIAN_DEMO = [
  "QS. Al-Fatihah 1-7",
  "QS. An-Naba' 1-16",
  "QS. An-Naba' 17-40",
  "QS. An-Nazi'at 1-26",
  "QS. 'Abasa 1-42",
  "QS. At-Takwir 1-29",
  "QS. Al-Infithar 1-19",
];
const CATATAN_DEMO = [
  "Alhamdulillah makhraj huruf halqi sudah lebih tepat. Perlu latihan lagi pada huruf 'ain dan ha.",
  "Bacaan sudah lancar, dengung (ghunnah) pada nun tasydid perlu dijaga 2 harakat.",
  "Hukum idgham bighunnah sudah dipahami. PR: murajaah QS. An-Naba' ayat 1-16.",
  "Santri semangat. Panjang mad thabi'i belum konsisten, latihan dengan ketukan jari.",
  "Qalqalah sughra & kubra sudah bisa dibedakan. Lanjut latihan tilawah dengan tartil.",
  "Tartil semakin baik, waqaf di akhir ayat sudah tepat. Pertahankan murajaah harian.",
];
const NILAI_DEMO = ["Mumtaz (Istimewa)", "Jayyid Jiddan (Sangat Baik)", "Jayyid (Baik)"];

function teachingDays(start: string, endExclusive: string): string[] {
  const out: string[] = [];
  let d = start;
  while (d < endExclusive) {
    if (isHariBelajar(d)) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

async function seedDemo() {
  const inserted = await db
    .insert(users)
    .values({ username: "admin", passwordHash: hashPassword("admin123"), role: "admin", nama: "Administrator" })
    .onConflictDoNothing()
    .returning({ id: users.id });
  if (inserted.length === 0) return;

  const today = todayJakarta();
  const per = currentPeriode();
  const prev = shiftPeriode(per, -1);
  const tarif = 25000;
  const biaya = 500000;

  // ---------- Pengajar contoh ----------
  const pengajarData = [
    {
      username: "aisyah",
      nama: "Ustadzah Aisyah Rahmawati",
      jk: "P",
      wa: "081234567801",
      bank: "BSI",
      rek: "7012345678",
      an: "Aisyah Rahmawati",
      pendidikan: "S1 Ilmu Al-Qur'an dan Tafsir",
      pengalaman: "Mengajar tahsin 6 tahun, bersanad riwayat Hafs 'an 'Ashim",
    },
    {
      username: "ahmad",
      nama: "Ustadz Ahmad Fauzi",
      jk: "L",
      wa: "081234567802",
      bank: "BRI",
      rek: "0123456789012",
      an: "Ahmad Fauzi",
      pendidikan: "Pondok Pesantren Tahfidzul Qur'an",
      pengalaman: "Pengajar tahsin & tahfidz 8 tahun",
    },
  ];
  const pIds: number[] = [];
  for (const p of pengajarData) {
    const [u] = await db
      .insert(users)
      .values({ username: p.username, passwordHash: hashPassword("pengajar123"), role: "pengajar", nama: p.nama })
      .returning({ id: users.id });
    const [row] = await db
      .insert(pengajar)
      .values({
        userId: u.id,
        nama: p.nama,
        jenisKelamin: p.jk,
        noWa: p.wa,
        bank: p.bank,
        noRekening: p.rek,
        atasNama: p.an,
        pendidikan: p.pendidikan,
        pengalaman: p.pengalaman,
        tanggalBergabung: `${prev}-01`,
        status: "aktif",
      })
      .returning({ id: pengajar.id });
    pIds.push(row.id);
  }

  // ---------- Santri contoh ----------
  const santriData = [
    { nama: "Nafisa Azzahra", pgl: "Nafisa", jk: "P", lahir: "2014-03-12", wali: "Ibu Rina Marlina", wa: "081311112222", kota: "Bandung", level: "Iqro' 5", p: 0, jam: "16:00" },
    { nama: "Muhammad Al Fatih", pgl: "Fatih", jk: "L", lahir: "2012-08-21", wali: "Bapak Hendra Gunawan", wa: "081322223333", kota: "Jakarta Selatan", level: "Al-Qur'an Juz 1", p: 1, jam: "19:00" },
    { nama: "Khadijah Humaira", pgl: "Humaira", jk: "P", lahir: "2016-01-05", wali: "Ibu Siti Nurhaliza", wa: "081333334444", kota: "Surabaya", level: "Iqro' 3", p: 0, jam: "15:00" },
    { nama: "Abdullah Rasyid", pgl: "Rasyid", jk: "L", lahir: "1995-11-30", wali: "Abdullah Rasyid (pribadi)", wa: "081344445555", kota: "Kuala Lumpur, Malaysia", level: "Al-Qur'an (perbaikan tajwid)", p: 1, jam: "20:00" },
    { nama: "Zahra Kamila Putri", pgl: "Zahra", jk: "P", lahir: "2013-06-18", wali: "Ibu Dewi Lestari", wa: "081355556666", kota: "Yogyakarta", level: "Al-Qur'an Juz 3", p: 0, jam: "18:00" },
  ];
  const sList: { id: number; p: number; jam: string }[] = [];
  for (const s of santriData) {
    const [row] = await db
      .insert(santri)
      .values({
        nama: s.nama,
        namaPanggilan: s.pgl,
        jenisKelamin: s.jk,
        tanggalLahir: s.lahir,
        namaWali: s.wali,
        noWa: s.wa,
        kota: s.kota,
        levelAwal: s.level,
        pengajarId: pIds[s.p],
        jamBelajar: s.jam,
        tanggalMulai: `${prev}-01`,
        status: "aktif",
      })
      .returning({ id: santri.id });
    await db.update(santri).set({ kode: kodeSantri(row.id) }).where(eq(santri.id, row.id));
    sList.push({ id: row.id, p: pIds[s.p], jam: s.jam });
  }

  // ---------- Absensi bulan lalu (sudah dibayar) ----------
  type AbsensiInsert = typeof absensi.$inferInsert;
  const prevRange = periodeRange(prev);
  const prevDays = teachingDays(prevRange.start, addDays(prevRange.end, 1)).slice(0, 18);
  const prevRows: AbsensiInsert[] = [];
  sList.forEach((s, si) =>
    prevDays.forEach((d, di) => {
      const hadir = (di + si) % 8 !== 5;
      prevRows.push({
        santriId: s.id,
        pengajarId: s.p,
        tanggal: d,
        jamMulai: s.jam,
        status: hadir ? "hadir" : "izin",
        materi: hadir ? MATERI_DEMO[di % MATERI_DEMO.length] : null,
        capaian: hadir ? CAPAIAN_DEMO[di % CAPAIAN_DEMO.length] : null,
        nilai: hadir ? NILAI_DEMO[(di + si) % NILAI_DEMO.length] : null,
        catatan: hadir ? CATATAN_DEMO[(di + si) % CATATAN_DEMO.length] : "Izin acara keluarga.",
        klaimStatus: hadir ? "dibayar" : "none",
        nominal: hadir ? tarif : 0,
      });
    }),
  );
  const payDate = `${per}-05` <= today ? `${per}-05` : today;
  for (const pid of pIds) {
    const rows = prevRows.filter((r) => r.pengajarId === pid && r.klaimStatus === "dibayar");
    if (!rows.length) continue;
    const [po] = await db
      .insert(bisyarahPayout)
      .values({
        pengajarId: pid,
        periode: prev,
        jumlahPertemuan: rows.length,
        total: rows.length * tarif,
        tanggalBayar: payDate,
        keterangan: `Transfer bisyarah bulan ${periodeLabel(prev)}`,
      })
      .returning({ id: bisyarahPayout.id });
    rows.forEach((r) => {
      r.payoutId = po.id;
    });
  }

  // ---------- Absensi bulan ini ----------
  const curDays = teachingDays(`${per}-01`, today);
  const approvedBefore = addDays(today, -3);
  const curRows: AbsensiInsert[] = [];
  sList.forEach((s, si) =>
    curDays.forEach((d, di) => {
      const hadir = (di + si) % 9 !== 4;
      curRows.push({
        santriId: s.id,
        pengajarId: s.p,
        tanggal: d,
        jamMulai: s.jam,
        status: hadir ? "hadir" : "sakit",
        materi: hadir ? MATERI_DEMO[(di + 3) % MATERI_DEMO.length] : null,
        capaian: hadir ? CAPAIAN_DEMO[(di + 2) % CAPAIAN_DEMO.length] : null,
        nilai: hadir ? NILAI_DEMO[(di + si + 1) % NILAI_DEMO.length] : null,
        catatan: hadir ? CATATAN_DEMO[(di + si + 2) % CATATAN_DEMO.length] : "Santri sakit demam.",
        klaimStatus: hadir ? (d < approvedBefore ? "disetujui" : "diajukan") : "none",
        nominal: hadir ? tarif : 0,
      });
    }),
  );
  const allRows = [...prevRows, ...curRows];
  if (allRows.length) await db.insert(absensi).values(allRows);

  // ---------- Pembayaran SPP ----------
  const spp: (typeof pembayaran.$inferInsert)[] = [];
  sList.forEach((s, i) => {
    spp.push({ santriId: s.id, periode: prev, nominal: biaya, status: "lunas", tanggalBayar: `${prev}-0${(i % 5) + 1}`, metode: "Transfer Bank" });
    spp.push({
      santriId: s.id,
      periode: per,
      nominal: biaya,
      status: i < 3 ? "lunas" : "belum",
      tanggalBayar: i < 3 ? `${per}-01` : null,
      metode: i < 3 ? "Transfer Bank" : null,
    });
  });
  await db.insert(pembayaran).values(spp);

  // ---------- Pendaftaran baru ----------
  await db.insert(pendaftaran).values([
    {
      nama: "Fathimah Az-Zahra",
      namaPanggilan: "Fathimah",
      jenisKelamin: "P",
      tanggalLahir: "2015-09-09",
      kota: "Depok",
      pernahBelajar: true,
      levelSebelumnya: "Iqro' 4",
      namaWali: "Ibu Maryam Ulfah",
      noWa: "081377778888",
      jamPreferensi: "16:00",
      tujuan: "Agar anak bisa membaca Al-Qur'an dengan tartil dan benar tajwidnya.",
      sumberInfo: "Media Sosial (Instagram, Facebook, TikTok)",
      status: "menunggu",
    },
    {
      nama: "Umar Abdul Aziz",
      namaPanggilan: "Umar",
      jenisKelamin: "L",
      tanggalLahir: "1990-02-14",
      kota: "Singapura",
      pernahBelajar: false,
      levelSebelumnya: null,
      namaWali: "Umar Abdul Aziz",
      noWa: "6581234567",
      jamPreferensi: "20:00",
      tujuan: "Memperbaiki bacaan Al-Qur'an dari dasar (makharijul huruf).",
      sumberInfo: "YouTube Lentera Syahdu",
      status: "menunggu",
    },
  ]);

  // ---------- Pengumuman ----------
  await db.insert(pengumuman).values([
    {
      judul: "Selamat datang di sistem Lentera Syahdu",
      isi: "Mohon isi absensi setiap selesai mengajar. Catatan pertemuan yang lengkap otomatis menjadi klaim bisyarah Rp 25.000 per pertemuan.",
      penting: true,
    },
    {
      judul: "Jadwal pencairan bisyarah",
      isi: "Bisyarah yang sudah disetujui admin dicairkan setiap awal bulan (tanggal 1-5) ke rekening masing-masing pengajar.",
      penting: false,
    },
  ]);
}
