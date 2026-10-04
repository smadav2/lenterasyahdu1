import Link from "next/link";
import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { BookOpen, History, MapPin, PencilLine } from "lucide-react";
import { db } from "@/db";
import { absensi, santri } from "@/db/schema";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, Card, EmptyState, PageHeader, btnSm } from "@/components/ui";
import { requirePengajar } from "@/lib/auth";
import { STATUS_SANTRI } from "@/lib/constants";
import { addDays, currentPeriode, formatTanggal, hitungUsia, initials, periodeLabel, periodeRange, todayJakarta, waLink } from "@/lib/format";
import { getNumbers } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SantriSayaPage() {
  const me = await requirePengajar();
  const today = todayJakarta();
  const per = currentPeriode();
  const { start, end } = periodeRange(per);
  const { pertemuan, s: set } = await getNumbers();

  const list = await db
    .select()
    .from(santri)
    .where(eq(santri.pengajarId, me.pengajarId))
    .orderBy(santri.status, santri.jamBelajar);
  const ids = list.map((s) => s.id);

  const [hadirRows, recent] = ids.length
    ? await Promise.all([
        db
          .select({ id: absensi.santriId, n: count() })
          .from(absensi)
          .where(and(inArray(absensi.santriId, ids), eq(absensi.status, "hadir"), gte(absensi.tanggal, start), lte(absensi.tanggal, end)))
          .groupBy(absensi.santriId),
        db
          .select({ santriId: absensi.santriId, tanggal: absensi.tanggal, materi: absensi.materi, capaian: absensi.capaian, nilai: absensi.nilai })
          .from(absensi)
          .where(and(inArray(absensi.santriId, ids), eq(absensi.status, "hadir"), gte(absensi.tanggal, addDays(today, -60))))
          .orderBy(desc(absensi.tanggal)),
      ])
    : [[], []];
  const hadirMap = new Map(hadirRows.map((r) => [r.id, r.n]));
  const lastMap = new Map<number, (typeof recent)[number]>();
  for (const r of recent) if (!lastMap.has(r.santriId)) lastMap.set(r.santriId, r);

  return (
    <div>
      <PageHeader title="Santri Saya" subtitle={`${list.length} santri · jadwal ${set.hariBelajar} · progres bulan ${periodeLabel(per)}`} />
      {list.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada santri" desc="Admin akan menetapkan santri untuk Anda." />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((s) => {
            const hadir = hadirMap.get(s.id) ?? 0;
            const last = lastMap.get(s.id);
            const usia = hitungUsia(s.tanggalLahir);
            const persen = Math.min(100, Math.round((hadir / Math.max(pertemuan, 1)) * 100));
            return (
              <Card key={s.id} className="flex flex-col" bodyClassName="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
                      {initials(s.nama)}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.nama}</p>
                      <p className="text-xs text-slate-500">
                        {s.kode} · {usia !== null ? `${usia} th` : "-"} · {s.jenisKelamin === "P" ? "P" : "L"}
                      </p>
                    </div>
                  </div>
                  <Badge tone={STATUS_SANTRI[s.status]} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Jam Belajar</p>
                    <p className="font-semibold text-slate-800">{s.jamBelajar ?? "-"} WIB</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Level Awal</p>
                    <p className="truncate font-semibold text-slate-800">{s.levelAwal ?? "-"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600">Kehadiran bulan ini</span>
                    <span className="font-semibold text-brand-700">
                      {hadir}/{pertemuan}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-gold-400" style={{ width: `${persen}%` }} />
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-brand-600" /> Pertemuan terakhir
                  </p>
                  {last ? (
                    <p className="mt-1 text-slate-600">
                      {formatTanggal(last.tanggal)} · {last.materi ?? "-"} {last.capaian && `· ${last.capaian}`} {last.nilai && `· ${last.nilai}`}
                    </p>
                  ) : (
                    <p className="mt-1 text-slate-400">Belum ada catatan</p>
                  )}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {s.kota ?? "-"} · Wali: {s.namaWali ?? "-"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/pengajar/absensi?santri=${s.id}&tanggal=${today}`} className={btnSm.primary}>
                    <PencilLine className="h-3.5 w-3.5" /> Isi Absensi
                  </Link>
                  <Link href={`/pengajar/absensi?santri=${s.id}`} className={btnSm.outline}>
                    <History className="h-3.5 w-3.5" /> Riwayat
                  </Link>
                  {s.noWa && (
                    <a href={waLink(s.noWa, `Assalamu'alaikum ${s.namaWali ?? ""}, saya ${me.nama} pengajar ${set.namaProgram} ${set.namaLembaga} untuk ananda ${s.nama}.`)} target="_blank" rel="noopener noreferrer" className={btnSm.wa}>
                      <WhatsAppIcon className="h-3.5 w-3.5" /> Wali
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
