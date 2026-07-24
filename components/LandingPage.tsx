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
    document.title = "Swell Studio — Ensaios e fotos de produto por IA";
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

  const isTrial = tab === "trial";

  return (
    <div style={{ minHeight: "100vh", background: SW.bg, color: SW.text, fontFamily: FONT.body, overflowX: "hidden" }}>
      <main style={MAIN}>
        {/* ============ Coluna esquerda: marca + captura ============ */}
        <div style={LEFT_COL}>
          {/* marca */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>
              Swell<span style={{ color: SW.ember }}>.</span>
            </div>
            <div style={MONO_LABEL}>SWELL STUDIO</div>
          </div>

          {/* bloco central */}
          <div style={{ maxWidth: 420, width: "100%" }}>
            {/* toggle trial / assinante */}
            <div style={{ display: "flex", gap: 4, marginBottom: 26 }}>
              <ToggleBtn active={isTrial} onClick={() => { setTab("trial"); setError(null); }}>Testar grátis</ToggleBtn>
              <ToggleBtn active={!isTrial} onClick={() => { setTab("signin"); setError(null); }}>Já sou assinante</ToggleBtn>
            </div>

            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 20 }}>
              {isTrial ? "SEU ESTÚDIO, SEM COMPLICAÇÃO" : "BEM-VINDO DE VOLTA"}
            </div>
            <h1 style={H1}>
              {isTrial ? <>Ensaio de estúdio<br /><span style={{ color: SW.ember }}>sem estúdio.</span></>
                       : <>Bem-vindo<br />de volta<span style={{ color: SW.ember }}>.</span></>}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: SW.text55, margin: "0 0 30px" }}>
              {isTrial
                ? "Envie fotos, escolha um estilo do catálogo Swell e receba fotos com cara de ensaio profissional em minutos."
                : "Entre com o e-mail da sua assinatura para continuar criando."}
            </p>

            {/* ---- FORM TRIAL ---- */}
            {isTrial && (
              <form onSubmit={submitTrial}>
                <FieldLabel>Seu nome</FieldLabel>
                <InputShell>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você quer ser chamado" autoComplete="name" style={INPUT} />
                </InputShell>
                <div style={{ height: 14 }} />
                <FieldLabel>Seu e-mail</FieldLabel>
                <InputShell prefix="@">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@suamarca.com" autoComplete="email" required style={INPUT} />
                </InputShell>

                {error && <ErrorLine>{error}</ErrorLine>}

                <button type="submit" disabled={submitting} style={{ ...EMBER_BTN, marginTop: 18, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Liberando..." : "Entrar no teste grátis →"}
                </button>
                <Divider>ACESSO SEGURO, SEM COMPLICAÇÃO</Divider>
                <Reassure>Guardamos só seu e-mail para te avisar sobre o lançamento. Sem cartão, sem compromisso.</Reassure>
              </form>
            )}

            {/* ---- FORM SIGNIN ---- */}
            {!isTrial && !magicSent && (
              <form onSubmit={submitSignin}>
                <FieldLabel>E-mail da assinatura</FieldLabel>
                <InputShell prefix="@">
                  <input value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} type="email" placeholder="voce@exemplo.com" autoComplete="email" required style={INPUT} />
                </InputShell>

                {error && <ErrorLine>{error}</ErrorLine>}

                <button type="submit" disabled={submitting} style={{ ...EMBER_BTN, marginTop: 18, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Enviando..." : "Enviar link de acesso →"}
                </button>
                <Divider>ACESSO SEGURO, SEM SENHA</Divider>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.6, color: SW.text45 }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>🔒</span>
                  <span>Enviamos um link mágico que vale por 15 minutos. Ainda não assina?{" "}
                    <a href="https://kiwify.com.br" target="_blank" rel="noopener noreferrer" style={{ color: SW.ember }}>Ver planos →</a>
                  </span>
                </div>
              </form>
            )}

            {/* ---- MAGIC SENT ---- */}
            {!isTrial && magicSent && (
              <div style={{ border: `1px solid ${SW.line}`, borderRadius: 18, padding: 26, background: SW.surface }}>
                <div style={{ fontSize: 34, marginBottom: 12 }}>✉️</div>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Verifique seu e-mail</div>
                <div style={{ fontSize: 13, color: SW.text55, lineHeight: 1.6, marginBottom: 20 }}>
                  Se <strong style={{ color: SW.text }}>{signinEmail}</strong> tem uma assinatura ativa, você recebeu um link de acesso. Ele vale por 15 minutos.
                </div>
                <button type="button" onClick={() => { setMagicSent(false); setSigninEmail(""); }}
                  style={{ background: "none", color: SW.text55, border: `1px solid ${SW.line}`, borderRadius: 12, padding: "11px 18px", fontSize: 13, cursor: "pointer", fontFamily: FONT.body }}>
                  Usar outro e-mail
                </button>
              </div>
            )}
          </div>

          {/* rodapé */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: SW.text35 }}>
            <span>© 2026 Swell Filmes</span>
            <span><a href="mailto:contato@swellfilmes.com.br" style={{ color: SW.text35 }}>contato@swellfilmes.com.br</a></span>
          </div>
        </div>

        {/* ============ Coluna direita: showcase ============ */}
        <div style={SHOWCASE}>
          <div style={CHIP}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: SW.ember, display: "inline-block" }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: SW.ember }}>FEITO NA SWELL</span>
          </div>

          <div style={{ marginTop: "clamp(24px, 4vh, 48px)" }}>
            <div style={{ fontFamily: FONT.archivo, fontSize: "clamp(28px, 2.9vw, 42px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              “A foto do celular entra.<br /><span style={{ color: SW.ember }}>A campanha sai pronta.</span>”
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.text45, marginTop: 16 }}>
              FIDELIDADE DE PRODUTO · DIREÇÃO DE ARTE SWELL · ZERO PROMPT
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", minHeight: 240 }}>
            <div style={ORB} />
            <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%) rotate(180deg)", writingMode: "vertical-rl", fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.24em", color: SW.text35 }}>
              SEU PRODUTO / CAMPANHA 01
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <div style={GLASS_CARD}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.2em", color: SW.ember, marginBottom: 8 }}>✓ PRODUTO FIEL</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>Pronto para publicar</div>
              <div style={{ fontSize: 12, color: SW.text55 }}>8 fotos geradas · em minutos</div>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: SW.text35 }}>LUZ NATURAL · 4:5 · FEED</div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ===================== estilo (tokens do protótipo) ===================== */
