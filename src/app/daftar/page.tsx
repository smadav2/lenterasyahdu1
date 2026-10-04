import { LandingNavbar } from "@/components/landing/Navbar";
import { LAMA_BULAN_OPTIONS } from "@/lib/constants";
import { first } from "@/lib/format";
import { getNumbers } from "@/lib/settings";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pendaftaran Santri" };

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { s, biaya, pertemuan, durasi } = await getNumbers();
  const p = Number(first(sp.periode));
  const periodeAwal = LAMA_BULAN_OPTIONS.includes(p) ? p : 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNavbar />
      <div className="bg-hero border-b border-brand-100">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Formulir Pendaftaran</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Daftar <span className="text-brand-700">{s.namaProgram}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Lengkapi data di bawah ini. Admin {s.namaLembaga} akan menghubungi Anda melalui WhatsApp untuk konfirmasi jadwal dan
            tes bacaan awal.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <RegisterForm
          biaya={biaya}
          pertemuan={pertemuan}
          durasi={durasi}
          hariBelajar={s.hariBelajar}
          namaProgram={s.namaProgram}
          periodeAwal={periodeAwal}
        />
      </div>
    </div>
  );
}
