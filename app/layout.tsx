import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swell Studio — Ensaios e fotos de produto por IA",
  description: "Ensaio com cara de estúdio, sem estúdio. Direção de arte Swell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap"
        />
      </head>
      <body className="min-h-screen">{children}<Analytics /></body>
    </html>
  );
}
