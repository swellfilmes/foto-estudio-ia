"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Info, ShieldCheck } from "lucide-react";

// ── Design do protótipo (Claude Design) — landing/login Estúdio Swell ────────
const EMBER = "#E0742F";
const INK = "#0A0908";
const FOAM = "#F4EFE6";
const foam = (a: number) => `rgba(244,239,230,${a})`;
const ember = (a: number) => `rgba(224,116,47,${a})`;
const mono = (size: number, spacing = 0.18): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: size,
  letterSpacing: `${spacing}em`,
});
const display: React.CSSProperties = { fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.035em" };

type Tab = "signin" | "trial";

function LandingInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/studio";

  const [tab, setTab] = useState<Tab>("trial");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroOk, setHeroOk] = useState(true);

  useEffect(() => {
    document.title = "Swell — Ensaios e fotos de produto por IA";
    const erro = search.get("erro");
    if (!erro) return;
    const t = setTimeout(() => {
      if (erro === "link-invalido") setError("Link expirado ou inválido. Peça um novo abaixo.");
      else if (erro === "acesso-expirado") setError("Sua assinatura não está mais ativa.");
      setTab("signin");
    }, 0);
    return () => clearTimeout(t);
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

  const inputWrap: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12, background: foam(0.05),
    border: `1px solid ${foam(0.12)}`, borderRadius: 14, padding: "0 18px", marginBottom: 14,
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, background: "none", border: "none", padding: "15px 0", color: FOAM,
    fontSize: 15, outline: "none", fontFamily: "'Hanken Grotesk', sans-serif", minWidth: 0,
  };
  const gradientCta: React.CSSProperties = {
    width: "100%", background: "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)", border: "none",
    color: INK, borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Hanken Grotesk', sans-serif", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, boxShadow: "0 12px 40px rgba(224,116,47,0.25)",
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "clamp(24px, 3vw, 56px)", padding: "24px clamp(20px, 3vw, 44px)", boxSizing: "border-box", maxWidth: 1280, margin: "0 auto", animation: "riseIn 800ms cubic-bezier(0.22,1,0.36,1) both" }}>

        {/* Coluna esquerda: logo + formulário + rodapé */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px 0", minHeight: "calc(100vh - 48px)", boxSizing: "border-box", maxWidth: 470 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ ...display, fontSize: 22, letterSpacing: "-0.02em" }}>Swell<span style={{ color: EMBER }}>.</span></div>
            <div style={{ ...mono(10, 0.22), color: foam(0.45) }}>FOTO ESTÚDIO IA</div>
          </div>

          <div style={{ maxWidth: 400 }}>
            <div style={{ ...mono(11, 0.24), color: EMBER, marginBottom: 20 }}>SEU ESTÚDIO, SEM COMPLICAÇÃO</div>
            <h1 style={{ ...display, fontSize: "clamp(40px, 4.4vw, 58px)", lineHeight: 0.94, margin: "0 0 18px" }}>
              {tab === "trial" ? <>Seu produto,<br />pronto pra vender</> : <>Bem-vindo<br />de volta</>}<span style={{ color: EMBER }}>.</span>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: foam(0.55), margin: "0 0 28px" }}>
              {tab === "trial"
                ? "A foto do celular entra. A campanha sai pronta — sem fotógrafo, sem estúdio, sem prompt."
                : "Entre para continuar criando fotos profissionais dos seus produtos."}
            </p>

            {/* Abas */}
            <div style={{ display: "inline-flex", background: foam(0.05), border: `1px solid ${foam(0.1)}`, borderRadius: 999, padding: 3, marginBottom: 26 }}>
              {([["trial", "Testar grátis"], ["signin", "Já sou assinante"]] as const).map(([key, labelTxt]) => (
                <button key={key} type="button" onClick={() => { setTab(key); setError(null); }}
                  style={{ background: tab === key ? foam(0.1) : "transparent", border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: tab === key ? FOAM : foam(0.5), cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif", transition: "all 200ms" }}>
                  {labelTxt}
                </button>
              ))}
            </div>

            {tab === "trial" && (
              <form onSubmit={submitTrial}>
                <div style={{ fontSize: 13, fontWeight: 600, color: foam(0.7), marginBottom: 9 }}>Seu nome</div>
                <div style={inputWrap}>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você quer ser chamado" autoComplete="name" style={inputStyle} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: foam(0.7), marginBottom: 9 }}>Seu e-mail</div>
                <div style={inputWrap}>
                  <span style={{ ...mono(14, 0), color: foam(0.4) }}>@</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@suamarca.com" autoComplete="email" required style={inputStyle} />
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: EMBER, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={13} />{error}
                  </div>
                )}
                <button type="submit" disabled={submitting} style={{ ...gradientCta, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Liberando…" : "Entrar no teste grátis"}<ArrowRight size={16} />
                </button>
                <p style={{ fontSize: 12, color: foam(0.45), marginTop: 14, lineHeight: 1.6, textAlign: "center" }}>
                  Sem cartão, sem compromisso. Guardamos só seu e-mail.
                </p>
              </form>
            )}

            {tab === "signin" && !magicSent && (
              <form onSubmit={submitSignin}>
                <div style={{ fontSize: 13, fontWeight: 600, color: foam(0.7), marginBottom: 9 }}>Seu e-mail</div>
                <div style={inputWrap}>
                  <span style={{ ...mono(14, 0), color: foam(0.4) }}>@</span>
                  <input value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} type="email" placeholder="voce@suamarca.com" autoComplete="email" required style={inputStyle} />
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: EMBER, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={13} />{error}
                  </div>
                )}
                <button type="submit" disabled={submitting} style={{ ...gradientCta, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Enviando…" : "Continuar com e-mail"}<ArrowRight size={16} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0 22px" }}>
                  <div style={{ flex: 1, height: 1, background: foam(0.1) }} />
                  <div style={{ ...mono(9, 0.2), color: foam(0.4) }}>ACESSO SEGURO, SEM SENHA</div>
                  <div style={{ flex: 1, height: 1, background: foam(0.1) }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, lineHeight: 1.6, color: foam(0.45) }}>
                  <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Enviaremos um link mágico pro e-mail da sua assinatura. Ele vale por 15 minutos.</span>
                </div>
              </form>
            )}

            {tab === "signin" && magicSent && (
              <div style={{ background: foam(0.04), border: `1px solid ${foam(0.1)}`, borderRadius: 18, padding: "26px 22px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: ember(0.12), border: `1px solid ${ember(0.35)}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Check size={20} color={EMBER} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Verifique seu e-mail</div>
                <div style={{ fontSize: 13, color: foam(0.55), lineHeight: 1.6, marginBottom: 18 }}>
                  Se <strong style={{ color: FOAM }}>{signinEmail}</strong> tem uma assinatura ativa, você recebeu um link de acesso.
                </div>
                <button type="button" onClick={() => { setMagicSent(false); setSigninEmail(""); }}
                  style={{ background: foam(0.05), color: foam(0.6), border: `1px solid ${foam(0.15)}`, borderRadius: 12, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif" }}>
                  Usar outro e-mail
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: foam(0.35), marginTop: 24 }}>
            <span>© 2026 Swell Filmes</span>
            <span><a href="mailto:contato@swellfilmes.com.br" style={{ color: foam(0.35), textDecoration: "none" }}>contato@swellfilmes.com.br</a></span>
          </div>
        </div>

        {/* Coluna direita: painel-herói */}
        <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: "radial-gradient(ellipse 80% 70% at 70% 60%, #201A12 0%, #12100C 55%, #0D0B09 100%)", border: `1px solid ${foam(0.07)}`, padding: "clamp(28px, 3.6vw, 52px)", display: "flex", flexDirection: "column", minHeight: "min(calc(100vh - 48px), 780px)", boxSizing: "border-box" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${ember(0.4)}`, borderRadius: 999, padding: "7px 15px", alignSelf: "flex-start" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMBER, display: "inline-block" }} />
            <span style={{ ...mono(10, 0.2), color: EMBER }}>FEITO NA SWELL</span>
          </div>
          <div style={{ marginTop: "clamp(24px, 4vh, 48px)" }}>
            <div style={{ fontSize: "clamp(28px, 2.9vw, 42px)", fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              “A foto do celular entra.<br /><span style={{ color: EMBER }}>A campanha sai pronta.</span>”
            </div>
            <div style={{ ...mono(10, 0.18), color: foam(0.4), marginTop: 16 }}>
              FIDELIDADE DE PRODUTO · CONSISTÊNCIA DE MARCA · ZERO PROMPT
            </div>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: 260 }}>
            <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%) rotate(180deg)", writingMode: "vertical-rl", ...mono(9, 0.24), color: foam(0.3) }}>
              SEU PRODUTO / CAMPANHA 01
            </div>
            <div style={{ position: "absolute", right: "clamp(12px, 6%, 80px)", top: "50%", transform: "translateY(-46%)", width: "min(52vh, 440px, 80%)", aspectRatio: "1 / 1", borderRadius: "50%", overflow: "hidden", backgroundColor: "#1B1714", boxShadow: `0 0 140px ${ember(0.16)}, 0 40px 120px rgba(0,0,0,0.5)`, border: `1px solid ${foam(0.08)}` }}>
              {heroOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/exemplos/comercial.jpg" alt="" onError={() => setHeroOk(false)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `radial-gradient(circle at 35% 30%, ${ember(0.35)} 0%, #2A2018 45%, #14100C 100%)` }} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <div style={{ background: "rgba(16,13,11,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${foam(0.1)}`, borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, ...mono(9, 0.2), color: EMBER, marginBottom: 8 }}>
                <Check size={11} />PRODUTO FIEL
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>Pronto para publicar</div>
              <div style={{ fontSize: 12, color: foam(0.5) }}>ensaio completo em minutos</div>
            </div>
            <div style={{ ...mono(9, 0.18), color: foam(0.35) }}>LUZ NATURAL · 4:5 · FEED</div>
          </div>
        </div>
      </main>
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
