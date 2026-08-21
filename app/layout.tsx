import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Contentsquare } from "./contentsquare";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swell Studio — Ensaios e fotos de produto por IA",
  description: "Ensaio com cara de estúdio, sem estúdio. Direção de arte Swell.",
};

// Pixel do Meta Ads (Swell Studio). O mesmo id vai em META_PIXEL_ID (servidor) para a
// API de Conversões — os dois lados precisam apontar pro MESMO conjunto de dados.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1040385058861312";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Verificação de domínio do Meta (Business Manager) */}
        <meta name="facebook-domain-verification" content="nhiagrlo3fdccrsed1vtewyxm7qian" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap"
        />
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      </head>
      <body className="min-h-screen">
        {children}
        <Contentsquare />
        <Analytics />
        {/* Meta Pixel — fallback sem JS */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
