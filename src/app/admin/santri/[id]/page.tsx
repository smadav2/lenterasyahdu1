import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { absensi, pembayaran, pengajar, santri } from "@/db/schema";
import { PrintButton } from "@/components/client";
import { WhatsAppIcon } from "@/components/icons";
import { LogoBadge } from "@/components/Logo";
import { Badge, Card, EmptyState, btn, tableCls, tdCls, thCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI, STATUS_BAYAR, STATUS_SANTRI } from "@/lib/constants";
import {
  currentPeriode,
  first,
  formatTanggal,
  hitungUsia,
  intOr,
  isValidPeriode,
  namaHari,
  periodeLabel,
  periodeRange,
  rupiah,
  waLink,
} from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import type { SP } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function SantriDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const sid = intOr(id, 0);
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const { start, end } = periodeRange(bulan);
  const { s: set, pertemuan } = await getNumbers();

  const [row] = await db
    .select({ s: santri, pengajarNama: pengajar.nama })
    .from(santri)
    .leftJoin(pengajar, eq(santri.pengajarId, pengajar.id))
    .where(eq(santri.id, sid))
    .limit(1);
  if (!row) notFound();
  const s = row.s;

  const [rows, spp, [total]] = await Promise.all([
    db
      .select({ a: absensi, pengajarNama: pengajar.nama })
      .from(absensi)
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .where(and(eq(absensi.santriId, sid), gte(absensi.tanggal, start), lte(absensi.tanggal, end)))
      .orderBy(desc(absensi.tanggal)),
    db.select().from(pembayaran).where(eq(pembayaran.santriId, sid)).orderBy(desc(pembayaran.periode)),
    db.select({ n: count() }).from(absensi).where(and(eq(absensi.santriId, sid), eq(absensi.status, "hadir"))),
  ]);

  const cnt = (st: string) => rows.filter((r) => r.a.status === st).length;
  const hadir = cnt("hadir");
  const persen = Math.min(100, Math.round((hadir / Math.max(pertemuan, 1)) * 100));
  const usia = hitungUsia(s.tanggalLahir);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/santri" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Data Santri
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <input type="month" name="bulan" defaultValue={bulan} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button className={btn.outline}>Tampilkan</button>
          </form>
          <Link href={`/admin/santri?edit=${s.id}`} className={btn.outline}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          {s.noWa && (
            <a
              href={waLink(
                s.noWa,
                `Assalamu'alaikum ${s.namaWali ?? ""}, berikut info ${set.namaLembaga}: kode santri ${s.nama} adalah ${s.kode}. Progres belajar dapat dicek di menu "Cek Progres" pada website kami. Jazakumullah khairan.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <WhatsAppIcon className="h-4 w-4" /> Kirim Kode ke Wali
            </a>
          )}
          <PrintButton className={btn.primary} label="Cetak Rapor" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <LogoBadge className="h-14 w-14" markClassName="h-9 w-9" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                Rapor {set.namaProgram} · {periodeLabel(bulan)}
              </p>
              <h1 className="text-xl font-bold text-slate-900">{s.nama}</h1>
              <p className="text-sm text-slate-500">
                {s.kode} · {s.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}
                {usia !== null && ` · ${usia} tahun`} · {s.kota ?? "-"}
              </p>
            </div>
          </div>
          <Badge tone={STATUS_SANTRI[s.status]} />
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Pengajar</dt>
            <dd className="font-semibold text-slate-800">{row.pengajarNama ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Jadwal</dt>
            <dd className="font-semibold text-slate-800">
              {set.hariBelajar} · {s.jamBelajar ?? "-"} WIB
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Wali / WhatsApp</dt>
            <dd className="font-semibold text-slate-800">
              {s.namaWali ?? "-"} · {s.noWa ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Mulai Belajar · Level Awal</dt>
            <dd className="font-semibold text-slate-800">
              {formatTanggal(s.tanggalMulai)} · {s.levelAwal ?? "-"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
          {(["hadir", "izin", "sakit", "alpa"] as const).map((st) => (
            <div key={st} className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{cnt(st)}</p>
              <p className="text-xs text-slate-500">{STATUS_ABSENSI[st].label}</p>
            </div>
          ))}
          <div className="rounded-xl bg-brand-50 p-3 text-center">
            <p className="text-xl font-bold text-brand-700">{persen}%</p>
            <p className="text-xs text-slate-500">
              {hadir}/{pertemuan} target
            </p>
          </div>
          <div className="rounded-xl bg-gold-50 p-3 text-center">
            <p className="text-xl font-bold text-gold-700">{total?.n ?? 0}</p>
            <p className="text-xs text-slate-500">Total hadir</p>
          </div>
        </div>

        <h2 className="mt-8 font-semibold text-slate-900">Riwayat Pertemuan {periodeLabel(bulan)}</h2>
        {rows.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Belum ada absensi pada bulan ini" />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Materi & Capaian</th>
                  <th className={thCls}>Nilai</th>
                  <th className={thCls}>Catatan Pengajar</th>
                  <th className={`${thCls} no-print`}>Bisyarah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ a, pengajarNama }) => (
                  <tr key={a.id}>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <p className="font-medium text-slate-800">
                        {namaHari(a.tanggal)}, {formatTanggal(a.tanggal, "short")}
                      </p>
                      <p className="text-xs text-slate-500">{pengajarNama}</p>
                    </td>
                    <td className={tdCls}>
                      <Badge tone={STATUS_ABSENSI[a.status]} />
                    </td>
                    <td className={tdCls}>
                      <p className="text-slate-700">{a.materi ?? "-"}</p>
                      <p className="text-xs text-slate-500">{a.capaian ?? ""}</p>
                    </td>
                    <td className={`${tdCls} whitespace-nowrap text-xs`}>{a.nilai ?? "-"}</td>
                    <td className={`${tdCls} min-w-[240px] text-xs text-slate-600`}>{a.catatan ?? "-"}</td>
                    <td className={`${tdCls} no-print`}>
                      <Badge tone={KLAIM_STATUS[a.klaimStatus]} />
                      {a.klaimStatus !== "none" && <p className="mt-1 text-[11px] text-slate-500">{rupiah(a.nominal)}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Card title="Riwayat Pembayaran SPP" className="no-print">
        {spp.length === 0 ? (
          <EmptyState title="Belum ada tagihan" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {spp.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{periodeLabel(p.periode)}</p>
                  <p className="text-xs text-slate-500">
                    {rupiah(p.nominal)}
                    {p.tanggalBayar && ` · ${formatTanggal(p.tanggalBayar)}`}
                  </p>
                </div>
                <Badge tone={STATUS_BAYAR[p.status]} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
