"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { cx, initials } from "@/lib/format";
import { Logo } from "./Logo";

const ICONS = {
  dashboard: LayoutDashboard,
  santri: Users,
  pengajar: UserCheck,
  absensi: ClipboardCheck,
  bisyarah: Wallet,
  pembayaran: CreditCard,
  laporan: FileBarChart,
  pengumuman: Megaphone,
  pengaturan: Settings,
  pendaftaran: UserPlus,
  profil: User,
  buku: BookOpen,
} as const;

export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName; badge?: number };

export function DashboardShell({
  nav,
  userName,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = nav[0]?.href ?? "/";
  const isActive = (href: string) =>
    href === root ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const current = nav.find((n) => isActive(n.href));

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 text-white">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5">
        <Link href={root} onClick={() => setOpen(false)}>
          <Logo dark compact />
        </Link>
        <button type="button" className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">{roleLabel}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white/15 text-white" : "text-brand-100/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold-400" />}
              <Icon className={cx("h-[18px] w-[18px]", active ? "text-gold-300" : "text-brand-200 group-hover:text-white")} />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-brand-950">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-sm font-bold text-brand-950">
            {initials(userName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="text-xs text-brand-200">{roleLabel}</p>
          </div>
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-brand-100 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64 print:pl-0">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="font-semibold text-slate-800">{current?.label ?? "Dashboard"}</p>
          </div>
          <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">Lihat Website</span>
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
