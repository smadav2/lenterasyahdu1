import { eq } from "drizzle-orm";
import { KeyRound, Save } from "lucide-react";
import { db } from "@/db";
import { pengajar } from "@/db/schema";
import { PasswordInput, SubmitButton } from "@/components/client";
import { Card, Field, Flash, PageHeader, btn, inputCls } from "@/components/ui";
import { requirePengajar } from "@/lib/auth";
import { first, formatTanggal, initials } from "@/lib/format";
import type { SP } from "@/lib/url";
import { gantiPasswordPengajar, updateProfil } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProfilPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requirePengajar();
  const sp = await searchParams;
  const [p] = await db.select().from(pengajar).where(eq(pengajar.id, me.pengajarId)).limit(1);

  return (
    <div>
      <PageHeader title="Profil & Akun" subtitle="Perbarui kontak dan rekening pencairan bisyarah Anda." />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 text-xl font-bold text-white">
              {initials(me.nama)}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{p?.nama ?? me.nama}</h2>
              <p className="text-sm text-slate-500">
                @{me.username} · bergabung {formatTanggal(p?.tanggalBergabung)}
              </p>
              <p className="text-xs text-slate-400">
                {p?.pendidikan ?? ""} {p?.pengalaman && `· ${p.pengalaman}`}
              </p>
            </div>
          </div>
          <form action={updateProfil} className="grid gap-4 md:grid-cols-2">
            <Field label="No. WhatsApp">
              <input name="noWa" defaultValue={p?.noWa ?? ""} className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" defaultValue={p?.email ?? ""} className={inputCls} />
            </Field>
            <Field label="Alamat" className="md:col-span-2">
              <input name="alamat" defaultValue={p?.alamat ?? ""} className={inputCls} />
            </Field>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 md:col-span-2">Rekening Pencairan Bisyarah</p>
            <Field label="Nama Bank / E-Wallet">
              <input name="bank" defaultValue={p?.bank ?? ""} className={inputCls} />
            </Field>
            <Field label="Nomor Rekening">
              <input name="noRekening" defaultValue={p?.noRekening ?? ""} className={inputCls} />
            </Field>
            <Field label="Atas Nama" className="md:col-span-2">
              <input name="atasNama" defaultValue={p?.atasNama ?? ""} className={inputCls} />
            </Field>
            <div className="md:col-span-2">
              <SubmitButton className={btn.primary} pendingText="Menyimpan...">
                <Save className="h-4 w-4" /> Simpan Profil
              </SubmitButton>
            </div>
          </form>
        </Card>

        <Card title="Ganti Password" subtitle="Setelah diganti, Anda akan diminta login ulang">
          <form action={gantiPasswordPengajar} className="space-y-4">
            <Field label="Password Lama">
              <PasswordInput name="lama" required autoComplete="current-password" className={inputCls} />
            </Field>
            <Field label="Password Baru" hint="Minimal 6 karakter">
              <PasswordInput name="baru" required minLength={6} autoComplete="new-password" className={inputCls} />
            </Field>
            <Field label="Konfirmasi Password Baru">
              <PasswordInput name="konfirmasi" required minLength={6} autoComplete="new-password" className={inputCls} />
            </Field>
            <SubmitButton className={`${btn.primary} w-full`}>
              <KeyRound className="h-4 w-4" /> Ganti Password
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
