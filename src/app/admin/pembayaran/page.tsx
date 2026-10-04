import Link from "next/link";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { CheckCircle2, FilePlus2, RotateCcw, Search, Trash2 } from "lucide-react";
import { db } from "@/db";
import { pembayaran, santri } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, Card, EmptyState, Flash, PageHeader, StatCard, btn, btnSm, inputCls, inputSm, tableCls, tdCls, thCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { METODE_BAYAR, STATUS_BAYAR } from "@/lib/constants";
import { currentPeriode, first, formatTanggal, isValidPeriode, periodeLabel, rupiah, todayJakarta, waLink } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { buildUrl, type SP } from "@/lib/url";
import { batalLunas, buatTagihan, hapusTagihan, tandaiLunas } from "../actions";

export const dynamic = "force-dynamic";

export default async function PembayaranPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/pembayaran";
  const b = first(sp.periode);
  const periode = isValidPeriode(b) ? b : currentPeriode();
  const st = first(sp.status) ?? "";
  const q = (first(sp.q) ?? "").trim();
  const back = buildUrl(P, sp);
  const { s: set } = await getNumbers();

  const conds: SQL[] = [eq(pembayaran.periode, periode)];
  if (st) conds.push(eq(pembayaran.status, st));
  if (q) {
    const c = or(ilike(santri.nama, `%${q}%`), ilike(santri.kode, `%${q}%`), ilike(santri.namaWali, `%${q}%`));
    if (c) conds.push(c);
  }

  const rows = await db
    .select({ p: pembayaran, nama: santri.nama, kode: santri.kode, wali: santri.namaWali, wa: santri.noWa })
    .from(pembayaran)
    .innerJoin(santri, eq(pembayaran.santriId, santri.id))
    .where(and(...conds))
    .orderBy(pembayaran.status, santri.nama);

  const lunas = rows.filter((r) => r.p.status === "lunas");
  const belum = rows.filter((r) => r.p.status === "belum");
  const sum = (arr: typeof rows) => arr.reduce((a, r) => a + r.p.nominal, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran SPP Santri"
        subtitle={`Tagihan ${set.namaProgram} periode ${periodeLabel(periode)}`}
        actions={
          <form action={buatTagihan}>
            <input type="hidden" name="periode" value={periode} />
            <input type="hidden" name="back" value={back} />
            <SubmitButton className={btn.primary} confirmText={`Buat tagihan ${periodeLabel(periode)} untuk semua santri aktif yang belum memiliki tagihan?`}>
              <FilePlus2 className="h-4 w-4" /> Buat Tagihan {periodeLabel(periode)}
            </SubmitButton>
          </form>
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Tagihan" value={rows.length} sub={rupiah(sum(rows))} tone="brand" />
        <StatCard label="Sudah Lunas" value={lunas.length} sub={rupiah(sum(lunas))} tone="green" />
        <StatCard label="Belum Bayar" value={belum.length} sub={rupiah(sum(belum))} tone="rose" />
      </div>

      <Card bodyClassName="p-0">
        <form method="get" className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <input type="month" name="periode" defaultValue={periode} className={`${inputCls} sm:max-w-[180px]`} />
          <select name="status" defaultValue={st} className={`${inputCls} sm:max-w-[170px]`}>
            <option value="">Semua status</option>
            <option value="lunas">Lunas</option>
            <option value="belum">Belum Bayar</option>
          </select>
          <input name="q" defaultValue={q} placeholder="Cari santri / wali..." className={`${inputCls} sm:max-w-xs`} />
          <button className={btn.outline}>
            <Search className="h-4 w-4" /> Filter
          </button>
          <Link href={P} className="text-sm text-slate-500 hover:text-brand-700">
            Reset
          </Link>
        </form>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada tagihan pada periode ini" desc='Klik "Buat Tagihan" untuk membuat tagihan seluruh santri aktif.' />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Santri</th>
                  <th className={thCls}>Wali</th>
                  <th className={thCls}>Nominal</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Pembayaran</th>
                  <th className={thCls}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map(({ p, nama, kode, wali, wa }) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className={tdCls}>
                      <p className="font-semibold text-slate-800">{nama}</p>
                      <p className="font-mono text-[11px] text-slate-400">{kode}</p>
                    </td>
                    <td className={`${tdCls} text-xs`}>
                      <p className="text-slate-700">{wali ?? "-"}</p>
                      <p className="text-slate-500">{wa ?? ""}</p>
                    </td>
                    <td className={`${tdCls} font-semibold`}>{rupiah(p.nominal)}</td>
                    <td className={tdCls}>
                      <Badge tone={STATUS_BAYAR[p.status]} />
                    </td>
                    <td className={`${tdCls} text-xs text-slate-600`}>
                      {p.status === "lunas" ? (
                        <>
                          <p>{formatTanggal(p.tanggalBayar)}</p>
                          <p className="text-slate-500">
                            {p.metode ?? "-"} {p.keterangan && `· ${p.keterangan}`}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={tdCls}>
                      <div className="flex min-w-[280px] flex-wrap items-center gap-1.5">
                        {p.status === "belum" ? (
                          <>
                            <form action={tandaiLunas} className="flex flex-wrap items-center gap-1.5">
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="back" value={back} />
                              <select name="metode" defaultValue="Transfer Bank" className={inputSm}>
                                {METODE_BAYAR.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <input type="date" name="tanggalBayar" defaultValue={todayJakarta()} className={inputSm} />
                              <SubmitButton className={btnSm.success}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
                              </SubmitButton>
                            </form>
                            {wa && (
                              <a
                                href={waLink(
                                  wa,
                                  `Assalamu'alaikum ${wali ?? "Bapak/Ibu"}, kami mengingatkan SPP ${set.namaProgram} ${set.namaLembaga} untuk ananda ${nama} periode ${periodeLabel(periode)} sebesar ${rupiah(p.nominal)}. Pembayaran dapat ditransfer ke ${set.bankNama} ${set.bankNoRek} a.n. ${set.bankAtasNama}. Jazakumullah khairan.`,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={btnSm.wa}
                              >
                                <WhatsAppIcon className="h-3.5 w-3.5" /> Ingatkan
                              </a>
                            )}
                          </>
                        ) : (
                          <form action={batalLunas}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="back" value={back} />
                            <SubmitButton className={btnSm.outline} confirmText="Kembalikan status menjadi Belum Bayar?">
                              <RotateCcw className="h-3.5 w-3.5" /> Batalkan
                            </SubmitButton>
                          </form>
                        )}
                        <form action={hapusTagihan}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton className={btnSm.danger} confirmText={`Hapus tagihan ${nama} ${periodeLabel(periode)}?`}>
                            <Trash2 className="h-3.5 w-3.5" />
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
