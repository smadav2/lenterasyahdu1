import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { LogoBadge } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md text-center">
        <LogoBadge className="mx-auto h-20 w-20" markClassName="h-12 w-12" />
        <h1 className="text-gradient-brand mt-6 text-8xl font-extrabold">404</h1>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 text-slate-500">Maaf, halaman yang Anda cari tidak dapat ditemukan atau Anda tidak memiliki akses.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-400">
            <ArrowLeft className="h-4 w-4" /> Login
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            <Home className="h-4 w-4" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
