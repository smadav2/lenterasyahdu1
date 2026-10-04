import Link from "next/link";
import { CheckCircle2, CreditCard, GraduationCap, Home, MessageCircle, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { LandingNavbar } from "@/components/landing/Navbar";
import { first, rupiah, waLink } from "@/lib/format";
import { getNumbers } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pendaftaran Berhasil" };

export default async function SuksesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { s, biaya } = await getNumbers();
  const no = `REG-${String(Number(first(sp.no)) || 0).padStart(4, "0")}`;
  const nama = (first(sp.nama) ?? "").slice(0, 60);
  const bln = Math.min(Math.max(Number(first(sp.bln)) || 1, 1), 12);
  const jam = (first(sp.jam) ?? "").slice(0, 5);
  const total = biaya * bln;
  const wa = waLink(
    s.noWa,
    `Assalamu'alaikum, saya baru saja mendaftar ${s.namaProgram} ${s.namaLembaga}.\nNo. Pendaftaran: ${no}\nNama santri: ${nama}\nPeriode: ${bln} bulan\nJam belajar: ${jam} WIB\nMohon informasi langkah selanjutnya. Jazakumullah khairan.`,
  );

  return (
    <div className="min-h-screen bg-hero">
      <LandingNavbar />
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="rounded-3xl border border-white bg-white p-8 text-center shadow-[0_30px_80px_-30px_rgba(74,29,93,0.4)] sm:p-12">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-100 text-leaf-600">
            <CheckCircle2 className="h-11 w-11" />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Pendaftaran Berhasil!</h1>
          <p className="mt-2 text-slate-500">
            Jazakumullah khairan, data pendaftaran <b className="text-slate-800">{nama}</b> telah kami terima.
          </p>

          <div className="mx-auto mt-8 grid max-w-lg gap-3 rounded-2xl bg-slate-50 p-5 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Pendaftaran</span>
              <span className="font-bold text-brand-700">{no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Program</span>
              <span className="font-medium text-slate-800">{s.namaProgram}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Periode</span>
              <span className="font-medium text-slate-800">{bln} bulan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jam Belajar</span>
              <span className="font-medium text-slate-800">{jam} WIB · {s.hariBelajar}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3">
              <span className="font-medium text-slate-700">Total yang harus dibayar</span>
              <span className="font-extrabold text-brand-800">{rupiah(total)}</span>
            </div>
          </div>

          <div className="mt-10 text-left">
            <h2 className="text-center text-lg font-semibold text-slate-900">Langkah Selanjutnya</h2>
            <ol className="mt-6 space-y-4">
              {[
                { icon: MessageCircle, t: "Hubungi Admin via WhatsApp", d: "Kirim konfirmasi pendaftaran agar admin dapat menjadwalkan tes bacaan awal dan menentukan pengajar." },
                { icon: CreditCard, t: "Lakukan Pembayaran", d: `Transfer ${rupiah(total)} ke ${s.bankNama} ${s.bankNoRek} a.n. ${s.bankAtasNama}, lalu kirim bukti transfer via WhatsApp.` },
                { icon: GraduationCap, t: "Mulai Belajar & Pantau Progres", d: "Setelah diverifikasi, Anda akan menerima Kode Santri untuk memantau perkembangan di menu Cek Progres." },
              ].map((l, i) => (
                <li key={l.t} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <l.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {i + 1}. {l.t}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">{l.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/20 hover:brightness-95"
            >
              <WhatsAppIcon className="h-5 w-5" /> Konfirmasi via WhatsApp
            </a>
            <Link href="/cek-progres" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:border-brand-400">
              <Search className="h-5 w-5" /> Cek Progres
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:border-brand-400">
              <Home className="h-5 w-5" /> Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