const SW = {
  bg: "#0A0908",
  ember: "#E0742F",
  text: "#F4EFE6",
  text70: "rgba(244,239,230,0.7)",
  text55: "rgba(244,239,230,0.55)",
  text45: "rgba(244,239,230,0.45)",
  text35: "rgba(244,239,230,0.35)",
  line: "rgba(244,239,230,0.1)",
  surface: "rgba(22,18,15,0.6)",
};
const FONT = {
  archivo: "'Archivo', 'Manrope', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const MAIN: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "minmax(340px, 470px) minmax(0, 1fr)",
  gap: "clamp(24px, 3vw, 56px)",
  padding: "24px clamp(20px, 3vw, 44px)",
  boxSizing: "border-box",
  animation: "sw-riseIn 800ms cubic-bezier(0.22,1,0.36,1) both",
};
const LEFT_COL: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 32,
  padding: "16px 0",
  minHeight: "calc(100vh - 48px)",
  boxSizing: "border-box",
};
const MONO_LABEL: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.text45 };
const H1: React.CSSProperties = { fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(40px, 4.4vw, 58px)", lineHeight: 0.94, letterSpacing: "-0.035em", margin: "0 0 18px" };
const EMBER_BTN: React.CSSProperties = {
  width: "100%",
  background: "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)",
  border: "none",
  color: "#0A0908",
  borderRadius: 14,
  padding: 16,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT.body,
  boxShadow: "0 12px 40px rgba(224,116,47,0.25)",
};
const INPUT: React.CSSProperties = { flex: 1, background: "none", border: "none", padding: "15px 0", color: SW.text, fontSize: 15, outline: "none", fontFamily: FONT.body, minWidth: 0 };

const SHOWCASE: React.CSSProperties = {
  position: "relative",
  borderRadius: 28,
  overflow: "hidden",
  background: "radial-gradient(ellipse 80% 70% at 70% 60%, #201A12 0%, #12100C 55%, #0D0B09 100%)",
  border: `1px solid rgba(244,239,230,0.07)`,
  padding: "clamp(28px, 3.6vw, 52px)",
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100vh - 48px)",
  boxSizing: "border-box",
};
const CHIP: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid rgba(224,116,47,0.4)`, borderRadius: 999, padding: "7px 15px", alignSelf: "flex-start" };
const ORB: React.CSSProperties = {
  position: "absolute",
  right: "clamp(12px, 6%, 80px)",
  top: "50%",
  transform: "translateY(-48%)",
  width: "min(52vh, 420px, 80%)",
  aspectRatio: "1 / 1",
  borderRadius: "50%",
  background: "radial-gradient(circle at 38% 34%, #E0742F 0%, #B5561C 34%, #2A1D12 72%, #150F0B 100%)",
  boxShadow: "0 0 140px rgba(224,116,47,0.22), 0 40px 120px rgba(0,0,0,0.5)",
  border: `1px solid rgba(244,239,230,0.08)`,
};
const GLASS_CARD: React.CSSProperties = { background: "rgba(16,13,11,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid rgba(244,239,230,0.1)`, borderRadius: 16, padding: "16px 20px" };

/* ===================== subcomponentes ===================== */
function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: active ? "rgba(224,116,47,0.12)" : "transparent",
      border: `1px solid ${active ? "rgba(224,116,47,0.4)" : "rgba(244,239,230,0.12)"}`,
      color: active ? SW.ember : SW.text55,
      borderRadius: 999,
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: FONT.body,
      transition: "all 200ms",
    }}>{children}</button>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: SW.text70, marginBottom: 9 }}>{children}</div>;
}
function InputShell({ children, prefix }: { children: React.ReactNode; prefix?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(244,239,230,0.05)", border: `1px solid rgba(244,239,230,0.12)`, borderRadius: 14, padding: "0 18px" }}>
      {prefix && <span style={{ fontFamily: FONT.mono, fontSize: 14, color: SW.text45 }}>{prefix}</span>}
      {children}
    </div>
  );
}
function ErrorLine({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: SW.ember, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>⚠ {children}</div>;
}
function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 22px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(244,239,230,0.1)" }} />
      <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.2em", color: SW.text45 }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: "rgba(244,239,230,0.1)" }} />
    </div>
  );
}
function Reassure({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.6, color: SW.text45 }}><span style={{ flexShrink: 0 }}>🛡</span><span>{children}</span></div>;
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0A0908" }} />}>
      <LandingInner />
    </Suspense>
  );
}
