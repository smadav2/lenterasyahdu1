import Link from "next/link";
import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { Banknote, CheckCircle2, FileText, Hourglass, Landmark, Wallet, XCircle } from "lucide-react";
import { db } from "@/db";
import { absensi, bisyarahPayout, pengajar, santri } from "@/db/schema";
import { Badge, Card, EmptyState, PageHeader, StatCard, btn, btnSm, inputCls, tableCls, tdCls, thCls } from "@/components/ui";
import { requirePengajar } from "@/lib/auth";
import { KLAIM_STATUS } from "@/lib/constants";
import { currentPeriode, first, formatTanggal, isValidPeriode, namaHari, periodeLabel, periodeRange, rupiah } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import type { SP } from "@/lib/url";

export const dynamic = "force-dynamic";

const cntK = (st: string) => sql<number>`count(*) filter (where ${absensi.klaimStatus} = ${st})`.mapWith(Number);
const sumK = (st: string) => sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} = ${st}), 0)`.mapWith(Number);

export default async function BisyarahSayaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requirePengajar();
  const sp = await searchParams;
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const { start, end } = periodeRange(bulan);
  const { tarif, minCatatan } = await getNumbers();
  const inMonth = and(eq(absensi.pengajarId, me.pengajarId), gte(absensi.tanggal, start), lte(absensi.tanggal, end));

  const [[stat], claims, belum, payouts, [profil]] = await Promise.all([
    db
      .select({
        dN: cntK("diajukan"),
        dRp: sumK("diajukan"),
        sN: cntK("disetujui"),
        sRp: sumK("disetujui"),
        bN: cntK("dibayar"),
        bRp: sumK("dibayar"),
        tN: cntK("ditolak"),
      })
      .from(absensi)
      .where(inMonth),
    db
      .select({ a: absensi, nama: santri.nama })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .where(and(inMonth, ne(absensi.klaimStatus, "none")))
      .orderBy(desc(absensi.tanggal)),
    db
      .select({ a: absensi, nama: santri.nama })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .where(and(inMonth, eq(absensi.status, "hadir"), eq(absensi.klaimStatus, "none")))
      .orderBy(desc(absensi.tanggal)),
    db.select().from(bisyarahPayout).where(eq(bisyarahPayout.pengajarId, me.pengajarId)).orderBy(desc(bisyarahPayout.tanggalBayar)).limit(12),
    db.select().from(pengajar).where(eq(pengajar.id, me.pengajarId)).limit(1),
  ]);

  const totalBulan = (stat?.dRp ?? 0) + (stat?.sRp ?? 0) + (stat?.bRp ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bisyarah Saya"
        subtitle={`${rupiah(tarif)} per pertemuan · total klaim ${periodeLabel(bulan)}: ${rupiah(totalBulan)}`}
        actions={
          <form method="get" className="flex items-center gap-2">
            <input type="month" name="bulan" defaultValue={bulan} className={inputCls} />
            <button className={btn.outline}>Tampilkan</button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menunggu Persetujuan" value={stat?.dN ?? 0} sub={rupiah(stat?.dRp ?? 0)} icon={<Hourglass className="h-5 w-5" />} tone="gold" />
        <StatCard label="Disetujui" value={stat?.sN ?? 0} sub={rupiah(stat?.sRp ?? 0)} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
        <StatCard label="Sudah Dibayar" value={stat?.bN ?? 0} sub={rupiah(stat?.bRp ?? 0)} icon={<Banknote className="h-5 w-5" />} tone="green" />
        <StatCard label="Ditolak" value={stat?.tN ?? 0} sub="Perbaiki catatan lalu ajukan ulang" icon={<XCircle className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Rekening Pencairan" className="xl:col-span-1">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="text-sm">
              {profil?.bank ? (
                <>
                  <p className="font-semibold text-slate-800">
                    {profil.bank} · {profil.noRekening}
                  </p>
                  <p className="text-slate-500">a.n. {profil.atasNama ?? "-"}</p>
                </>
              ) : (
                <p className="text-rose-600">Rekening belum diisi.</p>
              )}
              <Link href="/pengajar/profil" className="mt-2 inline-block text-xs font-semibold text-brand-700 underline">
                Ubah rekening
              </Link>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-700">Syarat klaim:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Status santri <b>Hadir</b></li>
              <li>Materi pertemuan terisi</li>
              <li>Catatan pertemuan min. {minCatatan} karakter</li>
              <li>1 santri maksimal 1 klaim per hari</li>
            </ul>
          </div>
        </Card>

        <Card
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gold-600" /> Pertemuan Hadir yang Belum Diklaim
            </span>
          }
          subtitle="Tambahkan catatan pertemuan agar bisyarah dapat diajukan"
        >
          {belum.length === 0 ? (
            <EmptyState title="Semua pertemuan hadir sudah diklaim" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {belum.map(({ a, nama }) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{nama}</p>
                    <p className="text-xs text-slate-500">
                      {namaHari(a.tanggal)}, {formatTanggal(a.tanggal)} · {a.materi ?? "materi belum diisi"}
                    </p>
                  </div>
                  <Link href={`/pengajar/absensi?edit=${a.id}&klaim=1&bulan=${bulan}`} className={btnSm.gold}>
                    <Wallet className="h-3.5 w-3.5" /> Klaim {rupiah(tarif)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={`Daftar Klaim · ${periodeLabel(bulan)}`} bodyClassName="p-0">
        {claims.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada klaim pada bulan ini" desc="Klaim dibuat otomatis saat Anda mengisi absensi dengan catatan pertemuan." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Santri</th>
                  <th className={thCls}>Catatan Pertemuan</th>
                  <th className={thCls}>Nominal</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {claims.map(({ a, nama }) => (
                  <tr key={a.id}>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      {namaHari(a.tanggal)}, {formatTanggal(a.tanggal, "short")}
                    </td>
                    <td className={`${tdCls} font-semibold text-slate-800`}>{nama}</td>
                    <td className={`${tdCls} min-w-[240px] max-w-md text-xs text-slate-600`}>
                      {a.catatan ?? "-"}
                      {a.klaimStatus === "ditolak" && (
                        <p className="mt-1 text-rose-600">
                          Ditolak: {a.alasanTolak ?? "-"}{" "}
                          <Link href={`/pengajar/absensi?edit=${a.id}&klaim=1&bulan=${bulan}`} className="font-semibold underline">
                            Perbaiki
                          </Link>
                        </p>
                      )}
                    </td>
                    <td className={`${tdCls} font-semibold`}>{rupiah(a.nominal)}</td>
                    <td className={tdCls}>
                      <Badge tone={KLAIM_STATUS[a.klaimStatus]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Riwayat Pembayaran Bisyarah" bodyClassName="p-0">
        {payouts.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada pembayaran" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Periode</th>
                  <th className={thCls}>Tanggal Bayar</th>
                  <th className={thCls}>Pertemuan</th>
                  <th className={thCls}>Total</th>
                  <th className={thCls}>Keterangan</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payouts.map((po) => (
                  <tr key={po.id}>
                    <td className={`${tdCls} font-semibold text-slate-800`}>{periodeLabel(po.periode)}</td>
                    <td className={tdCls}>{formatTanggal(po.tanggalBayar)}</td>
                    <td className={tdCls}>{po.jumlahPertemuan}x</td>
                    <td className={`${tdCls} font-bold text-emerald-700`}>{rupiah(po.total)}</td>
                    <td className={`${tdCls} text-xs`}>{po.keterangan ?? "-"}</td>
                    <td className={tdCls}>
                      <Link href={`/slip-bisyarah/${po.id}`} target="_blank" className={btnSm.outline}>
                        <FileText className="h-3.5 w-3.5" /> Slip
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
