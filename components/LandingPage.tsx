"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "signin" | "trial";

function LandingInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/studio";

  const [tab, setTab] = useState<Tab>("trial");

  // Trial (captura de lead)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Sign-in por e-mail (magic link)
  const [signinEmail, setSigninEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Swell — Ensaios e fotos de produto por IA";
    const erro = search.get("erro");
    if (erro === "link-invalido") setError("Link expirado ou inválido. Peça um novo abaixo.");
    else if (erro === "acesso-expirado") setError("Sua assinatura não está mais ativa.");
    if (erro) setTab("signin");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitTrial(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Informe seu e-mail"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source: "landing-trial" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível liberar o teste");
      setSubmitting(false);
    }
  }

  async function submitSignin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = signinEmail.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Informe um e-mail válido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar acesso");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>

        {/* Coluna esquerda: proposta */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            Swell Filmes
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: "var(--text)", marginBottom: 16, lineHeight: 1.1 }}>
            Ensaio de estúdio<br />
            <span style={{ color: "var(--accent)" }}>sem estúdio.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
            Envie fotos de referência. Escolha um estilo do catálogo Swell. Receba <strong style={{ color: "var(--text)" }}>8 fotos com cara de ensaio profissional</strong> em minutos — sem fotógrafo, sem sessão, sem edição.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <Feature icon="📸" title="Ensaio de pessoa" desc="Editorial, street, praia, rooftop, corporativo, fashion, café, natureza" />
            <Feature icon="📦" title="Foto de produto" desc="Bebida, alimento, cosmético, artesanal — 4 variações por foto de celular" />
            <Feature icon="⚡" title="Rápido" desc="Ensaio completo em 3–5 minutos, pronto pra baixar" />
          </div>

          <div style={{ padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>Direção de arte Swell.</strong> Cada estilo do catálogo tem luz, cor, wardrobe e mood curados pela nossa equipe — o resultado não sai com &quot;cara de IA&quot;, sai com cara de foto real.
          </div>
        </div>

        {/* Coluna direita: acesso */}
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            {/* Tabs */}
            <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 4, padding: 3, marginBottom: 20 }}>
              <TabButton active={tab === "trial"} onClick={() => { setTab("trial"); setError(null); }}>
                Testar grátis
              </TabButton>
              <TabButton active={tab === "signin"} onClick={() => { setTab("signin"); setError(null); }}>
                Já sou assinante
              </TabButton>
            </div>

            {tab === "trial" && (
              <form onSubmit={submitTrial}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Teste o estúdio antes de assinar. Sem cartão, sem compromisso.
                </div>

                <label style={labelStyle}>Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você quer ser chamado" style={inputStyle} autoComplete="name" />

                <label style={{ ...labelStyle, marginTop: 14 }}>E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@exemplo.com" style={inputStyle} autoComplete="email" required />

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...primaryButton, marginTop: 18, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Liberando..." : "Entrar no teste grátis →"}
                </button>

                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
                  Guardamos só seu e-mail pra te avisar sobre o lançamento.
                </p>
              </form>
            )}

            {tab === "signin" && !magicSent && (
              <form onSubmit={submitSignin}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Digite o e-mail da sua assinatura. Enviamos um link seguro pra você entrar.
                </div>

                <label style={labelStyle}>E-mail da assinatura</label>
                <input
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  style={inputStyle}
                  required
                />

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...primaryButton, marginTop: 18, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Enviando..." : "Enviar link de acesso →"}
                </button>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                    Ainda não assina?
                  </div>
                  <a
                    href="https://kiwify.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 4, padding: "10px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                  >
                    Ver planos de assinatura →
                  </a>
                </div>
              </form>
            )}

            {tab === "signin" && magicSent && (
              <div style={{ textAlign: "center", padding: "20px 4px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  Verifique seu e-mail
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
                  Se <strong style={{ color: "var(--text)" }}>{signinEmail}</strong> tem uma assinatura ativa, você recebeu um link de acesso. O link vale por 15 minutos.
                </div>
                <button
                  type="button"
                  onClick={() => { setMagicSent(false); setSigninEmail(""); }}
                  style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 18px", fontSize: 13, cursor: "pointer" }}
                >
                  Usar outro e-mail
                </button>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 4, color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16, textAlign: "center" }}>
            Feito por Swell Filmes · <a href="mailto:contato@swellfilmes.com.br" style={{ color: "var(--text-muted)" }}>contato@swellfilmes.com.br</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "11px 13px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
const primaryButton: React.CSSProperties = {
  width: "100%",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "13px 20px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? "var(--surface)" : "transparent",
        border: "none",
        borderRadius: 2,
        padding: "10px 12px",
        fontSize: 13,
        fontWeight: 600,
        color: active ? "var(--text)" : "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ fontSize: 20, width: 24, textAlign: "center", flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
      </div>
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
