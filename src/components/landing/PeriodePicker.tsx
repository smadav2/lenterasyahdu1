"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cx, rupiah } from "@/lib/format";

export function PeriodePicker({ biaya, options }: { biaya: number; options: number[] }) {
  const [n, setN] = useState(options[0] ?? 1);
  return (
    <div className="mt-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Pilih Periode:</p>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setN(o)}
            className={cx(
              "rounded-xl border px-2 py-2.5 text-sm font-semibold transition",
              n === o
                ? "border-gold-400 bg-gold-400 text-brand-950 shadow-lg shadow-gold-500/20"
                : "border-white/15 bg-white/5 text-white hover:border-white/40",
            )}
          >
            {o} Bln
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-3.5">
        <span className="text-sm text-brand-100">Total Pembayaran:</span>
        <span className="text-xl font-extrabold text-gold-300">{rupiah(biaya * n)}</span>
      </div>
      <Link
        href={`/daftar?periode=${n}`}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-4 text-base font-bold text-brand-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-gold-300"
      >
        Daftar Sekarang <ArrowRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
