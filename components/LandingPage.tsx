"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LandingInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/studio";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Foto Estúdio IA — Swell Filmes";
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Informe seu e-mail");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível liberar o acesso");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            Swell Filmes
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "var(--text)", marginBottom: 12, lineHeight: 1.15 }}>
            Foto de estúdio<br />sem estúdio.
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 8 }}>
            Você tira a foto do produto no celular ou envia a peça de roupa. A IA gera a foto pronta para catálogo, feed de Instagram e anúncio — em 30–60 segundos.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <Feature icon="📸" title="Produtos: bebida, alimento, cosmético, artesanal, acessório" />
          <Feature icon="👕" title="Pessoas vestindo: e-commerce, lifestyle, UGC, editorial" />
          <Feature icon="⚡" title="4 variações por geração, resultado em ~1 minuto" />
        </div>

        <form
          onSubmit={submit}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>
            Testar grátis agora
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você quer ser chamado"
            style={inputStyle}
            autoComplete="name"
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginTop: 14, marginBottom: 6, color: "var(--text)" }}>E-mail</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="voce@exemplo.com"
            style={inputStyle}
            autoComplete="email"
            required
          />

          {error && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: 18,
              background: submitting ? "var(--surface2)" : "var(--accent)",
              color: submitting ? "var(--text-muted)" : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Liberando acesso…" : "Entrar no estúdio →"}
          </button>

          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
            Ao entrar você libera o teste. Sem cartão. Sem spam.<br />
            Guardamos o e-mail só para te avisar quando lançar a versão paga.
          </p>
        </form>

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, textAlign: "center" }}>
          Feito por Swell Filmes · <a href="mailto:filmesswell@gmail.com" style={{ color: "var(--text-muted)" }}>filmesswell@gmail.com</a>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "11px 13px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

function Feature({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)" }}>
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
      <span>{title}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <LandingInner />
    </Suspense>
  );
}
