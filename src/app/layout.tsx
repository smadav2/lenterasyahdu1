import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lentera Syahdu - Kelas Tahsin Online | Belajar Al-Qur'an dari Rumah",
    template: "%s | Lentera Syahdu",
  },
  description:
    "Lentera Syahdu adalah platform belajar Tahsin Al-Qur'an online bersama pengajar berpengalaman. 18x pertemuan per bulan, 60 menit per pertemuan, Senin - Kamis.",
  keywords: [
    "lentera syahdu",
    "kelas tahsin online",
    "belajar mengaji online",
    "ngaji online",
    "belajar tajwid",
    "guru ngaji online",
    "tahsin al-quran",
  ],
  openGraph: {
    title: "Lentera Syahdu - Kelas Tahsin Online",
    description: "Menerangi hati dengan cahaya Al-Qur'an. Belajar tahsin online bersama pengajar berpengalaman.",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a1d5d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
