export const TZ = "Asia/Jakarta";

export const NAMA_HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function rupiah(n: number | null | undefined): string {
  return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);
}

export function angka(n: number | null | undefined): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n ?? 0);
}

/** Tanggal hari ini (zona Asia/Jakarta) dalam format YYYY-MM-DD */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function currentPeriode(): string {
  return todayJakarta().slice(0, 7);
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toYmd(d);
}

export function formatTanggal(
  s: string | null | undefined,
  style: "long" | "medium" | "short" = "medium",
): string {
  if (!s) return "-";
  const d = parseYmd(s);
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
      : style === "short"
        ? { day: "2-digit", month: "short", timeZone: "UTC" }
        : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("id-ID", opts).format(d);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function namaHari(s: string): string {
  return NAMA_HARI[parseYmd(s).getUTCDay()];
}

/** Hari belajar: Senin (1) s/d Kamis (4) */
export function isHariBelajar(s: string): boolean {
  const d = parseYmd(s).getUTCDay();
  return d >= 1 && d <= 4;
}

export function periodeLabel(p: string): string {
  const [y, m] = p.split("-").map(Number);
  return `${NAMA_BULAN[(m || 1) - 1]} ${y}`;
}

export function periodeRange(p: string): { start: string; end: string } {
  const [y, m] = p.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${p}-01`, end: `${p}-${String(last).padStart(2, "0")}` };
}

export function shiftPeriode(p: string, delta: number): string {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isValidPeriode(p?: string | null): p is string {
  return !!p && /^\d{4}-(0[1-9]|1[0-2])$/.test(p);
}

export function isValidDate(s?: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseYmd(s).getTime());
}

/** Jumlah hari Senin–Kamis dalam satu periode bulan */
export function hariBelajarDalamBulan(p: string): number {
  const { start, end } = periodeRange(p);
  let count = 0;
  let d = start;
  while (d <= end) {
    if (isHariBelajar(d)) count++;
    d = addDays(d, 1);
  }
  return count;
}

export function hitungUsia(tgl: string | null | undefined): number | null {
  if (!tgl || !isValidDate(tgl)) return null;
  const b = parseYmd(tgl);
  const t = parseYmd(todayJakarta());
  let age = t.getUTCFullYear() - b.getUTCFullYear();
  const md = t.getUTCMonth() - b.getUTCMonth();
  if (md < 0 || (md === 0 && t.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export function normalizeWa(no: string | null | undefined): string {
  if (!no) return "";
  let d = no.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}

export function waLink(no: string | null | undefined, text?: string): string {
  const n = normalizeWa(no);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function kodeSantri(id: number): string {
  return `LS-${String(id).padStart(4, "0")}`;
}

export function initials(nama: string): string {
  const clean = nama.replace(/^(Ustadzah|Ustadz|Ust\.|Bapak|Ibu|Bunda)\s+/i, "");
  return (
    clean
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function str(v: FormDataEntryValue | null | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

export function strOrNull(v: FormDataEntryValue | null | undefined): string | null {
  const s = str(v);
  return s.length ? s : null;
}

export function intOr(v: FormDataEntryValue | string | null | undefined, fallback = 0): number {
  const s = typeof v === "string" ? v : "";
  const n = parseInt(s.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
