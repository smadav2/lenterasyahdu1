import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* ============================================================
 * AKUN & SESI LOGIN
 * ============================================================ */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 16 }).$type<"admin" | "pengajar">().notNull(),
  nama: varchar("nama", { length: 120 }).notNull(),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * PENGAJAR
 * ============================================================ */
export const pengajar = pgTable("pengajar", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  nama: varchar("nama", { length: 120 }).notNull(),
  jenisKelamin: varchar("jenis_kelamin", { length: 1 }).notNull().default("L"),
  noWa: varchar("no_wa", { length: 30 }),
  email: varchar("email", { length: 120 }),
  alamat: text("alamat"),
  pendidikan: text("pendidikan"),
  pengalaman: text("pengalaman"),
  bank: varchar("bank", { length: 60 }),
  noRekening: varchar("no_rekening", { length: 60 }),
  atasNama: varchar("atas_nama", { length: 120 }),
  status: varchar("status", { length: 16 }).notNull().default("aktif"),
  tanggalBergabung: date("tanggal_bergabung", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * SANTRI
 * ============================================================ */
export const santri = pgTable("santri", {
  id: serial("id").primaryKey(),
  kode: varchar("kode", { length: 20 }).unique(),
  nama: varchar("nama", { length: 120 }).notNull(),
  namaPanggilan: varchar("nama_panggilan", { length: 60 }),
  jenisKelamin: varchar("jenis_kelamin", { length: 1 }).notNull().default("L"),
  tanggalLahir: date("tanggal_lahir", { mode: "string" }),
  namaWali: varchar("nama_wali", { length: 120 }),
  noWa: varchar("no_wa", { length: 30 }),
  email: varchar("email", { length: 120 }),
  kota: varchar("kota", { length: 120 }),
  levelAwal: varchar("level_awal", { length: 120 }),
  pengajarId: integer("pengajar_id").references(() => pengajar.id, { onDelete: "set null" }),
  jamBelajar: varchar("jam_belajar", { length: 5 }),
  tanggalMulai: date("tanggal_mulai", { mode: "string" }),
  status: varchar("status", { length: 16 }).notNull().default("aktif"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * PENDAFTARAN ONLINE (dari website)
 * ============================================================ */
export const pendaftaran = pgTable("pendaftaran", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 120 }).notNull(),
  namaPanggilan: varchar("nama_panggilan", { length: 60 }),
  jenisKelamin: varchar("jenis_kelamin", { length: 1 }).notNull().default("L"),
  tanggalLahir: date("tanggal_lahir", { mode: "string" }),
  kota: varchar("kota", { length: 120 }),
  pernahBelajar: boolean("pernah_belajar").notNull().default(false),
  levelSebelumnya: varchar("level_sebelumnya", { length: 120 }),
  namaWali: varchar("nama_wali", { length: 120 }).notNull(),
  noWa: varchar("no_wa", { length: 30 }).notNull(),
  email: varchar("email", { length: 120 }),
  jamPreferensi: varchar("jam_preferensi", { length: 5 }),
  lamaBulan: integer("lama_bulan").notNull().default(1),
  tujuan: text("tujuan"),
  sumberInfo: varchar("sumber_info", { length: 80 }),
  status: varchar("status", { length: 16 }).notNull().default("menunggu"),
  santriId: integer("santri_id").references(() => santri.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * PEMBAYARAN BISYARAH (pencairan honor pengajar)
 * ============================================================ */
export const bisyarahPayout = pgTable("bisyarah_payout", {
  id: serial("id").primaryKey(),
  pengajarId: integer("pengajar_id")
    .notNull()
    .references(() => pengajar.id, { onDelete: "cascade" }),
  periode: varchar("periode", { length: 7 }).notNull(),
  jumlahPertemuan: integer("jumlah_pertemuan").notNull(),
  total: integer("total").notNull(),
  tanggalBayar: date("tanggal_bayar", { mode: "string" }).notNull(),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * ABSENSI MENGAJI (+ klaim bisyarah per pertemuan)
 * klaimStatus: none | diajukan | disetujui | ditolak | dibayar
 * ============================================================ */
export const absensi = pgTable(
  "absensi",
  {
    id: serial("id").primaryKey(),
    santriId: integer("santri_id")
      .notNull()
      .references(() => santri.id, { onDelete: "cascade" }),
    pengajarId: integer("pengajar_id")
      .notNull()
      .references(() => pengajar.id, { onDelete: "cascade" }),
    tanggal: date("tanggal", { mode: "string" }).notNull(),
    jamMulai: varchar("jam_mulai", { length: 5 }),
    status: varchar("status", { length: 10 }).notNull().default("hadir"),
    materi: varchar("materi", { length: 120 }),
    capaian: varchar("capaian", { length: 200 }),
    nilai: varchar("nilai", { length: 60 }),
    catatan: text("catatan"),
    klaimStatus: varchar("klaim_status", { length: 16 }).notNull().default("none"),
    nominal: integer("nominal").notNull().default(0),
    alasanTolak: text("alasan_tolak"),
    payoutId: integer("payout_id").references(() => bisyarahPayout.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("absensi_santri_tanggal_uq").on(t.santriId, t.tanggal),
    index("absensi_pengajar_tanggal_idx").on(t.pengajarId, t.tanggal),
  ],
);

/* ============================================================
 * PEMBAYARAN SPP / INFAQ BULANAN SANTRI
 * ============================================================ */
export const pembayaran = pgTable(
  "pembayaran",
  {
    id: serial("id").primaryKey(),
    santriId: integer("santri_id")
      .notNull()
      .references(() => santri.id, { onDelete: "cascade" }),
    periode: varchar("periode", { length: 7 }).notNull(),
    nominal: integer("nominal").notNull(),
    status: varchar("status", { length: 10 }).notNull().default("belum"),
    tanggalBayar: date("tanggal_bayar", { mode: "string" }),
    metode: varchar("metode", { length: 40 }),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pembayaran_santri_periode_uq").on(t.santriId, t.periode)],
);

/* ============================================================
 * PENGUMUMAN & PENGATURAN
 * ============================================================ */
export const pengumuman = pgTable("pengumuman", {
  id: serial("id").primaryKey(),
  judul: varchar("judul", { length: 200 }).notNull(),
  isi: text("isi").notNull(),
  penting: boolean("penting").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});
