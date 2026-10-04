import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { CheckCircle2, Eye, Trash2, XCircle } from "lucide-react";
import { db } from "@/db";
import { pendaftaran, pengajar } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, Card, EmptyState, Flash, PageHeader, btnSm, inputSm } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { JAM_OPTIONS, STATUS_PENDAFTARAN } from "@/lib/constants";
import { cx, first, formatDateTime, formatTanggal, hitungUsia, rupiah, todayJakarta, waLink } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { buildUrl, type SP } from "@/lib/url";
import { hapusPendaftaran, terimaPendaftaran, tolakPendaftaran } from "../actions";

export const dynamic = "force-dynamic";

const TABS = [
  { k: "menunggu", l: "Menunggu" },
  { k: "diterima", l: "Diterima" },
  { k: "ditolak", l: "Ditolak" },
  { k: "semua", l: "Semua" },
];

export default async function PendaftaranPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/pendaftaran";
  const tab = TABS.some((t) => t.k === first(sp.status)) ? (first(sp.status) as string) : "menunggu";
  const back = buildUrl(P, sp);
  const { s: set, biaya } = await getNumbers();

  const [rows, pengajarList, counts] = await Promise.all([
    db
      .select()
      .from(pendaftaran)
      .where(tab === "semua" ? undefined : eq(pendaftaran.status, tab))
      .orderBy(desc(pendaftaran.createdAt)),
    db.select({ id: pengajar.id, nama: pengajar.nama }).from(pengajar).where(eq(pengajar.status, "aktif")).orderBy(pengajar.nama),
    db.select({ status: pendaftaran.status, n: count() }).from(pendaftaran).groupBy(pendaftaran.status),
  ]);
  const cMap = new Map(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);

  return (
    <div>
      <PageHeader title="Pendaftaran Santri Baru" subtitle="Data pendaftar dari formulir website. Terima untuk menjadikan santri aktif." />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.k}
            href={`${P}?status=${t.k}`}
            className={cx(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.k ? "bg-brand-700 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-700",
            )}
          >
            {t.l} <span className="ml-1 opacity-70">({t.k === "semua" ? total : cMap.get(t.k) ?? 0})</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="Tidak ada data pendaftaran" desc="Pendaftar dari halaman /daftar akan muncul di sini." />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {rows.map((r) => {
            const usia = hitungUsia(r.tanggalLahir);
            const pesan = `Assalamu'alaikum ${r.namaWali}, terima kasih telah mendaftarkan ${r.nama} di ${set.namaProgram} ${set.namaLembaga} (No. REG-${String(r.id).padStart(4, "0")}). Kami ingin mengonfirmasi jadwal belajar pukul ${r.jamPreferensi ?? "-"} WIB (${set.hariBelajar}) dan menjadwalkan tes bacaan awal. Total biaya ${r.lamaBulan} bulan: ${rupiah(biaya * r.lamaBulan)}.`;
            return (
              <Card key={r.id} className="flex flex-col" bodyClassName="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gold-600">REG-{String(r.id).padStart(4, "0")} · {formatDateTime(r.createdAt)}</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{r.nama}</h3>
                    <p className="text-sm text-slate-500">
                      {r.namaPanggilan ?? "-"} · {r.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}
                      {usia !== null && ` · ${usia} tahun`} · {r.kota ?? "-"}
                    </p>
                  </div>
                  <Badge tone={STATUS_PENDAFTARAN[r.status]} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Wali</dt>
                    <dd className="font-medium text-slate-800">{r.namaWali}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">WhatsApp</dt>
                    <dd className="font-medium text-slate-800">{r.noWa}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Tanggal Lahir</dt>
                    <dd className="font-medium text-slate-800">{formatTanggal(r.tanggalLahir)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Pengalaman Mengaji</dt>
                    <dd className="font-medium text-slate-800">{r.pernahBelajar ? r.levelSebelumnya ?? "Sudah pernah" : "Belum pernah"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Jam & Periode</dt>
                    <dd className="font-medium text-slate-800">
                      {r.jamPreferensi ?? "-"} WIB · {r.lamaBulan} bulan
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Total Biaya</dt>
                    <dd className="font-bold text-brand-700">{rupiah(biaya * r.lamaBulan)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Tujuan</dt>
                    <dd className="text-slate-700">{r.tujuan ?? "-"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Sumber Informasi {r.email && "· Email"}</dt>
                    <dd className="text-slate-700">
                      {r.sumberInfo ?? "-"} {r.email && `· ${r.email}`}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto pt-4">
                  {r.status === "menunggu" && (
                    <form action={terimaPendaftaran} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <p className="mb-2 text-xs font-semibold text-emerald-800">Terima & jadikan santri aktif:</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <select name="pengajarId" defaultValue="" className={inputSm}>
                          <option value="">— Pengajar —</option>
                          {pengajarList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                        <select name="jamBelajar" defaultValue={r.jamPreferensi ?? ""} className={inputSm}>
                          {JAM_OPTIONS.map((j) => (
                            <option key={j} value={j}>
                              {j} WIB
                            </option>
                          ))}
                        </select>
                        <input type="date" name="tanggalMulai" defaultValue={todayJakarta()} className={inputSm} />
                      </div>
                      <SubmitButton className={`${btnSm.success} mt-2 w-full`} pendingText="Memproses...">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Terima Pendaftaran
                      </SubmitButton>
                    </form>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a href={waLink(r.noWa, pesan)} target="_blank" rel="noopener noreferrer" className={btnSm.wa}>
                      <WhatsAppIcon className="h-3.5 w-3.5" /> Hubungi Wali
                    </a>
                    {r.status === "diterima" && r.santriId && (
                      <Link href={`/admin/santri/${r.santriId}`} className={btnSm.outline}>
                        <Eye className="h-3.5 w-3.5" /> Lihat Santri
                      </Link>
                    )}
                    {r.status === "menunggu" && (
                      <form action={tolakPendaftaran}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton className={btnSm.outline} confirmText={`Tandai pendaftaran ${r.nama} sebagai ditolak?`}>
                          <XCircle className="h-3.5 w-3.5" /> Tolak
                        </SubmitButton>
                      </form>
                    )}
                    <form action={hapusPendaftaran} className="ml-auto">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="back" value={back} />
                      <SubmitButton className={btnSm.danger} confirmText={`Hapus data pendaftaran ${r.nama}?`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
