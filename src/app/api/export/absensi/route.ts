import type { NextRequest } from "next/server";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { absensi, pengajar, santri } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { KLAIM_STATUS, STATUS_ABSENSI } from "@/lib/constants";
import { currentPeriode, intOr, isValidPeriode, namaHari, periodeRange } from "@/lib/format";

export const dynamic = "force-dynamic";

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const b = sp.get("bulan");
  const bulan = isValidPeriode(b) ? b : currentPeriode();
  const { start, end } = periodeRange(bulan);
  const conds: SQL[] = [gte(absensi.tanggal, start), lte(absensi.tanggal, end)];
  const pid = intOr(sp.get("pengajar"), 0);
  const sid = intOr(sp.get("santri"), 0);
  const st = sp.get("status") ?? "";
  const k = sp.get("klaim") ?? "";
  if (pid) conds.push(eq(absensi.pengajarId, pid));
  if (sid) conds.push(eq(absensi.santriId, sid));
  if (st) conds.push(eq(absensi.status, st));
  if (k) conds.push(eq(absensi.klaimStatus, k));

  const rows = await db
    .select({ a: absensi, kode: santri.kode, nama: santri.nama, guru: pengajar.nama })
    .from(absensi)
    .innerJoin(santri, eq(absensi.santriId, santri.id))
    .innerJoin(pengajar, eq(absensi.pengajarId, pengajar.id))
    .where(and(...conds))
    .orderBy(desc(absensi.tanggal), santri.nama);

  const header = ["Tanggal", "Hari", "Jam", "Kode Santri", "Nama Santri", "Pengajar", "Kehadiran", "Materi", "Capaian", "Nilai", "Catatan", "Status Klaim", "Nominal Bisyarah"];
  const lines = [
    header.join(","),
    ...rows.map(({ a, kode, nama, guru }) =>
      [
        a.tanggal,
        namaHari(a.tanggal),
        a.jamMulai,
        kode,
        nama,
        guru,
        STATUS_ABSENSI[a.status]?.label ?? a.status,
        a.materi,
        a.capaian,
        a.nilai,
        a.catatan,
        KLAIM_STATUS[a.klaimStatus]?.label ?? a.klaimStatus,
        a.nominal,
      ]
        .map(esc)
        .join(","),
    ),
  ];

  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="absensi-lentera-syahdu-${bulan}.csv"`,
    },
  });
}
