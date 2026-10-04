import { asc, eq } from "drizzle-orm";
import { KeyRound, Save, Trash2, UserPlus } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { PasswordInput, SubmitButton } from "@/components/client";
import { Card, Field, Flash, PageHeader, btn, btnSm, inputCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { first, formatDateTime } from "@/lib/format";
import { getSettings, type SettingsKey } from "@/lib/settings";
import type { SP } from "@/lib/url";
import { gantiPasswordAdmin, hapusAdmin, saveSettings, tambahAdmin } from "../actions";

export const dynamic = "force-dynamic";

type FieldDef = { key: SettingsKey; label: string; type?: "text" | "number"; hint?: string; wide?: boolean };

const GROUPS: { title: string; desc: string; fields: FieldDef[] }[] = [
  {
    title: "Lembaga & Kontak",
    desc: "Tampil di website, footer, dan tombol WhatsApp",
    fields: [
      { key: "namaLembaga", label: "Nama Lembaga" },
      { key: "noWa", label: "No. WhatsApp Admin", hint: "Format: 6281234567890" },
      { key: "email", label: "Email" },
      { key: "alamat", label: "Alamat", wide: true },
    ],
  },
  {
    title: "Program & Biaya",
    desc: "Informasi Kelas Tahsin Online",
    fields: [
      { key: "namaProgram", label: "Nama Program" },
      { key: "biayaBulanan", label: "Biaya per Bulan (Rp)", type: "number" },
      { key: "jumlahPertemuan", label: "Jumlah Pertemuan / Bulan", type: "number" },
      { key: "durasiMenit", label: "Durasi per Pertemuan (menit)", type: "number" },
      { key: "hariBelajar", label: "Hari Belajar" },
    ],
  },
  {
    title: "Bisyarah Pengajar",
    desc: "Klaim otomatis dari absensi berstatus Hadir yang berisi catatan pertemuan",
    fields: [
      { key: "tarifBisyarah", label: "Bisyarah per Pertemuan (Rp)", type: "number" },
      { key: "minCatatan", label: "Minimal Karakter Catatan", type: "number", hint: "Syarat panjang catatan untuk klaim" },
    ],
  },
  {
    title: "Rekening Pembayaran SPP",
    desc: "Ditampilkan ke pendaftar & pada pesan pengingat SPP",
    fields: [
      { key: "bankNama", label: "Nama Bank" },
      { key: "bankNoRek", label: "Nomor Rekening" },
      { key: "bankAtasNama", label: "Atas Nama" },
    ],
  },
  {
    title: "Media Sosial",
    desc: "Tautan di footer website",
    fields: [
      { key: "instagram", label: "Instagram" },
      { key: "youtube", label: "YouTube" },
      { key: "tiktok", label: "TikTok" },
    ],
  },
  {
    title: "Statistik Landing Page",
    desc: "Angka yang ditampilkan di halaman utama",
    fields: [
      { key: "statSantri", label: "Jumlah Santri" },
      { key: "statPengajar", label: "Jumlah Pengajar" },
      { key: "statKepuasan", label: "Tingkat Kepuasan" },
      { key: "statRating", label: "Rating" },
    ],
  },
];

export default async function PengaturanPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/pengaturan";
  const s = await getSettings();
  const admins = await db
    .select({ id: users.id, nama: users.nama, username: users.username, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.id));

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Atur informasi lembaga, biaya program, tarif bisyarah, dan akun admin." />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form action={saveSettings} className="space-y-6">
          <input type="hidden" name="back" value={P} />
          {GROUPS.map((g) => (
            <Card key={g.title} title={g.title} subtitle={g.desc}>
              <div className="grid gap-4 md:grid-cols-2">
                {g.fields.map((f) => (
                  <Field key={f.key} label={f.label} hint={f.hint} className={f.wide ? "md:col-span-2" : undefined}>
                    <input name={f.key} type={f.type ?? "text"} defaultValue={s[f.key]} min={f.type === "number" ? 0 : undefined} className={inputCls} />
                  </Field>
                ))}
              </div>
            </Card>
          ))}
          <div className="sticky bottom-4 z-10 flex justify-end">
            <SubmitButton className={`${btn.primary} shadow-xl`} pendingText="Menyimpan...">
              <Save className="h-4 w-4" /> Simpan Pengaturan
            </SubmitButton>
          </div>
        </form>

        <div className="space-y-6">
          <Card title="Ganti Password" subtitle={`Login sebagai ${me.username}`}>
            <form action={gantiPasswordAdmin} className="space-y-4">
              <input type="hidden" name="back" value={P} />
              <Field label="Password Lama">
                <PasswordInput name="lama" required autoComplete="current-password" className={inputCls} />
              </Field>
              <Field label="Password Baru" hint="Minimal 6 karakter">
                <PasswordInput name="baru" required minLength={6} autoComplete="new-password" className={inputCls} />
              </Field>
              <Field label="Konfirmasi Password Baru">
                <PasswordInput name="konfirmasi" required minLength={6} autoComplete="new-password" className={inputCls} />
              </Field>
              <SubmitButton className={`${btn.primary} w-full`}>
                <KeyRound className="h-4 w-4" /> Ganti Password
              </SubmitButton>
            </form>
          </Card>

          <Card title="Akun Admin" subtitle={`${admins.length} akun`}>
            <ul className="mb-5 divide-y divide-slate-100">
              {admins.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {a.nama} {a.id === me.id && <span className="text-xs font-normal text-brand-600">(Anda)</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{a.username} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                  {a.id !== me.id && (
                    <form action={hapusAdmin}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="back" value={P} />
                      <SubmitButton className={btnSm.danger} confirmText={`Hapus akun admin ${a.nama}?`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <form action={tambahAdmin} className="space-y-3 rounded-xl bg-slate-50 p-4">
              <input type="hidden" name="back" value={P} />
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Tambah Admin</p>
              <input name="nama" required placeholder="Nama lengkap" className={inputCls} />
              <input name="username" required placeholder="Username" className={inputCls} />
              <PasswordInput name="password" required minLength={6} placeholder="Password (min. 6)" autoComplete="new-password" className={inputCls} />
              <SubmitButton className={`${btn.outline} w-full`}>
                <UserPlus className="h-4 w-4" /> Tambah Admin
              </SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
