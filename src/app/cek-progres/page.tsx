import Link from "next/link";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { BookOpenCheck, CalendarDays, Clock, Search, UserRound } from "lucide-react";
import { db } from "@/db";
import { absensi, pembayaran, pengajar, santri } from "@/db/schema";
import { PrintButton } from "@/components/client";
import { LandingNavbar } from "@/components/landing/Navbar";
import { Badge, inputCls } from "@/components/ui";
import { STATUS_ABSENSI, STATUS_BAYAR, STATUS_SANTRI } from "@/lib/constants";
import {
  currentPeriode,
  first,
  formatTanggal,
  hitungUsia,
  isValidPeriode,
  namaHari,
  normalizeWa,
  periodeLabel,
  periodeRange,
} from "@/lib/format";
import { getNumbers } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cek Progres Santri" };

export default async function CekProgresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kode = (first(sp.kode) ?? "").trim().toUpperCase();
  const waInput = (first(sp.wa) ?? "").replace(/\D/g, "");
  const bulanParam = first(sp.bulan);
  const bulan = isValidPeriode(bulanParam) ? bulanParam : currentPeriode();
  const { pertemuan } = await getNumbers();

  let error = "";
  let data: null | {
    s: typeof santri.$inferSelect;
    pengajarNama: string | null;
    rows: (typeof absensi.$inferSelect)[];
    spp: (typeof pembayaran.$inferSelect)[];
  } = null;

  if (kode || waInput) {
    if (!kode || waInput.length < 4) {
      error = "Masukkan kode santri dan minimal 4 digit terakhir nomor WhatsApp wali.";
    } else {
      const [row] = await db
        .select({ s: santri, pengajarNama: pengajar.nama })
        .from(santri)
        .leftJoin(pengajar, eq(santri.pengajarId, pengajar.id))
        .where(eq(santri.kode, kode))
        .limit(1);
      if (!row || !normalizeWa(row.s.noWa).endsWith(waInput.slice(-Math.min(waInput.length, 8)))) {
        error = "Data tidak ditemukan. Periksa kembali kode santri dan nomor WhatsApp.";
      } else {
        const { start, end } = periodeRange(bulan);
        const rows = await db
          .select()
          .from(absensi)
          .where(and(eq(absensi.santriId, row.s.id), gte(absensi.tanggal, start), lte(absensi.tanggal, end)))
          .orderBy(desc(absensi.tanggal));
        const spp = await db
          .select()
          .from(pembayaran)
          .where(eq(pembayaran.santriId, row.s.id))
          .orderBy(desc(pembayaran.periode))
          .limit(6);
        data = { s: row.s, pengajarNama: row.pengajarNama, rows, spp };
      }
    }
  }

  const count = (st: string) => data?.rows.filter((r) => r.status === st).length ?? 0;
  const hadir = count("hadir");
  const persen = Math.min(100, Math.round((hadir / Math.max(pertemuan, 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print">
        <LandingNavbar />
      </div>
      <div className="bg-hero no-print border-b border-brand-100">
        <div className="mx-auto max-w-4xl px-5 py-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Untuk Wali Santri</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Cek <span className="text-brand-700">Progres Santri</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Pantau kehadiran, materi, nilai, dan catatan pengajar di setiap pertemuan.
          </p>
          <form method="get" className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-2xl border border-white bg-white p-4 shadow-lg sm:grid-cols-[1fr_1fr_auto]">
            <input name="kode" defaultValue={kode} required placeholder="Kode Santri (cth: LS-0001)" className={inputCls} />
            <input name="wa" defaultValue={waInput} required inputMode="numeric" placeholder="4 digit terakhir No. WA wali" className={inputCls} />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              <Search className="h-4 w-4" /> Cek
            </button>
          </form>
          {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
        </div>
      </div>

      {data && (
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <UserRound className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Rapor Tahsin · {periodeLabel(bulan)}</p>
                  <h2 className="text-xl font-bold text-slate-900">{data.s.nama}</h2>
                  <p className="text-sm text-slate-500">
                    {data.s.kode} · {hitungUsia(data.s.tanggalLahir) ?? "-"} tahun · {data.s.kota ?? "-"}
                  </p>
                </div>
              </div>
              <div className="no-print flex flex-wrap items-center gap-2">
                <form method="get" className="flex items-center gap-2">
                  <input type="hidden" name="kode" value={kode} />
                  <input type="hidden" name="wa" value={waInput} />
                  <input type="month" name="bulan" defaultValue={bulan} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <button className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Lihat</button>
                </form>
                <PrintButton className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <BookOpenCheck className="h-4 w-4 text-brand-600" /> Pengajar: <b className="text-slate-800">{data.pengajarNama ?? "-"}</b>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <Clock className="h-4 w-4 text-brand-600" /> Jam: <b className="text-slate-800">{data.s.jamBelajar ?? "-"} WIB</b>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-brand-600" /> Status: <Badge tone={STATUS_SANTRI[data.s.status]} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(["hadir", "izin", "sakit", "alpa"] as const).map((st) => (
                <div key={st} className="rounded-2xl border border-slate-200 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{count(st)}</p>
                  <p className="text-xs font-medium text-slate-500">{STATUS_ABSENSI[st].label}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-center text-white sm:col-span-1">
                <p className="text-2xl font-bold">{persen}%</p>
                <p className="text-xs text-brand-100">
                  {hadir}/{pertemuan} pertemuan
                </p>
              </div>
            </div>

            <h3 className="mt-8 font-semibold text-slate-900">Riwayat Pertemuan</h3>
            {data.rows.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada catatan pertemuan pada bulan ini.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {data.rows.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {namaHari(r.tanggal)}, {formatTanggal(r.tanggal)} {r.jamMulai && <span className="font-normal text-slate-500">· {r.jamMulai} WIB</span>}
                      </p>
                      <div className="flex gap-2">
                        {r.nilai && <Badge className="bg-gold-50 text-gold-700 ring-gold-200">{r.nilai}</Badge>}
                        <Badge tone={STATUS_ABSENSI[r.status]} />
                      </div>
                    </div>
                    {(r.materi || r.capaian) && (
                      <p className="mt-2 text-sm text-slate-600">
                        <b className="text-slate-700">Materi:</b> {r.materi ?? "-"} {r.capaian && <>· <b className="text-slate-700">Capaian:</b> {r.capaian}</>}
                      </p>
                    )}
                    {r.catatan && <p className="mt-2 rounded-xl bg-brand-50/60 px-3 py-2 text-sm italic text-slate-600">&ldquo;{r.catatan}&rdquo;</p>}
                  </div>
                ))}
              </div>
            )}

            {data.spp.length > 0 && (
              <>
                <h3 className="mt-8 font-semibold text-slate-900">Status Pembayaran SPP</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {data.spp.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
                      <span className="font-medium text-slate-700">{periodeLabel(p.periode)}</span>
                      <Badge tone={STATUS_BAYAR[p.status]} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="no-print mt-6 text-center text-sm text-slate-500">
            Ada pertanyaan? <Link href="/" className="font-semibold text-brand-700">Hubungi admin</Link>
          </p>
        </div>
      )}
    </div>
  );
}
