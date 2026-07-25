"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";

const EMBER = "#E0742F";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const mono = (size: number, spacing = 0.18): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace", fontSize: size, letterSpacing: `${spacing}em`,
});
const display: React.CSSProperties = { fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" };

interface Gen {
  id: number;
  style: string;
  label: string | null;
  images: string[];
  note: string | null;
  created_at: string;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
      " · " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    ).toUpperCase();
  } catch {
    return "";
  }
}

export default function GaleriaPage() {
  const [gens, setGens] = useState<Gen[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Galeria — Swell Studio";
    fetch("/api/generations")
      .then((r) => r.json())
      .then((d) => { setGens(Array.isArray(d.generations) ? d.generations : []); setEmail(d.email ?? null); })
      .catch(() => { /* silencioso */ })
      .finally(() => setLoading(false));
  }, []);

  const total = gens.reduce((n, g) => n + g.images.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0908", color: FOAM, fontFamily: "'Hanken Grotesk', sans-serif" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(20px, 4vw, 48px)", background: "rgba(10,9,8,0.72)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", borderBottom: `1px solid ${foam(0.08)}` }}>
        <a href="/studio" style={{ display: "flex", alignItems: "baseline", gap: 14, textDecoration: "none" }}>
          <span style={{ ...display, fontSize: 19, letterSpacing: "-0.02em", color: FOAM }}>Swell<span style={{ color: EMBER }}>.</span></span>
          <span style={{ ...mono(10, 0.22), color: foam(0.45) }}>GALERIA</span>
        </a>
        <a href="/studio" style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={14} />Voltar ao estúdio
        </a>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(32px, 5vh, 60px) clamp(20px, 4vw, 48px) 100px" }}>
        <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 12 }}>SUAS GERAÇÕES</div>
        <h1 style={{ ...display, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 0.95, margin: "0 0 10px" }}>
          Galeria<span style={{ color: EMBER }}>.</span>
        </h1>
        <div style={{ ...mono(9, 0.14), color: email ? foam(0.5) : "#C28A1E", marginBottom: 40, wordBreak: "break-all" }}>
          {email ? `${total} FOTO${total === 1 ? "" : "S"} · ${email.toUpperCase()}` : "SEM SESSÃO — FAÇA LOGIN PARA VER SEU HISTÓRICO"}
        </div>

        {loading && <div style={{ fontSize: 14, color: foam(0.45), textAlign: "center", padding: "60px 0" }}>Carregando seu histórico…</div>}
        {!loading && email && gens.length === 0 && (
          <div style={{ fontSize: 14, color: foam(0.45), textAlign: "center", padding: "60px 0" }}>
            Nada por aqui ainda — tudo que você gerar fica salvo aqui, pra sempre.
          </div>
        )}

        {!loading && gens.map((g) => (
          <div key={g.id} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{g.label || g.style}</span>
              <span style={{ ...mono(9, 0.16), color: foam(0.4) }}>{formatWhen(g.created_at)}</span>
            </div>
            {g.note && <div style={{ fontSize: 12, color: foam(0.5), fontStyle: "italic", marginBottom: 12 }}>com o seu pedido: “{g.note}”</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {g.images.map((src, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${foam(0.1)}`, background: "#14110F" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: "100%", display: "block" }} />
                  <a href={`/api/download?u=${encodeURIComponent(src)}&name=swell-${g.style}-${i + 1}.jpg`}
                    style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(10,9,8,0.7)", backdropFilter: "blur(8px)", color: FOAM, borderRadius: 8, padding: "6px 11px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                    <Download size={11} />Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
