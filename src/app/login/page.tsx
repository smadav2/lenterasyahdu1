import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ClipboardCheck, ShieldCheck, Wallet } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage() {
  await ensureSeed();
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/pengajar");

  const [admin] = await db
    .select({ hash: users.passwordHash })
    .from(users)
    .where(and(eq(users.username, "admin"), eq(users.role, "admin")))
    .limit(1);
  const defaultAdmin = admin ? verifyPassword("admin123", admin.hash) : false;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/login.jpg" alt="Lentera dan Al-Qur'an" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-brand-900/75 to-brand-800/60" />
        <div className="pattern-islamic absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/">
            <Logo dark />
          </Link>
          <div>
            <p dir="rtl" lang="ar" className="font-arabic text-4xl leading-loose text-gold-300">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="mt-2 text-brand-100">
              &ldquo;Sebaik-baik kalian adalah yang belajar Al-Qur&apos;an dan mengajarkannya.&rdquo; (HR. Bukhari)
            </p>
            <div className="mt-10 grid gap-4">
              {[
                { icon: ShieldCheck, t: "Dashboard Admin", d: "Kelola santri, pengajar, pendaftaran, SPP & laporan." },
                { icon: ClipboardCheck, t: "Dashboard Pengajar", d: "Input absensi mengaji & catatan perkembangan santri." },
                { icon: Wallet, t: "Klaim Bisyarah", d: "Catatan pertemuan otomatis menjadi klaim bisyarah." },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-brand-950">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{f.t}</p>
                    <p className="text-sm text-brand-100">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-brand-200">© {new Date().getFullYear()} Lentera Syahdu</p>
        </div>
      </div>

      <div className="bg-hero flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>
          <div className="rounded-3xl border border-white bg-white/90 p-8 shadow-[0_30px_80px_-30px_rgba(74,29,93,0.4)] backdrop-blur sm:p-10">
            <div className="mb-8 text-center">
              <div className="mb-5 flex justify-center lg:hidden">
                <Logo />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Selamat Datang di Lentera Syahdu</h1>
              <p className="mt-2 text-sm text-slate-500">Silakan login untuk mengakses dashboard Admin atau Pengajar</p>
            </div>
            <LoginForm />
            {defaultAdmin && (
              <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 text-xs leading-relaxed text-gold-700">
                <p className="font-semibold">Akun bawaan (segera ganti password di menu Pengaturan):</p>
                <p className="mt-1">
                  Admin: <b>admin</b> / <b>admin123</b> · Pengajar contoh: <b>aisyah</b> / <b>pengajar123</b>
                </p>
              </div>
            )}
            <p className="mt-6 text-center text-sm text-slate-500">
              Ingin menjadi santri?{" "}
              <Link href="/daftar" className="font-semibold text-brand-700 underline underline-offset-2">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
