"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, Save, Wallet } from "lucide-react";
import { inputCls, labelCls } from "@/components/ui";
import { MATERI_OPTIONS, NILAI_OPTIONS } from "@/lib/constants";
import { cx, isHariBelajar, rupiah } from "@/lib/format";
import { simpanAbsensi, type AbsensiState } from "../actions";

type SantriOpt = { id: number; nama: string; jam: string | null };
type Props = {
  santriList: SantriOpt[];
  initial: Record<string, string>;
  tarif: number;
  minCatatan: number;
  today: string;
};

export function AbsensiForm(props: Props) {
  const [state, action, pending] = useActionState<AbsensiState, FormData>(simpanAbsensi, {});
  const values = { ...props.initial, ...(state.values ?? {}) };
  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}
      <Body key={state.n ?? 0} v={values} {...props} pending={pending} />
    </form>
  );
}

const STATUS = [
  { v: "hadir", l: "Hadir", c: "has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800" },
  { v: "izin", l: "Izin", c: "has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-800" },
  { v: "sakit", l: "Sakit", c: "has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-800" },
  { v: "alpa", l: "Alpa", c: "has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-800" },
];

function Body({ v, santriList, tarif, minCatatan, today, pending }: Props & { v: Record<string, string>; pending: boolean }) {
  const isEdit = !!v.id;
  const [santriId, setSantriId] = useState(v.santriId ?? "");
  const [jam, setJam] = useState(v.jamMulai || santriList.find((s) => String(s.id) === v.santriId)?.jam || "");
  const [tanggal, setTanggal] = useState(v.tanggal || today);
  const [status, setStatus] = useState(v.status || "hadir");
  const [catatan, setCatatan] = useState(v.catatan ?? "");
  const [klaim, setKlaim] = useState(v.klaim === undefined || v.klaim === "" ? !isEdit : v.klaim === "on");
  const hadir = status === "hadir";
  const len = catatan.trim().length;
  const memenuhi = hadir && len >= minCatatan;

  return (
    <>
      <input type="hidden" name="id" value={v.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <label className="md:col-span-1">
          <span className={labelCls}>Santri *</span>
          <select
            name="santriId"
            required
            value={santriId}
            onChange={(e) => {
              setSantriId(e.target.value);
              const s = santriList.find((x) => String(x.id) === e.target.value);
              if (s?.jam) setJam(s.jam);
            }}
            className={inputCls}
          >
            <option value="" disabled>
              — Pilih santri —
            </option>
            {santriList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} {s.jam ? `(${s.jam})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Tanggal Pertemuan *</span>
          <input type="date" name="tanggal" required max={today} value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Jam Mulai (WIB)</span>
          <input type="time" name="jamMulai" value={jam} onChange={(e) => setJam(e.target.value)} className={inputCls} />
        </label>
      </div>
      {tanggal && !isHariBelajar(tanggal) && (
        <p className="flex items-center gap-2 rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">
          <Info className="h-4 w-4" /> Tanggal ini bukan hari belajar (Senin – Kamis). Akan dicatat sebagai pertemuan pengganti.
        </p>
      )}

      <div>
        <span className={labelCls}>Status Kehadiran Santri *</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS.map((s) => (
            <label key={s.v} className={cx("flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 transition", s.c)}>
              <input type="radio" name="status" value={s.v} checked={status === s.v} onChange={() => setStatus(s.v)} className="sr-only" />
              {s.l}
            </label>
          ))}
        </div>
      </div>

      <div className={cx("grid gap-4 md:grid-cols-3", !hadir && "pointer-events-none opacity-50")}>
        <label>
          <span className={labelCls}>Materi {hadir && "*"}</span>
          <input name="materi" list="materi-list" defaultValue={v.materi ?? ""} disabled={!hadir} placeholder="Pilih / ketik materi" className={inputCls} />
          <datalist id="materi-list">
            {MATERI_OPTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <label>
          <span className={labelCls}>Capaian (halaman / surat & ayat)</span>
          <input name="capaian" defaultValue={v.capaian ?? ""} disabled={!hadir} placeholder="cth: QS. An-Naba' 1-16" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Nilai / Predikat</span>
          <select name="nilai" defaultValue={v.nilai ?? ""} disabled={!hadir} className={inputCls}>
            <option value="">— Pilih nilai —</option>
            {NILAI_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Catatan Pertemuan {klaim && hadir && "*"}</span>
        <textarea
          name="catatan"
          rows={4}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tuliskan perkembangan bacaan santri, koreksi makhraj/tajwid, dan PR untuk pertemuan berikutnya..."
          className={inputCls}
        />
        <span className={cx("mt-1 block text-xs", memenuhi ? "text-emerald-600" : "text-slate-500")}>
          {len} karakter · minimal {minCatatan} karakter untuk klaim bisyarah · catatan dapat dilihat wali santri
        </span>
      </label>

      <div
        className={cx(
          "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4",
          klaim && memenuhi ? "border-emerald-200 bg-emerald-50" : "border-gold-200 bg-gold-50",
        )}
      >
        <label className={cx("flex items-start gap-3", !hadir && "opacity-60")}>
          <input
            type="checkbox"
            name="klaim"
            checked={klaim && hadir}
            disabled={!hadir}
            onChange={(e) => setKlaim(e.target.checked)}
            className="mt-1 h-5 w-5 accent-brand-700"
          />
          <span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Wallet className="h-4 w-4 text-brand-700" /> Klaim bisyarah pertemuan ini ({rupiah(tarif)})
            </span>
            <span className="mt-0.5 block text-xs text-slate-600">
              {!hadir
                ? "Klaim hanya tersedia untuk pertemuan dengan status Hadir."
                : memenuhi
                  ? "Catatan sudah memenuhi syarat. Klaim akan diajukan ke admin."
                  : `Lengkapi materi & catatan pertemuan (min. ${minCatatan} karakter) agar klaim dapat diajukan.`}
            </span>
          </span>
        </label>
        {klaim && memenuhi && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Absensi"}
      </button>
    </>
  );
}
