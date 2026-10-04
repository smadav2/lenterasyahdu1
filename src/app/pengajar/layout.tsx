import type { ReactNode } from "react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { requirePengajar } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PengajarLayout({ children }: { children: ReactNode }) {
  const me = await requirePengajar();
  const nav: NavItem[] = [
    { href: "/pengajar", label: "Dashboard", icon: "dashboard" },
    { href: "/pengajar/absensi", label: "Input Absensi", icon: "absensi" },
    { href: "/pengajar/santri", label: "Santri Saya", icon: "santri" },
    { href: "/pengajar/bisyarah", label: "Bisyarah Saya", icon: "bisyarah" },
    { href: "/pengajar/profil", label: "Profil & Akun", icon: "profil" },
  ];
  return (
    <DashboardShell nav={nav} userName={me.nama} roleLabel="Pengajar">
      {children}
    </DashboardShell>
  );
}
