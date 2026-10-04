import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck2,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  ClipboardList,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  MonitorPlay,
  Phone,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/icons";
import { LandingNavbar } from "@/components/landing/Navbar";
import { PeriodePicker } from "@/components/landing/PeriodePicker";
import { LAMA_BULAN_OPTIONS } from "@/lib/constants";
import { normalizeWa, rupiah, waLink } from "@/lib/format";
import { ensureSeed } from "@/lib/seed";
import { getNumbers } from "@/lib/settings";

export const dynamic = "force-dynamic";

const FLAGS = [
  { code: "id", name: "Indonesia" },
  { code: "my", name: "Malaysia" },
  { code: "sg", name: "Singapura" },
  { code: "bn", name: "Brunei" },
  { code: "sa", name: "Arab Saudi" },
  { code: "ae", name: "Uni Emirat Arab" },
  { code: "qa", name: "Qatar" },
  { code: "eg", name: "Mesir" },
  { code: "tr", name: "Turki" },
  { code: "jp", name: "Jepang" },
  { code: "kr", name: "Korea Selatan" },
  { code: "tw", name: "Taiwan" },
  { code: "hk", name: "Hong Kong" },
  { code: "au", name: "Australia" },
  { code: "nl", name: "Belanda" },
  { code: "de", name: "Jerman" },
  { code: "gb", name: "Inggris" },
  { code: "us", name: "Amerika Serikat" },
  { code: "ca", name: "Kanada" },
  { code: "th", name: "Thailand" },
];

const TESTIMONI = [
  {
    text: "Alhamdulillah, sejak ikut kelas tahsin di Lentera Syahdu bacaan anak saya jauh lebih rapi. Ustadzahnya sabar sekali, setiap selesai mengaji selalu ada catatan perkembangan yang bisa saya pantau.",
    name: "Bunda Nafisa",
    location: "Bandung",
    color: "#6c2789",
  },
  {
    text: "Sebagai pekerja, saya butuh jadwal yang pasti. Senin sampai Kamis jam 8 malam pas sekali. Makhraj huruf saya yang dulu belepotan sekarang sudah jauh lebih baik. Jazakumullah khairan.",
    name: "Bapak Hendra",
    location: "Jakarta Selatan",
    color: "#d98a00",
  },
  {
    text: "Belajar dari Kuala Lumpur tetap lancar. Metodenya terstruktur, mulai dari makharijul huruf sampai tartil. Suasana belajarnya syahdu dan menyenangkan, tidak membuat bosan.",
    name: "Abdullah Rasyid",
    location: "Kuala Lumpur, Malaysia",
    color: "#2f9a24",
  },
];

