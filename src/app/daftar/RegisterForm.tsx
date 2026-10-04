"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, BookOpen, CalendarClock, Clock, Loader2, Send, UserRound, Users } from "lucide-react";
import { inputCls, labelCls } from "@/components/ui";
import { JAM_OPTIONS, LAMA_BULAN_OPTIONS, SUMBER_INFO } from "@/lib/constants";
import { cx, rupiah } from "@/lib/format";
import { daftarAction, type DaftarState } from "./actions";

type Props = {
  biaya: number;
  pertemuan: number;
  durasi: number;
  hariBelajar: string;
  namaProgram: string;
  periodeAwal: number;
};

function Section({ no, title, icon, children }: { no: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">{icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">Langkah {no}</p>
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function RegisterForm(props: Props) {
  const [state, action, pending] = useActionState<DaftarState, FormData>(daftarAction, {});
  const v = state.values ?? {};
  const [lama, setLama] = useState<number>(Number(v.lamaBulan) || props.periodeAwal);
  const [pernah, setPernah] = useState<string>(v.pernahBelajar || "belum");
  const total = props.biaya * lama;

  return (
    <form action={action} key={state.n ?? 0} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {state.error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
          </div>
        )}

        <Section no={1} title="Data Santri" icon={<UserRound className="h-5 w-5" />}>
          <label className="sm:col-span-2">
            <span className={labelCls}>Nama Lengkap Santri *</span>
            <input name="nama" required defaultValue={v.nama} placeholder="Contoh: Muhammad Al Fatih" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Nama Panggilan *</span>
            <input name="namaPanggilan" required defaultValue={v.namaPanggilan} placeholder="Contoh: Fatih" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Tanggal Lahir Santri *</span>
            <input type="date" name="tanggalLahir" required defaultValue={v.tanggalLahir} className={inputCls} />
          </label>
          <div>
            <span className={labelCls}>Jenis Kelamin *</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "L", l: "Laki-laki" },
                { v: "P", l: "Perempuan" },
              ].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800">
                  <input type="radio" name="jenisKelamin" value={o.v} required defaultChecked={v.jenisKelamin === o.v} className="accent-brand-700" />
                  {o.l}
                </label>
              ))}
            </div>
          </div>
          <label>
            <span className={labelCls}>Kota Domisili *</span>
            <input name="kota" required defaultValue={v.kota} placeholder="Contoh: Bandung" className={inputCls} />
          </label>
          <div className="sm:col-span-2">
            <span className={labelCls}>Apakah santri sudah pernah belajar mengaji sebelumnya? *</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "belum", l: "Belum pernah" },
                { v: "sudah", l: "Sudah pernah" },
              ].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800">
                  <input
                    type="radio"
                    name="pernahBelajar"
                    value={o.v}
                    checked={pernah === o.v}
                    onChange={() => setPernah(o.v)}
                    className="accent-brand-700"
                  />
                  {o.l}
                </label>
              ))}
            </div>
          </div>
          {pernah === "sudah" && (
            <label className="sm:col-span-2">
              <span className={labelCls}>Level / Tingkat Belajar Sebelumnya *</span>
              <input name="levelSebelumnya" defaultValue={v.levelSebelumnya} placeholder="Contoh: Iqro' 3, Al-Qur'an Juz 5, dll" className={inputCls} />
            </label>
          )}
        </Section>

        <Section no={2} title="Informasi Wali Santri" icon={<Users className="h-5 w-5" />}>
          <label className="sm:col-span-2">
            <span className={labelCls}>Nama Orang Tua / Wali *</span>
            <input name="namaWali" required defaultValue={v.namaWali} placeholder="Jika santri dewasa, isi nama sendiri" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Nomor WhatsApp *</span>
            <input name="noWa" required inputMode="tel" defaultValue={v.noWa} placeholder="081234567890" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Email (opsional)</span>
            <input type="email" name="email" defaultValue={v.email} placeholder="nama@email.com" className={inputCls} />
          </label>
        </Section>

        <Section no={3} title="Preferensi Belajar" icon={<BookOpen className="h-5 w-5" />}>
          <label>
            <span className={labelCls}>Request Jam Belajar (WIB) *</span>
            <select name="jamPreferensi" required defaultValue={v.jamPreferensi || ""} className={inputCls}>
              <option value="" disabled>
                Pilih jam
              </option>
              {JAM_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j} WIB
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>Mengetahui Lentera Syahdu dari *</span>
            <select name="sumberInfo" required defaultValue={v.sumberInfo || ""} className={inputCls}>
              <option value="" disabled>
                Pilih sumber informasi
              </option>
              {SUMBER_INFO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <span className={labelCls}>Pilih Periode Belajar *</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LAMA_BULAN_OPTIONS.map((o) => (
                <label
                  key={o}
                  className={cx(
                    "flex cursor-pointer flex-col items-center rounded-xl border px-3 py-3 text-center transition",
                    lama === o ? "border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-100" : "border-slate-300 text-slate-600 hover:border-brand-300",
                  )}
                >
                  <input type="radio" name="lamaBulan" value={o} checked={lama === o} onChange={() => setLama(o)} className="sr-only" />
                  <span className="text-sm font-bold">{o} Bulan</span>
                  <span className="text-[11px]">{rupiah(props.biaya * o)}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="sm:col-span-2">
            <span className={labelCls}>Tujuan Pembelajaran *</span>
            <textarea
              name="tujuan"
              required
              rows={3}
              defaultValue={v.tujuan}
              placeholder="Contoh: agar bisa membaca Al-Qur'an dengan tartil dan benar tajwidnya"
              className={inputCls}
            />
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" name="setuju" required className="mt-0.5 h-4 w-4 accent-brand-700" />
            <span>
              Saya menyatakan data yang diisi benar dan bersedia mengikuti {props.namaProgram} sesuai jadwal ({props.hariBelajar}).
            </span>
          </label>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_20px_50px_-20px_rgba(74,29,93,0.35)]">
          <div className="bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">Ringkasan Paket yang Dipilih</p>
            <h3 className="mt-2 text-xl font-bold">{props.namaProgram}</h3>
            <p className="mt-1 text-sm text-brand-200">Private online · 1 santri : 1 pengajar</p>
          </div>
          <div className="space-y-3 p-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarClock className="h-4 w-4 text-brand-600" /> {props.pertemuan}x pertemuan / bulan ({props.hariBelajar})
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 text-brand-600" /> {props.durasi} menit / pertemuan
            </div>
            <div className="my-4 border-t border-dashed border-slate-200" />
            <div className="flex justify-between text-slate-600">
              <span>Biaya Program:</span>
              <span className="font-medium text-slate-800">
                {rupiah(props.biaya)} × {lama} bln
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Biaya Registrasi:</span>
              <span className="font-semibold text-leaf-600">Gratis</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
              <span className="font-medium text-slate-700">Total Pembayaran:</span>
              <span className="text-lg font-extrabold text-brand-800">{rupiah(total)}</span>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:bg-brand-800 disabled:opacity-70"
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {pending ? "Mengirim..." : "Daftar Sekarang"}
            </button>
            <p className="text-center text-xs text-slate-400">Pembayaran dilakukan setelah konfirmasi admin via WhatsApp.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}
