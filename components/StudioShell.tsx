"use client";

import { useState } from "react";
import PromptGenerator from "./PromptGenerator";
import EnsaioStudio from "./EnsaioStudio";

type Mode = "product" | "ensaio" | null;

export default function StudioShell() {
  const [mode, setMode] = useState<Mode>(null);

  if (mode === "product") {
    return <PromptGenerator onBack={() => setMode(null)} />;
  }
  if (mode === "ensaio") {
    return <EnsaioStudio onBack={() => setMode(null)} />;
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Swell Filmes
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1.15 }}>
          O que você quer criar hoje?
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Escolha o modo. Você pode trocar depois.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ModeCard
          icon="📸"
          title="Ensaio de Pessoa"
          desc="Fotos de referência viram um ensaio nível Swell — 8 fotos em estilo cinemático."
          bullets={["Catálogo de 8 estilos curados", "Editorial · Street · Praia · Rooftop · Corporativo · Fashion · Café · Natureza"]}
          onClick={() => setMode("ensaio")}
        />
        <ModeCard
          icon="📦"
          title="Foto de Produto"
          desc="Sobe as fotos do produto e escolhe o tipo — estúdio, mostruário, comercial, com modelo."
          bullets={["Análise automática · você só confirma", "Estúdio · Mostruário · Comercial · CG · Com modelo"]}
          onClick={() => setMode("product")}
        />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 32, textAlign: "center", lineHeight: 1.6 }}>
        Cada modo tem uma direção de arte própria — as fotos saem no jeito Swell, seja pessoa ou produto.
      </p>
    </div>
  );
}

function ModeCard({ icon, title, desc, bullets, onClick }: {
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "24px 20px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {bullets.map((b, i) => (
          <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.02em" }}>
            · {b}
          </div>
        ))}
      </div>
    </button>
  );
}