export default async function HomePage() {
  await ensureSeed();
  const { s, biaya, pertemuan, durasi } = await getNumbers();
  const waUmum = waLink(s.noWa, `Assalamu'alaikum, saya ingin bertanya tentang ${s.namaProgram} ${s.namaLembaga}.`);
  const waGabung = waLink(s.noWa, `Assalamu'alaikum, saya tertarik bergabung menjadi santri ${s.namaLembaga}. Mohon informasi lebih lanjut.`);
  const perSesi = Math.round(biaya / Math.max(pertemuan, 1));

  const stats = [
    { value: s.statSantri, label: "Santri" },
    { value: s.statPengajar, label: "Pengajar Berpengalaman" },
    { value: s.statKepuasan, label: "Tingkat Kepuasan Wali Santri" },
    { value: `${pertemuan}x`, label: "Pertemuan Setiap Bulan" },
  ];

  const keunggulan = [
    { icon: ShieldCheck, title: "Pengajar Bersanad & Berpengalaman", desc: "Dibimbing ustadz/ustadzah yang terseleksi, berpengalaman mengajar tahsin dan memiliki sanad bacaan." },
    { icon: MonitorPlay, title: "Belajar Online dari Rumah", desc: "Cukup dengan HP/laptop melalui Zoom, Google Meet, atau WhatsApp Video Call. Bisa dari mana saja." },
    { icon: ClipboardList, title: "Laporan Progres Tiap Pertemuan", desc: "Setiap sesi dicatat: materi, capaian, nilai, dan catatan pengajar. Wali santri bisa cek progres online." },
    { icon: BookOpenCheck, title: "Kurikulum Tahsin Terstruktur", desc: "Bertahap dari makharijul huruf, sifatul huruf, hukum tajwid, hingga membaca Al-Qur'an dengan tartil." },
    { icon: UserRound, title: "Private 1 Santri : 1 Pengajar", desc: "Perhatian penuh pada setiap santri sehingga koreksi bacaan lebih detail dan perkembangan lebih cepat." },
    { icon: Wallet, title: "Biaya Terjangkau", desc: `Hanya ${rupiah(biaya)}/bulan untuk ${pertemuan}x pertemuan — sekitar ${rupiah(perSesi)} per sesi ${durasi} menit.` },
  ];

  const materi = [
    "Makharijul huruf (tempat keluarnya huruf)",
    "Sifatul huruf (karakter huruf)",
    "Hukum nun & mim sukun, ghunnah",
    "Mad, qalqalah, tafkhim & tarqiq",
    "Waqaf & ibtida', gharib & musykilat",
    "Praktik tilawah Al-Qur'an dengan tartil",
  ];

  const faqs = [
    { q: "Apa itu Kelas Tahsin Online?", a: "Kelas tahsin adalah kelas untuk memperbaiki dan memperindah bacaan Al-Qur'an sesuai kaidah ilmu tajwid. Di Lentera Syahdu, kelas dilakukan secara online dan private (1 santri dengan 1 pengajar)." },
    { q: "Berapa biaya dan berapa kali pertemuannya?", a: `Biaya ${rupiah(biaya)} per bulan untuk ${pertemuan}x pertemuan. Setiap pertemuan berdurasi ${durasi} menit, dilaksanakan ${s.hariBelajar} setiap minggu.` },
    { q: "Untuk usia berapa kelas ini?", a: "Kelas terbuka untuk semua usia: anak-anak (mulai ± 5 tahun), remaja, hingga dewasa dan orang tua. Materi disesuaikan dengan kemampuan awal santri." },
    { q: "Media apa yang digunakan untuk belajar?", a: "Pembelajaran menggunakan video call (Zoom, Google Meet, atau WhatsApp Video) sesuai kesepakatan dengan pengajar. Cukup siapkan HP/laptop, koneksi internet, dan mushaf." },
    { q: "Bagaimana jika santri berhalangan hadir?", a: "Pengajar akan mencatat status kehadiran (izin/sakit). Pertemuan pengganti dapat diatur bersama pengajar sesuai kesepakatan." },
    { q: "Bagaimana orang tua memantau perkembangan anak?", a: "Setiap pertemuan pengajar mengisi absensi beserta materi, capaian, nilai, dan catatan. Wali santri bisa melihatnya di menu 'Cek Progres' dengan memasukkan kode santri dan nomor WhatsApp." },
    { q: "Bagaimana cara pembayarannya?", a: `Pembayaran dilakukan via transfer ke rekening ${s.bankNama} a.n. ${s.bankAtasNama}. Konfirmasi pembayaran dapat dikirim melalui WhatsApp admin.` },
  ];

  const langkah = [
    { icon: ClipboardList, title: "Isi Formulir", desc: "Lengkapi data santri & pilih jam belajar." },
    { icon: MessageCircle, title: "Konfirmasi Admin", desc: "Admin menghubungi via WhatsApp untuk tes bacaan awal." },
    { icon: CreditCard, title: "Pembayaran", desc: "Transfer biaya program sesuai periode yang dipilih." },
    { icon: GraduationCap, title: "Mulai Belajar", desc: "Belajar bersama pengajar sesuai jadwal Senin – Kamis." },
  ];

  const days = [
    { d: "Senin", on: true },
    { d: "Selasa", on: true },
    { d: "Rabu", on: true },
    { d: "Kamis", on: true },
    { d: "Jumat", on: false },
    { d: "Sabtu", on: false },
    { d: "Ahad", on: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* ================= HERO ================= */}
      <section id="beranda" className="bg-hero relative overflow-hidden pb-24 pt-12 lg:pb-28 lg:pt-16">
        <div className="animate-blob pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-300/40 blur-3xl" />
        <div className="animate-blob pointer-events-none absolute -bottom-40 right-0 h-[460px] w-[460px] rounded-full bg-gold-200/60 blur-3xl [animation-delay:4s]" />
        <div className="animate-blob pointer-events-none absolute right-1/3 top-1/4 h-[300px] w-[300px] rounded-full bg-leaf-100/80 blur-3xl [animation-delay:8s]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-[13px] font-semibold text-brand-700 backdrop-blur">
              <span className="animate-pulse-dot h-2 w-2 rounded-full bg-leaf-500" />
              Platform Belajar Tahsin Online Terpercaya
            </div>
            <h1 className="mt-6 text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight text-[#161c2d]">
              Menerangi Hati dengan <br className="hidden sm:block" />
              <span className="text-gradient-brand">Cahaya Al-Qur&apos;an</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
              Bergabunglah bersama santri {s.namaLembaga} dalam memperbaiki bacaan Al-Qur&apos;an dengan bimbingan
              pengajar berpengalaman — {pertemuan}x pertemuan setiap bulan, langsung dari rumah.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#program"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-brand-700/30 transition hover:-translate-y-0.5 hover:bg-brand-800"
              >
                <Play className="h-5 w-5 fill-current" /> Mulai Belajar
              </a>
              <a
                href="#tentang"
                className="rounded-xl border-2 border-slate-300 px-7 py-[14px] text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
              >
                Pelajari Lebih
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {s.statRating} Rating Wali Santri
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-leaf-500" /> Gratis Konsultasi
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-brand-600" /> Pengajar Bersanad
              </span>
            </div>
          </div>

          <div className="animate-fade-up relative mx-auto w-full max-w-xl [animation-delay:150ms]">
            <div className="absolute -inset-3 rotate-3 rounded-[2.6rem] bg-gradient-to-br from-brand-600 via-brand-500 to-gold-400 opacity-90" />
            <div className="relative overflow-hidden rounded-[2.2rem] border-4 border-white bg-white shadow-2xl">
              <div className="relative aspect-square">
                <Image
                  src="/images/hero.png"
                  alt="Santri belajar tahsin online bersama ustadzah Lentera Syahdu"
                  fill
                  priority
                  sizes="(min-width: 1024px) 560px, 92vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="animate-float absolute -left-7 top-8 h-16 w-16 rounded-full bg-gold-300/80" />
            <div className="animate-float-slow absolute -right-4 bottom-10 h-10 w-10 rounded-full bg-leaf-400/80" />
            <div className="animate-float absolute -left-3 bottom-[18%] rounded-2xl border border-brand-100 bg-white px-5 py-3.5 shadow-xl sm:-left-10">
              <div className="text-2xl font-extrabold text-brand-700">{s.statSantri}</div>
              <div className="text-xs font-medium text-slate-500">Santri Aktif</div>
            </div>
            <div className="animate-float absolute -right-2 top-[12%] rounded-2xl border border-brand-100 bg-white px-5 py-3.5 shadow-xl [animation-delay:1.5s] sm:-right-8">
              <div className="text-2xl font-extrabold text-leaf-600">{s.statPengajar}</div>
              <div className="text-xs font-medium text-slate-500">Pengajar</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEBARAN & STATISTIK ================= */}
      <section className="border-y border-slate-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-center text-xl font-bold text-slate-800">
            Sebaran Santri <span className="text-brand-700">{s.namaLembaga}</span>
          </h2>
          <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex w-max gap-4">
              {[...FLAGS, ...FLAGS].map((f, i) => (
                <div key={i} className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${f.code}.png`}
                    alt={f.name}
                    width={28}
                    height={20}
                    loading="lazy"
                    className="h-5 w-7 rounded-[3px] object-cover"
                  />
                  <span className="text-xs font-medium text-slate-600">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="text-center">
                <div className="text-4xl font-extrabold tracking-tight text-brand-700 md:text-5xl">{st.value}</div>
                <div className="mt-2 text-sm font-medium text-slate-500">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TENTANG ================= */}
      <section id="tentang" className="relative overflow-hidden bg-gradient-to-b from-white to-brand-50/50 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
            Tentang <span className="text-brand-700">{s.namaLembaga}</span>
          </h2>
          <div className="mt-14 grid items-center gap-14 lg:grid-cols-2">
            <div className="relative mx-auto w-full max-w-lg">
              <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-brand-100">
                <Image src="/images/about.png" alt="Belajar Al-Qur'an online" fill sizes="(min-width: 1024px) 512px, 92vw" className="object-cover" />
              </div>
              <span className="animate-float absolute -left-4 top-10 h-8 w-8 rounded-full bg-brand-500/80" />
              <span className="animate-float-slow absolute -right-5 top-1/4 h-12 w-12 rounded-full bg-gold-400/80" />
              <span className="animate-float absolute -bottom-4 left-1/4 h-10 w-10 rounded-full bg-leaf-400/80 [animation-delay:1s]" />
              <span className="animate-float-slow absolute bottom-1/4 -left-6 h-5 w-5 rounded-full bg-sky-400/80" />
              <span className="animate-float absolute -right-3 bottom-12 h-6 w-6 rounded-full bg-brand-300 [animation-delay:2s]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Apa itu <span className="text-brand-700">{s.namaLembaga}</span>?
              </h3>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                {s.namaLembaga} adalah platform pembelajaran Al-Qur&apos;an online yang fokus pada{" "}
                <b className="text-slate-800">{s.namaProgram}</b> — memperbaiki bacaan Al-Qur&apos;an sesuai kaidah tajwid,
                mulai dari makharijul huruf, sifatul huruf, hingga membaca dengan tartil. Seperti lentera yang menerangi
                kegelapan, kami ingin menghadirkan cahaya Al-Qur&apos;an ke setiap rumah dengan suasana belajar yang syahdu,
                sabar, dan menyenangkan — untuk semua kalangan, dari anak-anak hingga dewasa.
              </p>
              <figure className="mt-6 rounded-2xl border border-gold-200 bg-gold-50/80 p-5">
                <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-loose text-brand-900">
                  وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
                </p>
                <figcaption className="mt-1 text-sm italic text-slate-600">
                  &ldquo;Dan bacalah Al-Qur&apos;an itu dengan perlahan-lahan (tartil).&rdquo; — QS. Al-Muzzammil: 4
                </figcaption>
              </figure>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Pengajar bersanad & berpengalaman", "Private 1 santri : 1 pengajar", "Laporan progres setiap pertemuan", "Untuk anak, remaja & dewasa"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-600">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN ================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Keunggulan Kami</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Mengapa Belajar di <span className="text-brand-700">{s.namaLembaga}</span>?
            </h2>
            <p className="mt-4 text-slate-500">Kami merancang pengalaman belajar tahsin yang nyaman, terarah, dan mudah dipantau.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {keunggulan.map((k, i) => (
              <div
                key={k.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_50px_-20px_rgba(74,29,93,0.35)]"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-50 transition group-hover:bg-gold-100" />
                <span
                  className={`relative grid h-12 w-12 place-items-center rounded-xl ${
                    i % 3 === 0 ? "bg-brand-100 text-brand-700" : i % 3 === 1 ? "bg-gold-100 text-gold-700" : "bg-leaf-100 text-leaf-700"
                  }`}
                >
                  <k.icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-lg font-semibold text-slate-900">{k.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROGRAM ================= */}
      <section id="program" className="bg-hero relative overflow-hidden py-24">
        <div className="pattern-dots pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Pilih Program <span className="text-brand-700">Pembelajaran</span>
            </h2>
            <p className="mt-4 text-slate-500">
              Setiap program dirancang khusus dengan kurikulum yang terstruktur dan metode pembelajaran yang telah terbukti efektif
            </p>
            <p className="mt-2 text-sm font-medium text-leaf-600">1 program tersedia</p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-[0_30px_80px_-20px_rgba(74,29,93,0.3)] lg:grid lg:grid-cols-[1.25fr_1fr]">
            <div className="relative p-8 lg:p-10">
              <div className="flex items-center justify-between">
                <span className="text-5xl font-extrabold text-brand-100">01</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-bold text-gold-700 ring-1 ring-gold-200">
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> Best Seller
                </span>
              </div>
              <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-brand-600 to-gold-400" />
              <h3 className="mt-5 text-2xl font-bold text-slate-900 md:text-3xl">{s.namaProgram}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Program perbaikan bacaan Al-Qur&apos;an secara private online. Santri dibimbing langsung oleh pengajar dengan
                metode talaqqi (pengajar mencontohkan, santri menirukan) dan koreksi bacaan secara detail di setiap pertemuan.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: Users, label: "Kapasitas Kelas", value: "Private (1 Santri)" },
                  { icon: CalendarCheck2, label: "Jumlah Pertemuan", value: `${pertemuan}x / bulan` },
                  { icon: Clock, label: "Durasi per Sesi", value: `${durasi} menit` },
                  { icon: CalendarClock, label: "Hari Belajar", value: s.hariBelajar },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
                      <d.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{d.label}</p>
                      <p className="truncate text-sm font-semibold text-slate-800">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-7 text-sm font-semibold text-slate-800">Materi yang dipelajari:</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {materi.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" /> {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-8 text-white lg:p-10">
              <div className="pattern-islamic pointer-events-none absolute inset-0" />
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold-400/20 blur-2xl" />
              <div className="relative">
                <p className="text-sm font-medium text-brand-200">Biaya Program</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">{rupiah(biaya)}</span>
                  <span className="pb-1 text-brand-200">/ bulan</span>
                </div>
                <p className="mt-1 text-sm text-gold-300">≈ {rupiah(perSesi)} per pertemuan</p>
                <ul className="mt-6 space-y-2.5 text-sm text-brand-50">
                  {[
                    `${pertemuan}x pertemuan @ ${durasi} menit`,
                    `Jadwal tetap ${s.hariBelajar}`,
                    "Gratis konsultasi & tes bacaan awal",
                    "Laporan progres tiap pertemuan",
                    "Rapor perkembangan bulanan",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2.5">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-400 text-brand-950">
                        <Check className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <PeriodePicker biaya={biaya} options={LAMA_BULAN_OPTIONS} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= JADWAL & ALUR ================= */}
      <section id="jadwal" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Jadwal Belajar</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              {pertemuan}x Pertemuan Sebulan, <span className="text-brand-700">{s.hariBelajar}</span>
            </h2>
            <p className="mt-4 text-slate-500">Belajar rutin 4 hari dalam sepekan dengan jam yang tetap agar bacaan terus terjaga.</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-4 gap-3 sm:grid-cols-7">
            {days.map((d) => (
              <div
                key={d.d}
                className={`rounded-2xl px-2 py-5 text-center ${
                  d.on ? "bg-gradient-to-b from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/25" : "border border-dashed border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <p className="text-sm font-bold">{d.d}</p>
                <p className={`mt-2 text-[11px] font-semibold uppercase tracking-wider ${d.on ? "text-gold-300" : ""}`}>{d.on ? "Belajar" : "Libur"}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              { icon: Clock, title: `${durasi} Menit / Pertemuan`, desc: "Durasi ideal untuk koreksi bacaan, latihan, dan evaluasi tanpa membuat santri lelah." },
              { icon: CalendarClock, title: "Pilih Jam 05.00 – 21.00 WIB", desc: "Jam belajar tetap setiap hari belajar, dipilih saat pendaftaran sesuai waktu luang santri." },
              { icon: RefreshCcw, title: "Pertemuan Pengganti", desc: "Jika berhalangan, sesi dapat diganti di hari lain sesuai kesepakatan dengan pengajar." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-20 max-w-5xl">
            <h3 className="text-center text-2xl font-bold text-slate-900">
              Alur <span className="text-brand-700">Pendaftaran</span>
            </h3>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {langkah.map((l, i) => (
                <div key={l.title} className="relative text-center">
                  {i < langkah.length - 1 && (
                    <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-brand-200 to-gold-200 lg:block" />
                  )}
                  <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-brand-700 shadow-lg ring-1 ring-brand-100">
                    <l.icon className="h-7 w-7" />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-bold text-brand-950">
                      {i + 1}
                    </span>
                  </div>
                  <h4 className="mt-4 font-semibold text-slate-900">{l.title}</h4>
                  <p className="mt-1 text-sm text-slate-500">{l.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONI ================= */}
      <section id="testimoni" className="bg-gradient-to-b from-brand-50/60 to-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Apa Kata Mereka</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Testimoni Tentang <span className="text-brand-700">{s.namaLembaga}</span>
            </h2>
            <p className="mt-4 text-slate-500">Santri dan wali santri telah merasakan manfaat belajar bersama {s.namaLembaga}</p>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {TESTIMONI.map((t) => (
              <div key={t.name} className="relative flex flex-col overflow-hidden rounded-2xl bg-white p-7 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)] ring-1 ring-slate-100">
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: t.color }} />
                <div className="flex items-center justify-between">
                  <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill={t.color}
                      d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
                    />
                  </svg>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                </div>
                <span
                  className="mt-4 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}12` }}
                >
                  {s.namaProgram}
                </span>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}bb)` }}
                  >
                    {t.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" /> {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Pertanyaan yang <span className="text-brand-700">Sering Diajukan</span>
            </h2>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white open:border-brand-200 open:shadow-lg open:shadow-brand-900/5" open={i === 0}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-800">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand-600 transition group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="kontak" className="bg-white px-5 pb-24 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] shadow-2xl">
          <Image src="/images/mosque.jpg" alt="Masjid" fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-800/60" />
          <div className="relative px-8 py-16 text-center md:px-16 md:py-20">
            <Sparkles className="mx-auto h-10 w-10 text-gold-300" />
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold text-white md:text-4xl">
              Mari Bergabung Menjadi Santri {s.namaLembaga}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-brand-100">
              Karena belajar mengaji itu mudah, asal dimulai. Bergabunglah bersama santri yang telah merasakan kemudahan
              belajar tahsin bersama kami.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-7 py-4 font-bold text-brand-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-gold-300"
              >
                Daftar Program <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={waGabung}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-7 py-[14px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <HeartHandshake className="h-5 w-5" /> Hubungi Kami
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500">
              Platform pembelajaran Tahsin Al-Qur&apos;an online untuk semua kalangan dengan metode yang terstruktur dan mudah dipahami.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-600" /> +{normalizeWa(s.noWa)}
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-600" /> {s.email}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {s.alamat}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Menu</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li><a href="#program" className="hover:text-brand-700">Program</a></li>
              <li><a href="#tentang" className="hover:text-brand-700">Tentang</a></li>
              <li><a href="#jadwal" className="hover:text-brand-700">Jadwal</a></li>
              <li><a href="#testimoni" className="hover:text-brand-700">Testimoni</a></li>
              <li><a href="#kontak" className="hover:text-brand-700">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Bantuan</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li><a href={waUmum} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">Hubungi Admin</a></li>
              <li><a href="#faq" className="hover:text-brand-700">FAQ</a></li>
              <li><Link href="/cek-progres" className="hover:text-brand-700">Cek Progres Santri</Link></li>
              <li><Link href="/daftar" className="hover:text-brand-700">Pendaftaran</Link></li>
              <li><Link href="/login" className="hover:text-brand-700">Login Admin / Pengajar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Ikuti Kami</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              <li><a href={s.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">YouTube</a></li>
              <li><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">Instagram</a></li>
              <li><a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-sm text-slate-500 md:flex-row lg:px-8">
            <p>© {new Date().getFullYear()} {s.namaLembaga}. Semua hak cipta dilindungi.</p>
            <p>
              {s.namaProgram} <span className="mx-1.5 text-slate-300">•</span> {s.hariBelajar}
            </p>
          </div>
        </div>
      </footer>

      <a
        href={waUmum}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp Admin"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-900/25 transition hover:scale-110"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
