import Link from "next/link";
import { and, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { Pencil, Trash2, Wallet } from "lucide-react";
import { db } from "@/db";
import { absensi, santri } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, Flash, PageHeader, btn, btnSm, inputCls, tableCls, tdCls, thCls } from "@/components/ui";
import { requirePengajar } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI } from "@/lib/constants";
import {
  currentPeriode,
  first,
  formatTanggal,
  intOr,
  isHariBelajar,
  isValidDate,
  isValidPeriode,
  namaHari,
  periodeLabel,
  periodeRange,
  rupiah,
  todayJakarta,
} from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { buildUrl, type SP } from "@/lib/url";
import { hapusAbsensi } from "../actions";
import { AbsensiForm } from "./AbsensiForm";

export const dynamic = "force-dynamic";

export default async function PengajarAbsensiPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requirePengajar();
  const sp = await searchParams;
  const P = "/pengajar/absensi";
  const today = todayJakarta();
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const fSantri = intOr(first(sp.santri), 0);
  const editId = intOr(first(sp.edit), 0);
  const tgl = first(sp.tanggal);
  const back = buildUrl(P, sp, { edit: undefined });
  const { tarif, minCatatan } = await getNumbers();

  const santriList = await db
    .select({ id: santri.id, nama: santri.nama, jam: santri.jamBelajar })
    .from(santri)
    .where(and(eq(santri.pengajarId, me.pengajarId), inArray(santri.status, ["aktif", "cuti"])))
    .orderBy(santri.nama);

  const pre = santriList.find((s) => s.id === fSantri);
  let initial: Record<string, string> = {
    santriId: pre ? String(pre.id) : "",
    jamMulai: pre?.jam ?? "",
    tanggal: isValidDate(tgl) && tgl <= today ? tgl : today,
    status: "hadir",
  };
  let editing = false;
  if (editId) {
    const [a] = await db
      .select()
      .from(absensi)
      .where(and(eq(absensi.id, editId), eq(absensi.pengajarId, me.pengajarId)))
      .limit(1);
    if (a && a.klaimStatus !== "disetujui" && a.klaimStatus !== "dibayar") {
      editing = true;
      initial = {
        id: String(a.id),
        santriId: String(a.santriId),
        tanggal: a.tanggal,
        jamMulai: a.jamMulai ?? "",
        status: a.status,
        materi: a.materi ?? "",
        capaian: a.capaian ?? "",
        nilai: a.nilai ?? "",
        catatan: a.catatan ?? "",
        klaim: a.klaimStatus !== "none" || first(sp.klaim) === "1" ? "on" : "",
      };
    }
  }

  const { start, end } = periodeRange(bulan);
  const conds: SQL[] = [eq(absensi.pengajarId, me.pengajarId), gte(absensi.tanggal, start), lte(absensi.tanggal, end)];
  if (fSantri) conds.push(eq(absensi.santriId, fSantri));
  const rows = await db
    .select({ a: absensi, nama: santri.nama })
    .from(absensi)
    .innerJoin(santri, eq(absensi.santriId, santri.id))
    .where(and(...conds))
    .orderBy(desc(absensi.tanggal), santri.nama);
  const totalKlaim = rows.filter((r) => r.a.klaimStatus !== "none" && r.a.klaimStatus !== "ditolak").reduce((s, r) => s + r.a.nominal, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? "Edit Absensi Mengaji" : "Input Absensi Mengaji"}
        subtitle={`Isi setiap selesai mengajar. Catatan pertemuan = klaim bisyarah ${rupiah(tarif)} per pertemuan.`}
        actions={
          editing && (
            <Link href={back} className={btn.outline}>
              Batal Edit
            </Link>
          )
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <Card title={editing ? "Form Edit Absensi" : "Form Absensi Baru"} subtitle={`${santriList.length} santri dalam bimbingan Anda`}>
        {santriList.length === 0 ? (
          <EmptyState title="Belum ada santri" desc="Admin belum menetapkan santri untuk Anda." />
        ) : (
          <AbsensiForm key={JSON.stringify(sp)} santriList={santriList} initial={initial} tarif={tarif} minCatatan={minCatatan} today={today} />
        )}
      </Card>

      <Card
        title={`Riwayat Absensi · ${periodeLabel(bulan)}`}
        subtitle={`${rows.length} catatan · total klaim ${rupiah(totalKlaim)}`}
        action={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="month" name="bulan" defaultValue={bulan} className={`${inputCls} w-auto`} />
            <select name="santri" defaultValue={fSantri || ""} className={`${inputCls} w-auto`}>
              <option value="">Semua santri</option>
              {santriList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
            <button className={btn.outline}>Tampilkan</button>
          </form>
        }
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada absensi pada periode ini" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Santri</th>
                  <th className={thCls}>Kehadiran</th>
                  <th className={thCls}>Materi & Capaian</th>
                  <th className={thCls}>Catatan</th>
                  <th className={thCls}>Bisyarah</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map(({ a, nama }) => {
                  const locked = a.klaimStatus === "disetujui" || a.klaimStatus === "dibayar";
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className={`${tdCls} whitespace-nowrap`}>
                        <p className="font-medium text-slate-800">
                          {namaHari(a.tanggal)}, {formatTanggal(a.tanggal, "short")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {a.jamMulai ?? "--:--"} WIB {!isHariBelajar(a.tanggal) && <span className="text-gold-600">· pengganti</span>}
                        </p>
                      </td>
                      <td className={`${tdCls} font-semibold text-slate-800`}>{nama}</td>
                      <td className={tdCls}>
                        <Badge tone={STATUS_ABSENSI[a.status]} />
                      </td>
                      <td className={tdCls}>
                        <p className="text-slate-700">{a.materi ?? "-"}</p>
                        <p className="text-xs text-slate-500">
                          {a.capaian ?? ""} {a.nilai && `· ${a.nilai}`}
                        </p>
                      </td>
                      <td className={`${tdCls} min-w-[220px] max-w-sm text-xs text-slate-600`}>{a.catatan ?? "-"}</td>
                      <td className={tdCls}>
                        <Badge tone={KLAIM_STATUS[a.klaimStatus]} />
                        {a.klaimStatus !== "none" && <p className="mt-1 text-[11px] text-slate-500">{rupiah(a.nominal)}</p>}
                        {a.klaimStatus === "ditolak" && a.alasanTolak && <p className="mt-1 max-w-[180px] text-[11px] text-rose-600">{a.alasanTolak}</p>}
                      </td>
                      <td className={tdCls}>
                        {locked ? (
                          <span className="text-xs text-slate-400">Terkunci</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {a.status === "hadir" && (a.klaimStatus === "none" || a.klaimStatus === "ditolak") && (
                              <Link href={`${P}?edit=${a.id}&klaim=1&bulan=${bulan}`} className={btnSm.gold} title="Klaim bisyarah">
                                <Wallet className="h-3.5 w-3.5" /> Klaim
                              </Link>
                            )}
                            <Link href={buildUrl(P, sp, { edit: String(a.id) })} className={btnSm.outline} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <form action={hapusAbsensi}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="back" value={back} />
                              <SubmitButton className={btnSm.danger} confirmText={`Hapus absensi ${nama} tanggal ${formatTanggal(a.tanggal)}?`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </SubmitButton>
                            </form>
                          </div>
                        )}
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
