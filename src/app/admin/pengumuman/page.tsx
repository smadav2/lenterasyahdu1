import Link from "next/link";
import { desc } from "drizzle-orm";
import { Megaphone, Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { pengumuman } from "@/db/schema";
import { SubmitButton } from "@/components/client";
import { Badge, Card, EmptyState, Field, Flash, PageHeader, btn, btnSm, inputCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { first, formatDateTime, intOr } from "@/lib/format";
import type { SP } from "@/lib/url";
import { deletePengumuman, savePengumuman } from "../actions";

export const dynamic = "force-dynamic";

export default async function PengumumanPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const P = "/admin/pengumuman";
  const editId = intOr(first(sp.edit), 0);
  const list = await db.select().from(pengumuman).orderBy(desc(pengumuman.createdAt));
  const e = editId ? list.find((x) => x.id === editId) : undefined;

  return (
    <div>
      <PageHeader title="Pengumuman untuk Pengajar" subtitle="Pengumuman tampil di dashboard seluruh pengajar." />
      <Flash ok={first(sp.ok)} err={first(sp.err)} />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card
          title={e ? "Edit Pengumuman" : "Buat Pengumuman"}
          className="lg:sticky lg:top-24 lg:self-start"
          action={
            e && (
              <Link href={P} className={btn.ghost}>
                Batal
              </Link>
            )
          }
        >
          <form action={savePengumuman} key={e?.id ?? "new"} className="space-y-4">
            <input type="hidden" name="id" value={e?.id ?? ""} />
            <input type="hidden" name="back" value={P} />
            <Field label="Judul" required>
              <input name="judul" required defaultValue={e?.judul ?? ""} className={inputCls} />
            </Field>
            <Field label="Isi Pengumuman" required>
              <textarea name="isi" required rows={6} defaultValue={e?.isi ?? ""} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="penting" defaultChecked={e?.penting ?? false} className="h-4 w-4 accent-brand-700" />
              Tandai sebagai penting
            </label>
            <SubmitButton className={`${btn.primary} w-full`}>
              <Megaphone className="h-4 w-4" /> {e ? "Simpan Perubahan" : "Publikasikan"}
            </SubmitButton>
          </form>
        </Card>

        <div className="space-y-4">
          {list.length === 0 ? (
            <Card>
              <EmptyState title="Belum ada pengumuman" />
            </Card>
          ) : (
            list.map((p) => (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{p.judul}</h3>
                      {p.penting && <Badge className="bg-rose-100 text-rose-700 ring-rose-200">Penting</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">{formatDateTime(p.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`${P}?edit=${p.id}`} className={btnSm.outline}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <form action={deletePengumuman}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="back" value={P} />
                      <SubmitButton className={btnSm.danger} confirmText="Hapus pengumuman ini?">
                        <Trash2 className="h-3.5 w-3.5" />
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.isi}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
