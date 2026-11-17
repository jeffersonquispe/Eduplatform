import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { AssistantWidget } from "@/components/assistant-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Solo el taller del inicio usa la fuente mono: sin precarga se descarga unicamente si hay texto que la pida.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma de cursos de marketing digital e IA",
    template: "%s | EduTech",
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
        <a href="#contenido" className="eb-skip">
          Saltar al contenido
        </a>
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>{children}</Suspense>
        {/* usePathname puede suspender con cacheComponents: su propio limite no bloquea el resto. */}
        <Suspense fallback={null}>
          <AssistantWidget />
        </Suspense>
      </body>
    </html>
  );
}
