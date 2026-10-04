import Link from "next/link";
import { and, count, desc, eq, gte, lte, notInArray, sql, sum } from "drizzle-orm";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { absensi, pembayaran, pendaftaran, pengajar, santri } from "@/db/schema";
import { Badge, Card, EmptyState, StatCard, btnSm } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI } from "@/lib/constants";
import {
  currentPeriode,
  formatDateTime,
  formatTanggal,
  isHariBelajar,
  namaHari,
  periodeLabel,
  periodeRange,
  rupiah,
  todayJakarta,
  waLink,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const me = await requireAdmin();
  const today = todayJakarta();
  const per = currentPeriode();
  const { start, end } = periodeRange(per);
  const hariBelajar = isHariBelajar(today);

  const [[sAktif], [pAktif], [hadirBulan], [daftarBaru], [klaimPending], [spp]] = await Promise.all([
    db.select({ n: count() }).from(santri).where(eq(santri.status, "aktif")),
    db.select({ n: count() }).from(pengajar).where(eq(pengajar.status, "aktif")),
    db
      .select({ n: count() })
      .from(absensi)
      .where(and(eq(absensi.status, "hadir"), gte(absensi.tanggal, start), lte(absensi.tanggal, end))),
    db.select({ n: count() }).from(pendaftaran).where(eq(pendaftaran.status, "menunggu")),
    db
      .select({ n: count(), total: sum(absensi.nominal).mapWith(Number) })
      .from(absensi)
      .where(eq(absensi.klaimStatus, "diajukan")),
    db
      .select({
        total: count(),
        lunas: sql<number>`count(*) filter (where ${pembayaran.status} = 'lunas')`.mapWith(Number),
        nominalLunas: sql<number>`coalesce(sum(${pembayaran.nominal}) filter (where ${pembayaran.status} = 'lunas'), 0)`.mapWith(Number),
      })
      .from(pembayaran)
      .where(eq(pembayaran.periode, per)),
  ]);

  const sudahAbsen = db.select({ id: absensi.santriId }).from(absensi).where(eq(absensi.tanggal, today));
  const belumAbsen = hariBelajar
    ? await db
        .select({ id: santri.id, nama: santri.nama, jam: santri.jamBelajar, pengajar: pengajar.nama, wa: pengajar.noWa })
        .from(santri)
        .leftJoin(pengajar, eq(santri.pengajarId, pengajar.id))
        .where(and(eq(santri.status, "aktif"), notInArray(santri.id, sudahAbsen)))
        .orderBy(santri.jamBelajar)
    : [];

  const [recent, klaimPer, daftarList] = await Promise.all([
    db
      .select({
        id: absensi.id,
        tanggal: absensi.tanggal,
        status: absensi.status,
        materi: absensi.materi,
        klaimStatus: absensi.klaimStatus,
        createdAt: absensi.createdAt,
        santri: santri.nama,
        pengajar: pengajar.nama,
      })
      .from(absensi)
      .innerJoin(santri, eq(absensi.santriId, santri.id))
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .orderBy(desc(absensi.createdAt))
      .limit(8),
    db
      .select({ pid: pengajar.id, nama: pengajar.nama, n: count(), total: sum(absensi.nominal).mapWith(Number) })
      .from(absensi)
      .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
      .where(eq(absensi.klaimStatus, "diajukan"))
      .groupBy(pengajar.id, pengajar.nama),
    db.select().from(pendaftaran).where(eq(pendaftaran.status, "menunggu")).orderBy(desc(pendaftaran.createdAt)).limit(5),
  ]);

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
              {hariBelajar ? "Hari belajar (Senin – Kamis)" : "Hari libur belajar"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/santri?tambah=1" className="rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-brand-950 hover:bg-gold-300">
              + Tambah Santri
            </Link>
            <Link href="/admin/pengajar?tambah=1" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              + Tambah Pengajar
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Santri Aktif" value={sAktif?.n ?? 0} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Pengajar Aktif" value={pAktif?.n ?? 0} icon={<UserCheck className="h-5 w-5" />} tone="green" />
        <StatCard label={`Pertemuan ${periodeLabel(per)}`} value={hadirBulan?.n ?? 0} sub="Sesi dengan status hadir" icon={<ClipboardCheck className="h-5 w-5" />} tone="sky" />
        <StatCard label="Pendaftar Baru" value={daftarBaru?.n ?? 0} sub="Menunggu konfirmasi" icon={<UserPlus className="h-5 w-5" />} tone="gold" />
        <StatCard
          label="Klaim Bisyarah Menunggu"
          value={klaimPending?.n ?? 0}
          sub={rupiah(klaimPending?.total ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          tone="rose"
        />
        <StatCard
          label={`SPP ${periodeLabel(per)}`}
          value={`${spp?.lunas ?? 0}/${spp?.total ?? 0} lunas`}
          sub={`Diterima ${rupiah(spp?.nominalLunas ?? 0)}`}
          icon={<CreditCard className="h-5 w-5" />}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title={
              <span className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-gold-600" /> Santri Belum Diabsen Hari Ini
              </span>
            }
            subtitle={hariBelajar ? `${namaHari(today)}, ${formatTanggal(today)}` : "Hari ini bukan jadwal belajar"}
          >
            {!hariBelajar ? (
              <EmptyState title="Hari ini libur" desc="Jadwal belajar Kelas Tahsin adalah Senin sampai Kamis." />
            ) : belumAbsen.length === 0 ? (
              <EmptyState title="Alhamdulillah, semua santri sudah diabsen" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {belumAbsen.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{b.nama}</p>
                      <p className="text-xs text-slate-500">
                        {b.jam ?? "--:--"} WIB · {b.pengajar ?? "Belum ada pengajar"}
                      </p>
                    </div>
                    {b.wa && (
                      <a
                        href={waLink(b.wa, `Assalamu'alaikum, mohon mengisi absensi mengaji untuk santri ${b.nama} hari ini. Jazakumullah khairan.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnSm.wa}
                      >
                        Ingatkan Pengajar
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Absensi Terbaru"
            action={
              <Link href="/admin/absensi" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Link>
            }
            bodyClassName="p-0"
          >
            {recent.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Belum ada absensi" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {r.santri} <span className="font-normal text-slate-400">oleh</span> {r.pengajar}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTanggal(r.tanggal)} · {r.materi ?? "-"} · diinput {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge tone={STATUS_ABSENSI[r.status]} />
                      <Badge tone={KLAIM_STATUS[r.klaimStatus]} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Klaim Bisyarah Menunggu"
            action={
              <Link href="/admin/bisyarah" className="text-sm font-semibold text-brand-700">
                Kelola
              </Link>
            }
          >
            {klaimPer.length === 0 ? (
              <EmptyState title="Tidak ada klaim menunggu" />
            ) : (
              <ul className="space-y-3">
                {klaimPer.map((k) => (
                  <li key={k.pid} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{k.nama}</p>
                      <p className="text-xs text-slate-500">{k.n} pertemuan</p>
                    </div>
                    <p className="text-sm font-bold text-brand-700">{rupiah(k.total)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Pendaftaran Baru"
            action={
              <Link href="/admin/pendaftaran" className="text-sm font-semibold text-brand-700">
                Lihat
              </Link>
            }
          >
            {daftarList.length === 0 ? (
              <EmptyState title="Belum ada pendaftar baru" />
            ) : (
              <ul className="space-y-3">
                {daftarList.map((d) => (
                  <li key={d.id} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{d.nama}</p>
                    <p className="text-xs text-slate-500">
                      {d.kota ?? "-"} · jam {d.jamPreferensi ?? "-"} · {d.lamaBulan} bln
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(d.createdAt)}</p>
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
