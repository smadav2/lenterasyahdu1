import Link from "next/link";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/db";
import { absensi, pengajar, santri, users } from "@/db/schema";
import { PasswordInput, SubmitButton } from "@/components/client";
import { WhatsAppIcon } from "@/components/icons";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Flash,
  PageHeader,
  btn,
  btnSm,
  inputCls,
  tableCls,
  tdCls,
  thCls,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { STATUS_PENGAJAR } from "@/lib/constants";
import { currentPeriode, first, formatTanggal, intOr, periodeLabel, periodeRange, rupiah, todayJakarta, waLink } from "@/lib/format";
import { buildUrl, type SP } from "@/lib/url";
import { deletePengajar, savePengajar } from "../actions";

export const dynamic = "force-dynamic";

export default async function PengajarPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/pengajar";
  const editId = intOr(first(sp.edit), 0);
  const tambah = first(sp.tambah) === "1";
  const back = buildUrl(P, sp, { edit: undefined, tambah: undefined });
  const per = currentPeriode();
  const { start, end } = periodeRange(per);

  const [list, santriCount, absenStat] = await Promise.all([
    db
      .select({ p: pengajar, username: users.username })
      .from(pengajar)
      .leftJoin(users, eq(pengajar.userId, users.id))
      .orderBy(pengajar.status, pengajar.nama),
    db.select({ pid: santri.pengajarId, n: count() }).from(santri).where(eq(santri.status, "aktif")).groupBy(santri.pengajarId),
    db
      .select({
        pid: absensi.pengajarId,
        hadir: sql<number>`count(*) filter (where ${absensi.status} = 'hadir')`.mapWith(Number),
        bisyarah: sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} in ('diajukan','disetujui','dibayar')), 0)`.mapWith(Number),
      })
      .from(absensi)
      .where(and(gte(absensi.tanggal, start), lte(absensi.tanggal, end)))
      .groupBy(absensi.pengajarId),
  ]);
  const sMap = new Map(santriCount.map((r) => [r.pid, r.n]));
  const aMap = new Map(absenStat.map((r) => [r.pid, r]));
  const editing = editId ? list.find((l) => l.p.id === editId) : undefined;
  const e = editing?.p;
  const showForm = !!editing || tambah;

  return (
    <div>
      <PageHeader
        title="Data Pengajar"
        subtitle={`${list.length} pengajar terdaftar · statistik bulan ${periodeLabel(per)}`}
        actions={
          <Link href={buildUrl(P, sp, { tambah: "1", edit: undefined })} className={btn.primary}>
            <Plus className="h-4 w-4" /> Tambah Pengajar
          </Link>
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      {showForm && (
        <Card
          title={e ? `Edit Pengajar: ${e.nama}` : "Tambah Pengajar Baru"}
          subtitle="Pengajar login menggunakan username & password di bawah ini"
          className="mb-6"
          action={
            <Link href={back} className={btn.ghost}>
              Tutup
            </Link>
          }
        >
          <form action={savePengajar} key={e?.id ?? "new"} className="space-y-6">
            <input type="hidden" name="id" value={e?.id ?? ""} />
            <input type="hidden" name="back" value={back} />
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600">Informasi Pengajar</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Nama Lengkap (dengan sapaan)" required>
                  <input name="nama" required defaultValue={e?.nama ?? ""} placeholder="Ustadzah Fulanah" className={inputCls} />
                </Field>
                <Field label="Jenis Kelamin">
                  <select name="jenisKelamin" defaultValue={e?.jenisKelamin ?? "L"} className={inputCls}>
                    <option value="L">Laki-laki (Ustadz)</option>
                    <option value="P">Perempuan (Ustadzah)</option>
                  </select>
                </Field>
                <Field label="No. WhatsApp">
                  <input name="noWa" defaultValue={e?.noWa ?? ""} placeholder="081234567890" className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" name="email" defaultValue={e?.email ?? ""} className={inputCls} />
                </Field>
                <Field label="Tanggal Bergabung">
                  <input type="date" name="tanggalBergabung" defaultValue={e?.tanggalBergabung ?? todayJakarta()} className={inputCls} />
                </Field>
                <Field label="Status">
                  <select name="status" defaultValue={e?.status ?? "aktif"} className={inputCls}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif (tidak bisa login)</option>
                  </select>
                </Field>
                <Field label="Pendidikan Formal / Pesantren">
                  <input name="pendidikan" defaultValue={e?.pendidikan ?? ""} className={inputCls} />
                </Field>
                <Field label="Pengalaman Mengajar / Sanad" className="lg:col-span-2">
                  <input name="pengalaman" defaultValue={e?.pengalaman ?? ""} className={inputCls} />
                </Field>
                <Field label="Alamat" className="md:col-span-2 lg:col-span-3">
                  <input name="alamat" defaultValue={e?.alamat ?? ""} className={inputCls} />
                </Field>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600">Rekening Pembayaran Bisyarah</p>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nama Bank / E-Wallet">
                  <input name="bank" defaultValue={e?.bank ?? ""} placeholder="BSI / BRI / DANA" className={inputCls} />
                </Field>
                <Field label="Nomor Rekening">
                  <input name="noRekening" defaultValue={e?.noRekening ?? ""} className={inputCls} />
                </Field>
                <Field label="Atas Nama">
                  <input name="atasNama" defaultValue={e?.atasNama ?? ""} className={inputCls} />
                </Field>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-600">Akun Login</p>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Username" required hint="Huruf kecil/angka, tanpa spasi">
                  <input name="username" required defaultValue={editing?.username ?? ""} placeholder="contoh: aisyah" className={inputCls} />
                </Field>
                <Field label={e ? "Password Baru (opsional)" : "Password"} required={!e} hint={e ? "Kosongkan jika tidak diganti" : "Minimal 6 karakter"}>
                  <PasswordInput name="password" required={!e} minLength={6} autoComplete="new-password" className={inputCls} />
                </Field>
              </div>
            </div>
            <SubmitButton className={btn.primary} pendingText="Menyimpan...">
              {e ? "Simpan Perubahan" : "Simpan Pengajar"}
            </SubmitButton>
          </form>
        </Card>
      )}

      <Card bodyClassName="p-0">
        {list.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada pengajar" desc="Tambahkan pengajar agar dapat login dan mengisi absensi." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Pengajar</th>
                  <th className={thCls}>Kontak</th>
                  <th className={thCls}>Username</th>
                  <th className={thCls}>Santri Aktif</th>
                  <th className={thCls}>Bulan Ini</th>
                  <th className={thCls}>Rekening</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {list.map(({ p, username }) => {
                  const st = aMap.get(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className={tdCls}>
                        <p className="font-semibold text-slate-800">{p.nama}</p>
                        <p className="text-xs text-slate-500">
                          {p.jenisKelamin === "P" ? "Ustadzah" : "Ustadz"} · bergabung {formatTanggal(p.tanggalBergabung)}
                        </p>
                      </td>
                      <td className={tdCls}>
                        {p.noWa ? (
                          <a href={waLink(p.noWa)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                            <WhatsAppIcon className="h-3 w-3" /> {p.noWa}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        <p className="text-xs text-slate-500">{p.email ?? ""}</p>
                      </td>
                      <td className={`${tdCls} font-mono text-xs`}>{username ?? <span className="text-rose-500">belum ada akun</span>}</td>
                      <td className={`${tdCls} font-semibold`}>{sMap.get(p.id) ?? 0}</td>
                      <td className={tdCls}>
                        <p className="text-sm font-semibold text-slate-800">{st?.hadir ?? 0} pertemuan</p>
                        <p className="text-xs text-brand-700">{rupiah(st?.bisyarah ?? 0)}</p>
                      </td>
                      <td className={`${tdCls} text-xs`}>
                        {p.bank ? (
                          <>
                            <p className="font-medium text-slate-700">
                              {p.bank} {p.noRekening}
                            </p>
                            <p className="text-slate-500">a.n. {p.atasNama ?? "-"}</p>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <Badge tone={STATUS_PENGAJAR[p.status]} />
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-1.5">
                          <Link href={buildUrl(P, sp, { edit: String(p.id), tambah: undefined })} className={btnSm.outline} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <form action={deletePengajar}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="back" value={back} />
                            <SubmitButton className={btnSm.danger} pendingText="..." confirmText={`Hapus pengajar ${p.nama} beserta akun loginnya?`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
