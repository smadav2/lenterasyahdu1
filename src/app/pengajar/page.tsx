import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { Banknote, CalendarDays, CheckCircle2, ClipboardCheck, Clock, Hourglass, Lightbulb, Megaphone, PencilLine } from "lucide-react";
import { db } from "@/db";
import { absensi, pengumuman, santri } from "@/db/schema";
import { Badge, Card, EmptyState, StatCard, btnSm } from "@/components/ui";
import { requirePengajar } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI } from "@/lib/constants";
import { currentPeriode, formatDateTime, formatTanggal, isHariBelajar, periodeLabel, periodeRange, rupiah, todayJakarta } from "@/lib/format";
import { getNumbers } from "@/lib/settings";

export const dynamic = "force-dynamic";

const cntK = (st: string) => sql<number>`count(*) filter (where ${absensi.klaimStatus} = ${st})`.mapWith(Number);
const sumK = (st: string) => sql<number>`coalesce(sum(${absensi.nominal}) filter (where ${absensi.klaimStatus} = ${st}), 0)`.mapWith(Number);

export default async function PengajarDashboard() {
  const me = await requirePengajar();
  const today = todayJakarta();
  const per = currentPeriode();
  const { start, end } = periodeRange(per);
  const { tarif, minCatatan, s: set } = await getNumbers();
  const hariBelajar = isHariBelajar(today);

  const [[stat], mySantri, todayAbsen, info] = await Promise.all([
    db
      .select({
        hadir: sql<number>`count(*) filter (where ${absensi.status} = 'hadir')`.mapWith(Number),
        dN: cntK("diajukan"),
        dRp: sumK("diajukan"),
        sN: cntK("disetujui"),
        sRp: sumK("disetujui"),
        bN: cntK("dibayar"),
        bRp: sumK("dibayar"),
      })
      .from(absensi)
      .where(and(eq(absensi.pengajarId, me.pengajarId), gte(absensi.tanggal, start), lte(absensi.tanggal, end))),
    db
      .select({ id: santri.id, nama: santri.nama, jam: santri.jamBelajar, level: santri.levelAwal })
      .from(santri)
      .where(and(eq(santri.pengajarId, me.pengajarId), eq(santri.status, "aktif")))
      .orderBy(santri.jamBelajar),
    db
      .select({ santriId: absensi.santriId, status: absensi.status, klaimStatus: absensi.klaimStatus, id: absensi.id })
      .from(absensi)
      .where(and(eq(absensi.pengajarId, me.pengajarId), eq(absensi.tanggal, today))),
    db.select().from(pengumuman).orderBy(desc(pengumuman.penting), desc(pengumuman.createdAt)).limit(5),
  ]);
  const doneMap = new Map(todayAbsen.map((a) => [a.santriId, a]));
  const sudah = mySantri.filter((s) => doneMap.has(s.id)).length;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-6 text-white shadow-lg sm:p-8">
        <div className="pattern-islamic absolute inset-0" />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-400/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-brand-200">Assalamu&apos;alaikum,</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{me.nama}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-brand-100">
              <CalendarDays className="h-4 w-4 text-gold-300" /> {formatTanggal(today, "long")} ·{" "}
              {hariBelajar ? `Hari mengajar · ${sudah}/${mySantri.length} santri sudah diabsen` : "Hari libur (jadwal Senin – Kamis)"}
            </p>
          </div>
          <Link href="/pengajar/absensi" className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-brand-950 shadow-lg hover:bg-gold-300">
            <PencilLine className="h-4 w-4" /> Isi Absensi
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Pertemuan ${periodeLabel(per)}`} value={stat?.hadir ?? 0} sub="Sesi santri hadir" icon={<ClipboardCheck className="h-5 w-5" />} tone="brand" />
        <StatCard label="Klaim Menunggu" value={stat?.dN ?? 0} sub={rupiah(stat?.dRp ?? 0)} icon={<Hourglass className="h-5 w-5" />} tone="gold" />
        <StatCard label="Klaim Disetujui" value={stat?.sN ?? 0} sub={rupiah(stat?.sRp ?? 0)} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
        <StatCard label="Sudah Dibayar" value={rupiah(stat?.bRp ?? 0)} sub={`${stat?.bN ?? 0} pertemuan`} icon={<Banknote className="h-5 w-5" />} tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" /> Jadwal Mengajar Hari Ini
            </span>
          }
          subtitle={`${set.hariBelajar} · ${mySantri.length} santri aktif`}
        >
          {!hariBelajar ? (
            <EmptyState title="Hari ini libur" desc="Anda tetap bisa mengisi absensi pertemuan pengganti bila ada." />
          ) : mySantri.length === 0 ? (
            <EmptyState title="Belum ada santri" desc="Admin belum menetapkan santri untuk Anda." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {mySantri.map((s) => {
                const done = doneMap.get(s.id);
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-14 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{s.jam ?? "--:--"}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{s.nama}</p>
                        <p className="text-xs text-slate-500">{s.level ?? "-"}</p>
                      </div>
                    </div>
                    {done ? (
                      <div className="flex items-center gap-1.5">
                        <Badge tone={STATUS_ABSENSI[done.status]} />
                        <Badge tone={KLAIM_STATUS[done.klaimStatus]} />
                      </div>
                    ) : (
                      <Link href={`/pengajar/absensi?santri=${s.id}&tanggal=${today}`} className={btnSm.primary}>
                        <PencilLine className="h-3.5 w-3.5" /> Isi Absensi
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-gold-600" /> Cara Klaim Bisyarah</span>}>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>1. Selesai mengajar, buka menu <b>Input Absensi</b>.</li>
              <li>2. Pilih santri, status <b>Hadir</b>, isi materi & capaian.</li>
              <li>
                3. Tulis <b>catatan pertemuan</b> minimal {minCatatan} karakter & centang klaim.
              </li>
              <li>
                4. Klaim {rupiah(tarif)}/pertemuan diajukan otomatis → disetujui admin → dibayarkan.
              </li>
            </ol>
          </Card>

          <Card title={<span className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-brand-600" /> Pengumuman</span>}>
            {info.length === 0 ? (
              <EmptyState title="Belum ada pengumuman" />
            ) : (
              <ul className="space-y-4">
                {info.map((p) => (
                  <li key={p.id} className={p.penting ? "rounded-xl border border-rose-200 bg-rose-50/60 p-3" : "rounded-xl bg-slate-50 p-3"}>
                    <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{p.isi}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(p.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
