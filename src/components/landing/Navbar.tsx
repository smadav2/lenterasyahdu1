"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cx } from "@/lib/format";

const LINKS = [
  { href: "/#beranda", label: "Beranda" },
  { href: "/#tentang", label: "Tentang" },
  { href: "/#program", label: "Program" },
  { href: "/#jadwal", label: "Jadwal" },
  { href: "/#testimoni", label: "Testimoni" },
  { href: "/#faq", label: "FAQ" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-50 border-b border-brand-900/5 bg-white/95 backdrop-blur-xl transition-shadow",
        scrolled && "shadow-[0_8px_30px_rgba(74,29,93,0.08)]",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="Lentera Syahdu - Beranda" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/cek-progres"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <Search className="h-4 w-4" /> Cek Progres
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-500"
          >
            <LogIn className="h-4 w-4" /> Masuk
          </Link>
          <Link
            href="/daftar"
            className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:-translate-y-0.5 hover:bg-brand-800"
          >
            Daftar Sekarang
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl text-brand-800 hover:bg-brand-50 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-5 pb-6 pt-3 shadow-xl lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-brand-50"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            <Link href="/cek-progres" onClick={() => setOpen(false)} className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700">
              Cek Progres Santri
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border-2 border-brand-200 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
                Masuk
              </Link>
              <Link href="/daftar" onClick={() => setOpen(false)} className="rounded-xl bg-brand-700 px-4 py-3 text-center text-sm font-semibold text-white">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
