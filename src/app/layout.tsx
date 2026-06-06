import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Danusan — Sistem Konsinyasi USM",
  description:
    "Sistem pemantau stok dan konsinyasi (titip jual) jajanan kampus Universitas Semarang. Kelola produk, distribusi, penjualan, dan setoran secara real-time.",
  keywords: ["danusan", "konsinyasi", "USM", "Universitas Semarang", "stok", "titip jual"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
