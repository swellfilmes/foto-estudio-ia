"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const SW = {
  bg: "#0A0908",
  ember: "#E0742F",
  text: "#F4EFE6",
  t70: "rgba(244,239,230,0.7)",
  t55: "rgba(244,239,230,0.55)",
  t45: "rgba(244,239,230,0.45)",
  t35: "rgba(244,239,230,0.35)",
  line: "rgba(244,239,230,0.1)",
  surface: "rgba(22,18,15,0.6)",
};
const FONT = {
  archivo: "'Archivo', 'Manrope', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
const EMBER_GRAD = "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)";

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function SignInInner() {
  const search = useSearchParams();

  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Entrar — Swell Studio";
    const erro = search.get("erro");
    if (erro === "link-invalido") setError("Link expirado ou inválido. Peça um novo abaixo.");
    else if (erro === "acesso-expirado") setError("Sua assinatura não está mais ativa.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim().toLowerCase();
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
      const data = await readJson(res);
      if (!res.ok || data.error) {
        const msg = typeof data.error === "string" && data.error
          ? data.error
          : "Serviço indisponível no momento. Tente de novo em instantes.";
        throw new Error(msg);
      }
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar acesso");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: SW.bg, color: SW.text, fontFamily: FONT.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: 32 }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 30, width: "auto", display: "block" }} />
      </a>

      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 20 }}>BEM-VINDO DE VOLTA</div>
        <h1 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(36px, 4.4vw, 52px)", lineHeight: 0.94, letterSpacing: "-0.035em", margin: "0 0 18px" }}>
          Bem-vindo<br />de volta<span style={{ color: SW.ember }}>.</span>
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: SW.t55, margin: "0 0 30px" }}>
          Entre com o e-mail da sua assinatura para continuar criando.
        </p>

        {!magicSent ? (
          <form onSubmit={submit}>
            <div style={{ fontSize: 13, fontWeight: 600, color: SW.t70, marginBottom: 9 }}>E-mail da assinatura</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(244,239,230,0.05)", border: "1px solid rgba(244,239,230,0.12)", borderRadius: 14, padding: "0 18px" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 14, color: SW.t45 }}>@</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@exemplo.com" autoComplete="email" required style={{ flex: 1, background: "none", border: "none", padding: "15px 0", color: SW.text, fontSize: 15, outline: "none", fontFamily: FONT.body, minWidth: 0 }} />
            </div>

            {error && <div style={{ fontSize: 12, color: SW.ember, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>⚠ {error}</div>}

            <button type="submit" disabled={submitting} style={{ width: "100%", background: EMBER_GRAD, border: "none", color: "#0A0908", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, boxShadow: "0 12px 40px rgba(224,116,47,0.25)", marginTop: 18, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Enviando..." : "Enviar link de acesso →"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 22px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(244,239,230,0.1)" }} />
              <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.2em", color: SW.t45 }}>ACESSO SEGURO, SEM SENHA</div>
              <div style={{ flex: 1, height: 1, background: "rgba(244,239,230,0.1)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.6, color: SW.t45 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>🔒</span>
              <span>Enviamos um link mágico que vale por 15 minutos. Ainda não assina?{" "}
                <a href="/#planos" style={{ color: SW.ember }}>Ver planos →</a>
              </span>
            </div>
          </form>
        ) : (
          <div style={{ border: `1px solid ${SW.line}`, borderRadius: 18, padding: 26, background: SW.surface }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>✉️</div>
            <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Verifique seu e-mail</div>
            <div style={{ fontSize: 13, color: SW.t55, lineHeight: 1.6, marginBottom: 20 }}>
              Se <strong style={{ color: SW.text }}>{email}</strong> tem uma assinatura ativa, você recebeu um link de acesso. Ele vale por 15 minutos.<br /><br />
              Não chegou em 1 minuto? Veja a caixa de <strong style={{ color: SW.text }}>spam</strong>, ou fale com a gente em <a href="mailto:contato@swellfilmes.com.br" style={{ color: SW.ember }}>contato@swellfilmes.com.br</a>.
            </div>
            <button type="button" onClick={() => { setMagicSent(false); setEmail(""); }} style={{ background: "none", color: SW.t55, border: `1px solid ${SW.line}`, borderRadius: 12, padding: "11px 18px", fontSize: 13, cursor: "pointer", fontFamily: FONT.body }}>
              Usar outro e-mail
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: SW.t35 }}>
        <a href="/" style={{ color: SW.t35 }}>← Voltar para a home</a>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0A0908" }} />}>
      <SignInInner />
    </Suspense>
  );
}
