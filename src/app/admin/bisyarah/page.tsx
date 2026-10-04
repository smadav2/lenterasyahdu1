import Link from "next/link";
import { and, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { Banknote, CheckCheck, CheckCircle2, Clock, FileText, RotateCcw, Undo2, XCircle } from "lucide-react";
import { db } from "@/db";
import { absensi, bisyarahPayout, pengajar, santri } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, Flash, PageHeader, StatCard, btn, btnSm, inputCls, inputSm, tableCls, tdCls, thCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { KLAIM_STATUS } from "@/lib/constants";
import {
  currentPeriode,
  cx,
  first,
  formatTanggal,
  intOr,
  isValidPeriode,
  namaHari,
  periodeLabel,
  periodeRange,
  rupiah,
  todayJakarta,
} from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { buildUrl, type SP } from "@/lib/url";
import { batalkanPayout, bayarBisyarah, setKlaim, setujuiSemua } from "../actions";

export const dynamic = "force-dynamic";

const cntK = (st: string) => sql<number>`count(*) filter (where ${absensi.klaimStatus} = ${st})`.mapWith(Number);
const sumK = (st: string) => sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} = ${st}), 0)`.mapWith(Number);

const FILTERS = [
  { k: "diajukan", l: "Menunggu" },
  { k: "disetujui", l: "Disetujui" },
  { k: "dibayar", l: "Dibayar" },
  { k: "ditolak", l: "Ditolak" },
  { k: "semua", l: "Semua" },
];

export default async function AdminBisyarahPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/bisyarah";
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const pid = intOr(first(sp.pengajar), 0);
  const k = FILTERS.some((f) => f.k === first(sp.k)) ? (first(sp.k) as string) : "diajukan";
  const back = buildUrl(P, sp);
  const { start, end } = periodeRange(bulan);
  const { tarif, minCatatan } = await getNumbers();

  const claimConds: SQL[] = [gte(absensi.tanggal, start), lte(absensi.tanggal, end), ne(absensi.klaimStatus, "none")];
  if (pid) claimConds.push(eq(absensi.pengajarId, pid));
  if (k !== "semua") claimConds.push(eq(absensi.klaimStatus, k));

  const [rekap, claims, payouts] = await Promise.all([
    db
      .select({
        pid: pengajar.id,
        nama: pengajar.nama,
        bank: pengajar.bank,
        noRekening: pengajar.noRekening,
        atasNama: pengajar.atasNama,
        diajukanN: cntK("diajukan"),
        diajukanRp: sumK("diajukan"),
        disetujuiN: cntK("disetujui"),
        disetujuiRp: sumK("disetujui"),
        dibayarN: cntK("dibayar"),
        dibayarRp: sumK("dibayar"),
        ditolakN: cntK("ditolak"),
      })
      .from(absensi)
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .where(and(gte(absensi.tanggal, start), lte(absensi.tanggal, end), ne(absensi.klaimStatus, "none")))
      .groupBy(pengajar.id)
      .orderBy(pengajar.nama),
    db
      .select({ a: absensi, santriNama: santri.nama, pengajarNama: pengajar.nama })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .where(and(...claimConds))
      .orderBy(desc(absensi.tanggal))
      .limit(500),
    db
      .select({ po: bisyarahPayout, nama: pengajar.nama })
      .from(bisyarahPayout)
      .innerJoin(pengajar, eq(bisyarahPayout.pengajarId, pengajar.id))
      .where(eq(bisyarahPayout.periode, bulan))
      .orderBy(desc(bisyarahPayout.createdAt)),
  ]);

  const tot = rekap.reduce(
    (a, r) => ({
      dN: a.dN + r.diajukanN,
      dRp: a.dRp + r.diajukanRp,
      sN: a.sN + r.disetujuiN,
      sRp: a.sRp + r.disetujuiRp,
      bN: a.bN + r.dibayarN,
      bRp: a.bRp + r.dibayarRp,
      tN: a.tN + r.ditolakN,
    }),
    { dN: 0, dRp: 0, sN: 0, sRp: 0, bN: 0, bRp: 0, tN: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Klaim Bisyarah Pengajar"
        subtitle={`Tarif ${rupiah(tarif)} / pertemuan · klaim otomatis dari absensi berstatus Hadir dengan catatan min. ${minCatatan} karakter`}
        actions={
          <form method="get" className="flex items-center gap-2">
            <input type="month" name="bulan" defaultValue={bulan} className={inputCls} />
            <button className={btn.outline}>Tampilkan</button>
          </form>
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menunggu Persetujuan" value={tot.dN} sub={rupiah(tot.dRp)} icon={<Clock className="h-5 w-5" />} tone="gold" />
        <StatCard label="Disetujui (belum dibayar)" value={tot.sN} sub={rupiah(tot.sRp)} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
        <StatCard label="Sudah Dibayar" value={tot.bN} sub={rupiah(tot.bRp)} icon={<Banknote className="h-5 w-5" />} tone="green" />
        <StatCard label="Ditolak" value={tot.tN} icon={<XCircle className="h-5 w-5" />} tone="rose" />
      </div>

      <Card title={`Rekap per Pengajar · ${periodeLabel(bulan)}`} bodyClassName="p-0">
        {rekap.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada klaim bisyarah pada bulan ini" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Pengajar & Rekening</th>
                  <th className={thCls}>Menunggu</th>
                  <th className={thCls}>Disetujui</th>
                  <th className={thCls}>Dibayar</th>
                  <th className={thCls}>Ditolak</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rekap.map((r) => (
                  <tr key={r.pid} className={cx(pid === r.pid && "bg-brand-50/50")}>
                    <td className={tdCls}>
                      <p className="font-semibold text-slate-800">{r.nama}</p>
                      <p className="text-xs text-slate-500">
                        {r.bank ? `${r.bank} ${r.noRekening ?? ""} a.n. ${r.atasNama ?? "-"}` : "Rekening belum diisi"}
                      </p>
                    </td>
                    <td className={tdCls}>
                      <p className="font-semibold text-gold-700">{r.diajukanN}x</p>
                      <p className="text-xs text-slate-500">{rupiah(r.diajukanRp)}</p>
                    </td>
                    <td className={tdCls}>
                      <p className="font-semibold text-sky-700">{r.disetujuiN}x</p>
                      <p className="text-xs text-slate-500">{rupiah(r.disetujuiRp)}</p>
                    </td>
                    <td className={tdCls}>
                      <p className="font-semibold text-emerald-700">{r.dibayarN}x</p>
                      <p className="text-xs text-slate-500">{rupiah(r.dibayarRp)}</p>
                    </td>
                    <td className={`${tdCls} font-semibold text-rose-600`}>{r.ditolakN}x</td>
                    <td className={tdCls}>
                      <div className="flex min-w-[300px] flex-col gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={buildUrl(P, sp, { pengajar: String(r.pid), k: "semua" })} className={btnSm.outline}>
                            <FileText className="h-3.5 w-3.5" /> Detail
                          </Link>
                          {r.diajukanN > 0 && (
                            <form action={setujuiSemua}>
                              <input type="hidden" name="pengajarId" value={r.pid} />
                              <input type="hidden" name="periode" value={bulan} />
                              <input type="hidden" name="back" value={back} />
                              <SubmitButton className={btnSm.primary} confirmText={`Setujui ${r.diajukanN} klaim ${r.nama}?`}>
                                <CheckCheck className="h-3.5 w-3.5" /> Setujui Semua ({r.diajukanN})
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                        {r.disetujuiN > 0 && (
                          <form action={bayarBisyarah} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-emerald-50 p-2">
                            <input type="hidden" name="pengajarId" value={r.pid} />
                            <input type="hidden" name="periode" value={bulan} />
                            <input type="hidden" name="back" value={back} />
                            <input type="date" name="tanggalBayar" defaultValue={todayJakarta()} className={inputSm} />
                            <input name="keterangan" placeholder="Ket. (cth: Transfer BSI)" className={`${inputSm} w-36`} />
                            <SubmitButton
                              className={btnSm.success}
                              confirmText={`Tandai bisyarah ${r.nama} sebesar ${rupiah(r.disetujuiRp)} (${r.disetujuiN} pertemuan) sudah dibayar?`}
                            >
                              <Banknote className="h-3.5 w-3.5" /> Bayar {rupiah(r.disetujuiRp)}
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Daftar Klaim per Pertemuan"
        subtitle={pid ? `Filter pengajar: ${rekap.find((r) => r.pid === pid)?.nama ?? "-"}` : "Semua pengajar"}
        action={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Link
                key={f.k}
                href={buildUrl(P, sp, { k: f.k })}
                className={cx("rounded-lg px-3 py-1.5 text-xs font-semibold", k === f.k ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >
                {f.l}
              </Link>
            ))}
            {pid > 0 && (
              <Link href={buildUrl(P, sp, { pengajar: undefined })} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                × Semua pengajar
              </Link>
            )}
          </div>
        }
        bodyClassName="p-0"
      >
        {claims.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Tidak ada klaim" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Pengajar / Santri</th>
                  <th className={thCls}>Catatan Pertemuan (dasar klaim)</th>
                  <th className={thCls}>Nominal</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {claims.map(({ a, santriNama, pengajarNama }) => (
                  <tr key={a.id}>
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <p className="font-medium text-slate-800">
                        {namaHari(a.tanggal)}, {formatTanggal(a.tanggal, "short")}
                      </p>
                      <p className="text-xs text-slate-500">{a.jamMulai ?? "--:--"} WIB</p>
                    </td>
                    <td className={tdCls}>
                      <p className="font-semibold text-slate-800">{pengajarNama}</p>
                      <p className="text-xs text-slate-500">{santriNama}</p>
                    </td>
                    <td className={`${tdCls} min-w-[260px] max-w-md`}>
                      <p className="text-xs text-slate-500">
                        {a.materi ?? "-"} {a.capaian && `· ${a.capaian}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{a.catatan ?? "-"}</p>
                      {a.klaimStatus === "ditolak" && a.alasanTolak && <p className="mt-1 text-xs text-rose-600">Alasan ditolak: {a.alasanTolak}</p>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap font-semibold`}>{rupiah(a.nominal)}</td>
                    <td className={tdCls}>
                      <Badge tone={KLAIM_STATUS[a.klaimStatus]} />
                    </td>
                    <td className={tdCls}>
                      {a.klaimStatus === "dibayar" ? (
                        <span className="text-xs text-slate-400">Terkunci</span>
                      ) : (
                        <div className="flex min-w-[220px] flex-col gap-1.5">
                          <div className="flex gap-1.5">
                            {a.klaimStatus !== "disetujui" && (
                              <form action={setKlaim}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="status" value="disetujui" />
                                <input type="hidden" name="back" value={back} />
                                <SubmitButton className={btnSm.success}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                                </SubmitButton>
                              </form>
                            )}
                            {a.klaimStatus !== "diajukan" && (
                              <form action={setKlaim}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="status" value="diajukan" />
                                <input type="hidden" name="back" value={back} />
                                <SubmitButton className={btnSm.outline}>
                                  <Undo2 className="h-3.5 w-3.5" /> Kembalikan
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                          {a.klaimStatus !== "ditolak" && (
                            <form action={setKlaim} className="flex gap-1.5">
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="ditolak" />
                              <input type="hidden" name="back" value={back} />
                              <input name="alasan" placeholder="Alasan tolak" className={`${inputSm} w-32`} />
                              <SubmitButton className={btnSm.danger}>
                                <XCircle className="h-3.5 w-3.5" /> Tolak
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Riwayat Pembayaran Bisyarah · ${periodeLabel(bulan)}`} bodyClassName="p-0">
        {payouts.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada pembayaran pada periode ini" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal Bayar</th>
                  <th className={thCls}>Pengajar</th>
                  <th className={thCls}>Pertemuan</th>
                  <th className={thCls}>Total</th>
                  <th className={thCls}>Keterangan</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payouts.map(({ po, nama }) => (
                  <tr key={po.id}>
                    <td className={tdCls}>{formatTanggal(po.tanggalBayar)}</td>
                    <td className={`${tdCls} font-semibold text-slate-800`}>{nama}</td>
                    <td className={tdCls}>{po.jumlahPertemuan}x</td>
                    <td className={`${tdCls} font-bold text-emerald-700`}>{rupiah(po.total)}</td>
                    <td className={`${tdCls} text-xs`}>{po.keterangan ?? "-"}</td>
                    <td className={tdCls}>
                      <div className="flex gap-1.5">
                        <Link href={`/slip-bisyarah/${po.id}`} target="_blank" className={btnSm.outline}>
                          <FileText className="h-3.5 w-3.5" /> Slip
                        </Link>
                        <form action={batalkanPayout}>
                          <input type="hidden" name="id" value={po.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton className={btnSm.danger} confirmText={`Batalkan pembayaran bisyarah ${nama} (${rupiah(po.total)})?`}>
                            <RotateCcw className="h-3.5 w-3.5" /> Batalkan
                          </SubmitButton>
                        </form>
                      </div>
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
