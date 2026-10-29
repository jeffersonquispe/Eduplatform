import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma de cursos de marketing digital e IA",
    template: "%s | Plataforma de cursos",
  },
  description: "Aprende marketing digital e inteligencia artificial con cursos de instructores expertos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="h-[49px] border-b border-zinc-200 dark:border-zinc-800" />}>
          <SiteHeader />
        </Suspense>
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>{children}</Suspense>
      </body>
    </html>
  );
}
