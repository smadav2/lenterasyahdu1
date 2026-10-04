export type SP = Record<string, string | string[] | undefined>;

/** Membangun URL dari path + searchParams saat ini (tanpa pesan ok/err). */
export function buildUrl(path: string, sp: SP, override: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "ok" || k === "err") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val) p.set(k, val);
  }
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

export function withMsg(url: string, key: "ok" | "err", msg: string): string {
  const [path, qs] = url.split("?");
  const p = new URLSearchParams(qs ?? "");
  p.delete("ok");
  p.delete("err");
  if (key === "ok") p.delete("edit");
  p.set(key, msg);
  return `${path}?${p.toString()}`;
}
