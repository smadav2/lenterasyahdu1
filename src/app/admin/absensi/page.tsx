import Link from "next/link";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { Download, Search, Trash2 } from "lucide-react";
import { db } from "@/db";
import { absensi, pengajar, santri } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, Flash, PageHeader, btn, btnSm, inputCls, tableCls, tdCls, thCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI } from "@/lib/constants";
import {
  currentPeriode,
  first,
  formatTanggal,
  intOr,
  isHariBelajar,
  isValidPeriode,
  namaHari,
  periodeLabel,
  periodeRange,
  rupiah,
} from "@/lib/format";
import { buildUrl, type SP } from "@/lib/url";
import { hapusAbsensiAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminAbsensiPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/absensi";
  const b = first(sp.bulan);
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const pid = intOr(first(sp.pengajar), 0);
  const sid = intOr(first(sp.santri), 0);
  const st = first(sp.status) ?? "";
  const k = first(sp.klaim) ?? "";
  const back = buildUrl(P, sp);
  const { start, end } = periodeRange(bulan);

  const conds: SQL[] = [gte(absensi.tanggal, start), lte(absensi.tanggal, end)];
  if (pid) conds.push(eq(absensi.pengajarId, pid));
  if (sid) conds.push(eq(absensi.santriId, sid));
  if (st) conds.push(eq(absensi.status, st));
  if (k) conds.push(eq(absensi.klaimStatus, k));

  const [rows, pengajarList, santriList] = await Promise.all([
    db
      .select({ a: absensi, santriNama: santri.nama, santriKode: santri.kode, pengajarNama: pengajar.nama })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .where(and(...conds))
      .orderBy(desc(absensi.tanggal), santri.nama)
      .limit(1000),
    db.select({ id: pengajar.id, nama: pengajar.nama }).from(pengajar).orderBy(pengajar.nama),
    db.select({ id: santri.id, nama: santri.nama }).from(santri).orderBy(santri.nama),
  ]);

  const cnt = (s: string) => rows.filter((r) => r.a.status === s).length;
  const csv = `/api/export/absensi?${new URLSearchParams({ bulan, pengajar: String(pid || ""), santri: String(sid || ""), status: st, klaim: k }).toString()}`;

  return (
    <div>
      <PageHeader
        title="Absensi Mengaji"
        subtitle={`Rekap absensi ${periodeLabel(bulan)} dari seluruh pengajar`}
        actions={
          <a href={csv} className={btn.outline}>
            <Download className="h-4 w-4" /> Export CSV (Excel)
          </a>
        }
      />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Catatan</p>
          <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
        </div>
        {(["hadir", "izin", "sakit", "alpa"] as const).map((s) => (
          <div key={s} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{STATUS_ABSENSI[s].label}</p>
            <p className="text-2xl font-bold text-slate-900">{cnt(s)}</p>
          </div>
        ))}
      </div>

      <Card bodyClassName="p-0">
        <form method="get" className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3 lg:grid-cols-6">
          <input type="month" name="bulan" defaultValue={bulan} className={inputCls} />
          <select name="pengajar" defaultValue={pid || ""} className={inputCls}>
            <option value="">Semua pengajar</option>
            {pengajarList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <select name="santri" defaultValue={sid || ""} className={inputCls}>
            <option value="">Semua santri</option>
            {santriList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={st} className={inputCls}>
            <option value="">Semua kehadiran</option>
            {Object.entries(STATUS_ABSENSI).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
          <select name="klaim" defaultValue={k} className={inputCls}>
            <option value="">Semua status klaim</option>
            {Object.entries(KLAIM_STATUS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button type="submit" className={btn.primary}>
              <Search className="h-4 w-4" /> Filter
            </button>
            <Link href={P} className="text-sm text-slate-500 hover:text-brand-700">
              Reset
            </Link>
          </div>
        </form>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada absensi" desc="Absensi diisi oleh pengajar melalui dashboard pengajar." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Santri</th>
                  <th className={thCls}>Pengajar</th>
                  <th className={thCls}>Kehadiran</th>
                  <th className={thCls}>Materi & Capaian</th>
                  <th className={thCls}>Catatan</th>
                  <th className={thCls}>Klaim</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map(({ a, santriNama, santriKode, pengajarNama }) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className={`${tdCls} whitespace-nowrap`}>
                      <p className="font-medium text-slate-800">
                        {namaHari(a.tanggal)}, {formatTanggal(a.tanggal, "short")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.jamMulai ?? "--:--"} WIB {!isHariBelajar(a.tanggal) && <span className="text-gold-600">· pengganti</span>}
                      </p>
                    </td>
                    <td className={tdCls}>
                      <Link href={`/admin/santri/${a.santriId}`} className="font-semibold text-slate-800 hover:text-brand-700">
                        {santriNama}
                      </Link>
                      <p className="font-mono text-[11px] text-slate-400">{santriKode}</p>
                    </td>
                    <td className={`${tdCls} text-xs`}>{pengajarNama}</td>
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
                    </td>
                    <td className={tdCls}>
                      {a.klaimStatus !== "dibayar" && (
                        <form action={hapusAbsensiAdmin}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="back" value={back} />
                          <SubmitButton className={btnSm.danger} confirmText={`Hapus absensi ${santriNama} tanggal ${formatTanggal(a.tanggal)}?`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </SubmitButton>
                        </form>
                      )}
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
