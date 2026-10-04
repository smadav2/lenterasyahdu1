import { and, count, eq, gte, lte, ne, sql } from "drizzle-orm";
import { ArrowDownCircle, ArrowUpCircle, Hourglass, Scale } from "lucide-react";
import { db } from "@/db";
import { absensi, bisyarahPayout, pembayaran, pengajar, santri } from "@/db/schema";
import { PrintButton } from "@/components/client";
import { LogoBadge } from "@/components/Logo";
import { Badge, Card, PageHeader, StatCard, btn, inputCls, tableCls, tdCls, thCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { STATUS_BAYAR } from "@/lib/constants";
import { currentPeriode, first, hariBelajarDalamBulan, isValidPeriode, periodeLabel, periodeRange, rupiah } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import type { SP } from "@/lib/url";

export const dynamic = "force-dynamic";

const cntS = (st: string) => sql<number>`count(${absensi.id}) filter (where ${absensi.status} = ${st})`.mapWith(Number);

export default async function LaporanPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const { start, end } = periodeRange(bulan);
  const { s: set, pertemuan } = await getNumbers();
  const joinCond = (col: typeof absensi.pengajarId | typeof absensi.santriId, id: typeof pengajar.id | typeof santri.id) =>
    and(eq(col, id), gte(absensi.tanggal, start), lte(absensi.tanggal, end));

  const [[spp], [bisy], [payout], perPengajar, perSantri, sppRows, santriAktif] = await Promise.all([
    db
      .select({
        lunasRp: sql<number>`coalesce(sum(${pembayaran.nominal}) filter (where ${pembayaran.status} = 'lunas'), 0)`.mapWith(Number),
        lunasN: sql<number>`count(*) filter (where ${pembayaran.status} = 'lunas')`.mapWith(Number),
        belumRp: sql<number>`coalesce(sum(${pembayaran.nominal}) filter (where ${pembayaran.status} = 'belum'), 0)`.mapWith(Number),
        belumN: sql<number>`count(*) filter (where ${pembayaran.status} = 'belum')`.mapWith(Number),
      })
      .from(pembayaran)
      .where(eq(pembayaran.periode, bulan)),
    db
      .select({
        terutangRp: sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} in ('diajukan','disetujui')), 0)`.mapWith(Number),
        validN: sql<number>`count(*) filter (where ${absensi.klaimStatus} in ('diajukan','disetujui','dibayar'))`.mapWith(Number),
      })
      .from(absensi)
      .where(and(gte(absensi.tanggal, start), lte(absensi.tanggal, end))),
    db
      .select({ total: sql<number>`coalesce(sum(${bisyarahPayout.total}), 0)`.mapWith(Number) })
      .from(bisyarahPayout)
      .where(eq(bisyarahPayout.periode, bulan)),
    db
      .select({
        pid: pengajar.id,
        nama: pengajar.nama,
        status: pengajar.status,
        sesi: count(absensi.id),
        hadir: cntS("hadir"),
        klaimRp: sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} in ('diajukan','disetujui','dibayar')), 0)`.mapWith(Number),
        dibayarRp: sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} = 'dibayar'), 0)`.mapWith(Number),
      })
      .from(pengajar)
      .leftJoin(absensi, joinCond(absensi.pengajarId, pengajar.id))
      .groupBy(pengajar.id)
      .orderBy(pengajar.nama),
    db
      .select({
        sid: santri.id,
        nama: santri.nama,
        kode: santri.kode,
        pengajarNama: pengajar.nama,
        hadir: cntS("hadir"),
        izin: cntS("izin"),
        sakit: cntS("sakit"),
        alpa: cntS("alpa"),
      })
      .from(santri)
      .leftJoin(pengajar, eq(santri.pengajarId, pengajar.id))
      .leftJoin(absensi, joinCond(absensi.santriId, santri.id))
      .where(ne(santri.status, "nonaktif"))
      .groupBy(santri.id, pengajar.id)
      .orderBy(santri.nama),
    db.select({ sid: pembayaran.santriId, status: pembayaran.status }).from(pembayaran).where(eq(pembayaran.periode, bulan)),
    db.select({ n: count() }).from(santri).where(eq(santri.status, "aktif")),
  ]);

  const sppMap = new Map(sppRows.map((r) => [r.sid, r.status]));
  const pemasukan = spp?.lunasRp ?? 0;
  const bisyarahTotal = (payout?.total ?? 0) + (bisy?.terutangRp ?? 0);
  const saldo = pemasukan - bisyarahTotal;
  const hariBelajar = hariBelajarDalamBulan(bulan);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Bulanan"
        subtitle={`Ringkasan keuangan, kinerja pengajar & kehadiran santri · ${periodeLabel(bulan)}`}
        actions={
          <>
            <form method="get" className="flex items-center gap-2">
              <input type="month" name="bulan" defaultValue={bulan} className={inputCls} />
              <button className={btn.outline}>Tampilkan</button>
            </form>
            <PrintButton className={btn.primary} label="Cetak Laporan" />
          </>
        }
      />

      <div className="hidden items-center gap-4 border-b border-slate-200 pb-4 print:flex">
        <LogoBadge className="h-14 w-14" markClassName="h-9 w-9" />
        <div>
          <p className="text-lg font-bold">
            {set.namaLembaga} — Laporan {periodeLabel(bulan)}
          </p>
          <p className="text-sm text-slate-500">
            {set.namaProgram} · {set.hariBelajar} · {hariBelajar} hari belajar di bulan ini
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pemasukan SPP (Lunas)" value={rupiah(pemasukan)} sub={`${spp?.lunasN ?? 0} santri`} icon={<ArrowDownCircle className="h-5 w-5" />} tone="green" />
        <StatCard label="SPP Belum Dibayar" value={rupiah(spp?.belumRp ?? 0)} sub={`${spp?.belumN ?? 0} santri`} icon={<Hourglass className="h-5 w-5" />} tone="gold" />
        <StatCard
          label="Beban Bisyarah"
          value={rupiah(bisyarahTotal)}
          sub={`Dibayar ${rupiah(payout?.total ?? 0)} · terutang ${rupiah(bisy?.terutangRp ?? 0)}`}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          tone="rose"
        />
        <StatCard label="Estimasi Saldo" value={rupiah(saldo)} sub="Pemasukan − beban bisyarah" icon={<Scale className="h-5 w-5" />} tone={saldo >= 0 ? "brand" : "rose"} />
      </div>

      <Card title="Rekap Kinerja Pengajar" subtitle={`${bisy?.validN ?? 0} pertemuan diklaim bulan ini`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Pengajar</th>
                <th className={thCls}>Total Sesi Dicatat</th>
                <th className={thCls}>Pertemuan Hadir</th>
                <th className={thCls}>Bisyarah Diklaim</th>
                <th className={thCls}>Sudah Dibayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {perPengajar.map((p) => (
                <tr key={p.pid}>
                  <td className={`${tdCls} font-semibold text-slate-800`}>
                    {p.nama} {p.status !== "aktif" && <span className="text-xs font-normal text-slate-400">(nonaktif)</span>}
                  </td>
                  <td className={tdCls}>{p.sesi}</td>
                  <td className={tdCls}>{p.hadir}</td>
                  <td className={`${tdCls} font-semibold text-brand-700`}>{rupiah(p.klaimRp)}</td>
                  <td className={`${tdCls} text-emerald-700`}>{rupiah(p.dibayarRp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Rekap Kehadiran Santri" subtitle={`${santriAktif[0]?.n ?? 0} santri aktif · target ${pertemuan} pertemuan / bulan`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Santri</th>
                <th className={thCls}>Pengajar</th>
                <th className={thCls}>Hadir</th>
                <th className={thCls}>Izin</th>
                <th className={thCls}>Sakit</th>
                <th className={thCls}>Alpa</th>
                <th className={thCls}>Kehadiran</th>
                <th className={thCls}>SPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {perSantri.map((s) => {
                const persen = Math.min(100, Math.round((s.hadir / Math.max(pertemuan, 1)) * 100));
                const sppSt = sppMap.get(s.sid);
                return (
                  <tr key={s.sid}>
                    <td className={tdCls}>
                      <p className="font-semibold text-slate-800">{s.nama}</p>
                      <p className="font-mono text-[11px] text-slate-400">{s.kode}</p>
                    </td>
                    <td className={`${tdCls} text-xs`}>{s.pengajarNama ?? "-"}</td>
                    <td className={`${tdCls} font-semibold text-emerald-700`}>{s.hadir}</td>
                    <td className={tdCls}>{s.izin}</td>
                    <td className={tdCls}>{s.sakit}</td>
                    <td className={`${tdCls} text-rose-600`}>{s.alpa}</td>
                    <td className={tdCls}>
                      <div className="flex w-32 items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${persen}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{persen}%</span>
                      </div>
                    </td>
                    <td className={tdCls}>{sppSt ? <Badge tone={STATUS_BAYAR[sppSt]} /> : <span className="text-xs text-slate-400">-</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
