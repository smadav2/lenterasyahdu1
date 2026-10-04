import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Inbox } from "lucide-react";
import type { Tone } from "@/lib/constants";
import { cx } from "@/lib/format";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

export const btn = {
  primary: cx(base, "bg-brand-700 px-4 py-2.5 text-sm text-white shadow-sm shadow-brand-900/20 hover:bg-brand-800 focus-visible:ring-brand-200"),
  gold: cx(base, "bg-gold-400 px-4 py-2.5 text-sm text-brand-950 hover:bg-gold-300 focus-visible:ring-gold-200"),
  outline: cx(base, "border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 hover:border-brand-400 hover:text-brand-700 focus-visible:ring-brand-100"),
  success: cx(base, "bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 focus-visible:ring-emerald-200"),
  danger: cx(base, "bg-rose-600 px-4 py-2.5 text-sm text-white hover:bg-rose-700 focus-visible:ring-rose-200"),
  ghost: cx(base, "px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"),
};

export const btnSm = {
  primary: cx(base, "bg-brand-700 px-2.5 py-1.5 text-xs text-white hover:bg-brand-800"),
  outline: cx(base, "border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-brand-400 hover:text-brand-700"),
  success: cx(base, "bg-emerald-600 px-2.5 py-1.5 text-xs text-white hover:bg-emerald-700"),
  danger: cx(base, "bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"),
  gold: cx(base, "bg-gold-400 px-2.5 py-1.5 text-xs text-brand-950 hover:bg-gold-300"),
  wa: cx(base, "bg-[#25D366] px-2.5 py-1.5 text-xs text-white hover:brightness-95"),
};

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";
export const inputSm =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
export const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

export const tableWrap = "overflow-x-auto rounded-xl border border-slate-200";
export const tableCls = "min-w-full divide-y divide-slate-200 text-sm";
export const thCls =
  "bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";
export const tdCls = "px-4 py-3 align-top text-slate-700";

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("block", className)}>
      <span className={labelCls}>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cx("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STAT_TONES = {
  brand: "bg-brand-100 text-brand-700",
  gold: "bg-gold-100 text-gold-700",
  green: "bg-leaf-100 text-leaf-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", STAT_TONES[tone])}>{icon}</span>}
      </div>
    </div>
  );
}

export function Badge({ tone, children, className }: { tone?: Tone; children?: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tone?.cls ?? "bg-slate-100 text-slate-600 ring-slate-200",
        className,
      )}
    >
      {children ?? tone?.label}
    </span>
  );
}

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div
      className={cx(
        "no-print mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{ok ?? err}</span>
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <Inbox className="h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-xs text-slate-500">{desc}</p>}
    </div>
  );
}
