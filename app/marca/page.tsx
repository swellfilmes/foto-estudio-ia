"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { BrandForm, loadBrand, saveBrand, emptyBrand, type BrandProfile } from "@/components/BrandForm";

const EMBER = "#E0742F";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const mono = (size: number, spacing = 0.2): React.CSSProperties => ({ fontFamily: "'IBM Plex Mono', monospace", fontSize: size, letterSpacing: `${spacing}em` });
const display: React.CSSProperties = { fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.035em" };

export default function MarcaPage() {
  const [brand, setBrand] = useState<BrandProfile>(emptyBrand);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = "Minha marca — Swell Studio";
    setBrand(loadBrand());
    setReady(true);
  }, []);

  const onSave = (b: BrandProfile) => {
    saveBrand(b);
    setBrand(b);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0908", color: FOAM, fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(20px, 4vw, 48px)", background: "rgba(10,9,8,0.72)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", borderBottom: `1px solid ${foam(0.08)}` }}>
        <a href="/studio" style={{ display: "flex", alignItems: "baseline", gap: 14, textDecoration: "none" }}>
          <span style={{ ...display, fontSize: 19, letterSpacing: "-0.02em", color: FOAM }}>Swell<span style={{ color: EMBER }}>.</span></span>
          <span style={{ ...mono(10, 0.22), color: foam(0.45) }}>MINHA MARCA</span>
        </a>
        <a href="/studio" style={{ display: "flex", alignItems: "center", gap: 8, background: foam(0.05), border: `1px solid ${foam(0.14)}`, color: FOAM, borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={14} />Voltar ao estúdio
        </a>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(32px, 5vh, 60px) clamp(20px, 4vw, 48px) 100px" }}>
        <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 12 }}>O SEU DIFERENCIAL</div>
        <h1 style={{ ...display, fontSize: "clamp(34px, 5vw, 54px)", lineHeight: 0.95, margin: "0 0 14px" }}>
          Sua marca,<br />no comando<span style={{ color: EMBER }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: foam(0.6), margin: "0 0 36px", maxWidth: "52ch" }}>
          Não é só gerar foto bonita — é manter <strong style={{ color: FOAM }}>toda a sua marca consistente</strong>. Defina uma vez e cada foto nasce com a sua identidade: logo, paleta, cenário e o que nunca deve aparecer.
        </p>

        <div style={{ background: "rgba(22,18,15,0.6)", border: `1px solid ${foam(0.09)}`, borderRadius: 22, padding: "clamp(22px, 3vw, 34px)", boxShadow: "0 30px 90px rgba(0,0,0,0.4)" }}>
          {ready && <BrandForm brand={brand} onSave={onSave} />}
        </div>

        {saved && (
          <div style={{ position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 60, display: "flex", alignItems: "center", gap: 9, background: "rgba(224,116,47,0.16)", border: `1px solid ${EMBER}`, color: FOAM, borderRadius: 999, padding: "12px 20px", fontSize: 14, fontWeight: 700, backdropFilter: "blur(10px)", boxShadow: "0 14px 50px rgba(0,0,0,0.5)", animation: "riseIn 300ms ease both" }}>
            <Check size={16} color={EMBER} />Marca salva!
          </div>
        )}
      </main>
    </div>
  );
}
