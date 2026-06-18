import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foto Estúdio IA — Swell",
  description: "Gere prompts de foto de produto com qualidade de estúdio em segundos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
