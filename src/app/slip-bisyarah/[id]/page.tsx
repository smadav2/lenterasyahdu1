import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { absensi, bisyarahPayout, pengajar, santri } from "@/db/schema";
import { PrintButton } from "@/components/client";
import { LogoBadge } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { formatTanggal, intOr, namaHari, periodeLabel, rupiah } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Slip Bisyarah" };

function terbilang(x: number): string {
  const s = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const n = Math.floor(Math.abs(x));
  if (n < 12) return s[n];
  if (n < 20) return `${terbilang(n - 10)} belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} puluh ${terbilang(n % 10)}`.trim();
  if (n < 200) return `seratus ${terbilang(n - 100)}`.trim();
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} ratus ${terbilang(n % 100)}`.trim();
  if (n < 2000) return `seribu ${terbilang(n - 1000)}`.trim();
  if (n < 1_000_000) return `${terbilang(Math.floor(n / 1000))} ribu ${terbilang(n % 1000)}`.trim();
  if (n < 1_000_000_000) return `${terbilang(Math.floor(n / 1_000_000))} juta ${terbilang(n % 1_000_000)}`.trim();
  return `${terbilang(Math.floor(n / 1_000_000_000))} miliar ${terbilang(n % 1_000_000_000)}`.trim();
}

export default async function SlipBisyarahPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const pid = intOr(id, 0);

  const [row] = await db
    .select({ po: bisyarahPayout, p: pengajar })
    .from(bisyarahPayout)
    .innerJoin(pengajar, eq(bisyarahPayout.pengajarId, pengajar.id))
    .where(eq(bisyarahPayout.id, pid))
    .limit(1);
  if (!row) notFound();
  if (user.role !== "admin" && user.pengajarId !== row.po.pengajarId) notFound();

  const [items, set] = await Promise.all([
    db
      .select({ a: absensi, nama: santri.nama })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .where(eq(absensi.payoutId, pid))
      .orderBy(asc(absensi.tanggal)),
    getSettings(),
  ]);
  const { po, p } = row;
  const noSlip = `BSY-${po.periode.replace("-", "")}-${String(po.id).padStart(4, "0")}`;
  const kata = terbilang(po.total);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end px-4">
        <PrintButton className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white" label="Cetak / Simpan PDF" />
      </div>
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-xl print:max-w-none print:p-0 print:shadow-none sm:p-10">
        <div className="flex items-center justify-between gap-4 border-b-4 border-double border-brand-800 pb-5">
          <div className="flex items-center gap-4">
            <LogoBadge className="h-16 w-16" markClassName="h-10 w-10" />
            <div>
              <p className="text-xl font-extrabold tracking-wide text-brand-900">{set.namaLembaga.toUpperCase()}</p>
              <p className="text-xs text-slate-500">{set.namaProgram}</p>
              <p className="text-xs text-slate-500">
                {set.alamat} · {set.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-800">Slip Bisyarah</p>
            <p className="font-mono text-xs text-slate-500">{noSlip}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Diberikan kepada</p>
            <p className="font-semibold text-slate-900">{p.nama}</p>
            <p className="text-slate-600">
              {p.bank ? `${p.bank} ${p.noRekening ?? ""} a.n. ${p.atasNama ?? "-"}` : "-"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-slate-500">Periode / Tanggal Bayar</p>
            <p className="font-semibold text-slate-900">{periodeLabel(po.periode)}</p>
            <p className="text-slate-600">{formatTanggal(po.tanggalBayar, "long")}</p>
          </div>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand-50 text-left text-xs uppercase tracking-wider text-brand-800">
              <th className="border border-slate-200 px-3 py-2">No</th>
              <th className="border border-slate-200 px-3 py-2">Tanggal</th>
              <th className="border border-slate-200 px-3 py-2">Santri</th>
              <th className="border border-slate-200 px-3 py-2">Materi</th>
              <th className="border border-slate-200 px-3 py-2 text-right">Bisyarah</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ a, nama }, i) => (
              <tr key={a.id}>
                <td className="border border-slate-200 px-3 py-1.5 text-center">{i + 1}</td>
                <td className="border border-slate-200 px-3 py-1.5">
                  {namaHari(a.tanggal)}, {formatTanggal(a.tanggal)}
                </td>
                <td className="border border-slate-200 px-3 py-1.5">{nama}</td>
                <td className="border border-slate-200 px-3 py-1.5">{a.materi ?? "-"}</td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">{rupiah(a.nominal)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-slate-200 px-3 py-4 text-center text-slate-500">
                  Rincian pertemuan tidak tersedia.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={4} className="border border-slate-200 px-3 py-2 text-right">
                Total ({po.jumlahPertemuan} pertemuan)
              </td>
              <td className="border border-slate-200 bg-gold-50 px-3 py-2 text-right text-brand-900">{rupiah(po.total)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
          Terbilang: <span className="capitalize">{kata || "nol"}</span> rupiah
        </p>
        {po.keterangan && <p className="mt-2 text-sm text-slate-600">Keterangan: {po.keterangan}</p>}

        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
          <div>
            <p className="text-slate-500">Penerima,</p>
            <div className="h-20" />
            <p className="font-semibold text-slate-800 underline underline-offset-4">{p.nama}</p>
          </div>
          <div>
            <p className="text-slate-500">Bendahara {set.namaLembaga},</p>
            <div className="h-20" />
            <p className="font-semibold text-slate-800">(______________________)</p>
          </div>
        </div>
        <p className="mt-10 text-center text-[11px] text-slate-400">
          Jazakumullah khairan katsiran atas dedikasi dalam mengajarkan Al-Qur&apos;an. Dokumen ini dibuat otomatis oleh sistem {set.namaLembaga}.
        </p>
      </div>
    </div>
  );
}
