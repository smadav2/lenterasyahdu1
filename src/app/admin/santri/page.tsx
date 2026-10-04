import Link from "next/link";
import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { db } from "@/db";
import { absensi, pengajar, santri } from "@/db/schema";
import { SubmitButton } from "@/components/client";
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
import { JAM_OPTIONS, STATUS_SANTRI } from "@/lib/constants";
import { currentPeriode, first, hitungUsia, intOr, periodeRange, todayJakarta, waLink } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { buildUrl, type SP } from "@/lib/url";
import { deleteSantri, saveSantri } from "../actions";

export const dynamic = "force-dynamic";

export default async function SantriPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/santri";
  const q = (first(sp.q) ?? "").trim();
  const st = first(sp.status) ?? "";
  const pid = intOr(first(sp.pengajar), 0);
  const editId = intOr(first(sp.edit), 0);
  const tambah = first(sp.tambah) === "1";
  const back = buildUrl(P, sp, { edit: undefined, tambah: undefined });
  const { pertemuan } = await getNumbers();
  const { start, end } = periodeRange(currentPeriode());

  const conds: SQL[] = [];
  if (q) {
    const c = or(ilike(santri.nama, `%${q}%`), ilike(santri.kode, `%${q}%`), ilike(santri.namaWali, `%${q}%`));
    if (c) conds.push(c);
  }
  if (st) conds.push(eq(santri.status, st));
  if (pid) conds.push(eq(santri.pengajarId, pid));

  const [pengajarList, rows, hadirRows] = await Promise.all([
    db.select({ id: pengajar.id, nama: pengajar.nama, status: pengajar.status }).from(pengajar).orderBy(pengajar.nama),
    db
      .select({ s: santri, pengajarNama: pengajar.nama })
      .from(santri)
      .leftJoin(pengajar, eq(santri.pengajarId, pengajar.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(santri.createdAt)),
    db
      .select({ id: absensi.santriId, n: count() })
      .from(absensi)
      .where(and(eq(absensi.status, "hadir"), gte(absensi.tanggal, start), lte(absensi.tanggal, end)))
      .groupBy(absensi.santriId),
  ]);
  const hadirMap = new Map(hadirRows.map((r) => [r.id, r.n]));
  const editing = editId ? (await db.select().from(santri).where(eq(santri.id, editId)).limit(1))[0] : undefined;
  const showForm = !!editing || tambah;

  return (
    <div>
      <PageHeader
        title="Data Santri"
        subtitle={`${rows.length} santri ditemukan · hari belajar Senin – Kamis`}
        actions={
          <Link href={buildUrl(P, sp, { tambah: "1", edit: undefined })} className={btn.primary}>
            <Plus className="h-4 w-4" /> Tambah Santri
          </Link>
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      {showForm && (
        <Card
          title={editing ? `Edit Santri: ${editing.nama}` : "Tambah Santri Baru"}
          subtitle={editing ? `Kode ${editing.kode ?? "-"}` : "Kode santri dibuat otomatis (LS-xxxx)"}
          className="mb-6"
          action={
            <Link href={back} className={btn.ghost}>
              Tutup
            </Link>
          }
        >
          <form action={saveSantri} key={editing?.id ?? "new"} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <input type="hidden" name="back" value={back} />
            <Field label="Nama Lengkap" required>
              <input name="nama" required defaultValue={editing?.nama ?? ""} className={inputCls} />
            </Field>
            <Field label="Nama Panggilan">
              <input name="namaPanggilan" defaultValue={editing?.namaPanggilan ?? ""} className={inputCls} />
            </Field>
            <Field label="Jenis Kelamin">
              <select name="jenisKelamin" defaultValue={editing?.jenisKelamin ?? "L"} className={inputCls}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
            <Field label="Tanggal Lahir">
              <input type="date" name="tanggalLahir" defaultValue={editing?.tanggalLahir ?? ""} className={inputCls} />
            </Field>
            <Field label="Nama Orang Tua / Wali">
              <input name="namaWali" defaultValue={editing?.namaWali ?? ""} className={inputCls} />
            </Field>
            <Field label="No. WhatsApp Wali" hint="Dipakai wali untuk Cek Progres (4 digit terakhir)">
              <input name="noWa" defaultValue={editing?.noWa ?? ""} placeholder="081234567890" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" defaultValue={editing?.email ?? ""} className={inputCls} />
            </Field>
            <Field label="Kota Domisili">
              <input name="kota" defaultValue={editing?.kota ?? ""} className={inputCls} />
            </Field>
            <Field label="Level Awal">
              <input name="levelAwal" defaultValue={editing?.levelAwal ?? ""} placeholder="Iqro' 3 / Al-Qur'an Juz 1" className={inputCls} />
            </Field>
            <Field label="Pengajar">
              <select name="pengajarId" defaultValue={editing?.pengajarId ?? ""} className={inputCls}>
                <option value="">— Pilih pengajar —</option>
                {pengajarList
                  .filter((p) => p.status === "aktif" || p.id === editing?.pengajarId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Jam Belajar (WIB)">
              <select name="jamBelajar" defaultValue={editing?.jamBelajar ?? ""} className={inputCls}>
                <option value="">— Pilih jam —</option>
                {JAM_OPTIONS.map((j) => (
                  <option key={j} value={j}>
                    {j} WIB
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal Mulai Belajar">
              <input type="date" name="tanggalMulai" defaultValue={editing?.tanggalMulai ?? todayJakarta()} className={inputCls} />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={editing?.status ?? "aktif"} className={inputCls}>
                {Object.entries(STATUS_SANTRI).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Catatan Admin" className="md:col-span-2">
              <textarea name="catatan" rows={2} defaultValue={editing?.catatan ?? ""} className={inputCls} />
            </Field>
            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <SubmitButton className={btn.primary} pendingText="Menyimpan...">
                {editing ? "Simpan Perubahan" : "Simpan Santri"}
              </SubmitButton>
            </div>
          </form>
        </Card>
      )}

      <Card bodyClassName="p-0">
        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <input name="q" defaultValue={q} placeholder="Cari nama / kode / wali..." className={`${inputCls} sm:max-w-xs`} />
          <select name="status" defaultValue={st} className={`${inputCls} sm:max-w-[170px]`}>
            <option value="">Semua status</option>
            {Object.entries(STATUS_SANTRI).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select name="pengajar" defaultValue={pid || ""} className={`${inputCls} sm:max-w-[220px]`}>
            <option value="">Semua pengajar</option>
            {pengajarList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <button type="submit" className={btn.outline}>
            <Search className="h-4 w-4" /> Filter
          </button>
          {(q || st || pid > 0) && (
            <Link href={P} className="text-sm font-medium text-slate-500 hover:text-brand-700">
              Reset
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada data santri" desc="Tambahkan santri baru atau terima pendaftaran dari website." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Kode</th>
                  <th className={thCls}>Santri</th>
                  <th className={thCls}>Wali</th>
                  <th className={thCls}>Pengajar & Jam</th>
                  <th className={thCls}>Hadir Bln Ini</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map(({ s, pengajarNama }) => {
                  const hadir = hadirMap.get(s.id) ?? 0;
                  const usia = hitungUsia(s.tanggalLahir);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className={`${tdCls} font-mono text-xs font-semibold text-brand-700`}>{s.kode}</td>
                      <td className={tdCls}>
                        <p className="font-semibold text-slate-800">{s.nama}</p>
                        <p className="text-xs text-slate-500">
                          {s.namaPanggilan ?? "-"} · {s.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}
                          {usia !== null && ` · ${usia} th`} · {s.kota ?? "-"}
                        </p>
                      </td>
                      <td className={tdCls}>
                        <p className="text-slate-700">{s.namaWali ?? "-"}</p>
                        {s.noWa && (
                          <a href={waLink(s.noWa)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                            <WhatsAppIcon className="h-3 w-3" /> {s.noWa}
                          </a>
                        )}
                      </td>
                      <td className={tdCls}>
                        <p className="text-slate-700">{pengajarNama ?? <span className="text-rose-500">Belum ditentukan</span>}</p>
                        <p className="text-xs text-slate-500">{s.jamBelajar ? `${s.jamBelajar} WIB` : "-"}</p>
                      </td>
                      <td className={tdCls}>
                        <div className="w-28">
                          <p className="text-xs font-semibold text-slate-700">
                            {hadir}/{pertemuan}
                          </p>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-leaf-500" style={{ width: `${Math.min(100, (hadir / Math.max(pertemuan, 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <Badge tone={STATUS_SANTRI[s.status]} />
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/santri/${s.id}`} className={btnSm.outline} title="Detail & rapor">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link href={buildUrl(P, sp, { edit: String(s.id), tambah: undefined })} className={btnSm.outline} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <form action={deleteSantri}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="back" value={back} />
                            <SubmitButton
                              className={btnSm.danger}
                              pendingText="..."
                              confirmText={`Hapus santri ${s.nama}? Semua riwayat absensi & tagihan SPP santri ini ikut terhapus. Disarankan ubah status menjadi Nonaktif.`}
                            >
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
