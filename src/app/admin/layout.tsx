import type { ReactNode } from "react";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { absensi, pendaftaran } from "@/db/schema";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const [[daftar], [klaim]] = await Promise.all([
    db.select({ n: count() }).from(pendaftaran).where(eq(pendaftaran.status, "menunggu")),
    db.select({ n: count() }).from(absensi).where(eq(absensi.klaimStatus, "diajukan")),
  ]);

  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/pendaftaran", label: "Pendaftaran", icon: "pendaftaran", badge: daftar?.n ?? 0 },
    { href: "/admin/santri", label: "Data Santri", icon: "santri" },
    { href: "/admin/pengajar", label: "Data Pengajar", icon: "pengajar" },
    { href: "/admin/absensi", label: "Absensi Mengaji", icon: "absensi" },
    { href: "/admin/bisyarah", label: "Klaim Bisyarah", icon: "bisyarah", badge: klaim?.n ?? 0 },
    { href: "/admin/pembayaran", label: "Pembayaran SPP", icon: "pembayaran" },
    { href: "/admin/laporan", label: "Laporan", icon: "laporan" },
    { href: "/admin/pengumuman", label: "Pengumuman", icon: "pengumuman" },
    { href: "/admin/pengaturan", label: "Pengaturan", icon: "pengaturan" },
  ];

  return (
    <DashboardShell nav={nav} userName={user.nama} roleLabel="Administrator">
      {children}
    </DashboardShell>
  );
}
