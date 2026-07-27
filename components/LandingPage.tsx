"use client";

import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/* ===================== tokens (protótipo Swell Studio) ===================== */
const SW = {
  bg: "#0A0908",
  ember: "#E0742F",
  text: "#F4EFE6",
  t80: "rgba(244,239,230,0.8)",
  t70: "rgba(244,239,230,0.7)",
  t55: "rgba(244,239,230,0.55)",
  t45: "rgba(244,239,230,0.45)",
  t40: "rgba(244,239,230,0.4)",
  t35: "rgba(244,239,230,0.35)",
  line: "rgba(244,239,230,0.08)",
  surface: "rgba(22,18,15,0.6)",
};
const FONT = {
  archivo: "'Archivo', 'Manrope', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
const EMBER_GRAD = "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)";

/* ===================== dados ===================== */
const utm = (content: string) =>
  "?utm_source=landing&utm_medium=cta&utm_campaign=swell_studio&utm_content=" + content;

type Plan = {
  url: string;
  name: string;
  label: string;
  price: string;
  photos: string;
  perFoto: string;
  featured: boolean;
  border: string;
  shadow: string;
  nameColor: string;
  btnBg: string;
  btnBorder: string;
  btnColor: string;
  btnShadow: string;
};

const PLANS: Plan[] = [
  {
    url: "https://pay.kiwify.com.br/Acv9bKu" + utm("plano_simples"),
    name: "SIMPLES", label: "Simples", price: "R$67", photos: "50", perFoto: "R$1,34",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none",
  },
  {
    url: "https://pay.kiwify.com.br/Q2dYAL2" + utm("plano_medio"),
    name: "MÉDIO", label: "Médio", price: "R$147", photos: "150", perFoto: "R$0,98",
    featured: true, border: "rgba(224,116,47,0.5)",
    shadow: "0 0 100px rgba(224,116,47,0.12), 0 30px 90px rgba(0,0,0,0.5)", nameColor: SW.ember,
    btnBg: EMBER_GRAD, btnBorder: "none", btnColor: "#0A0908", btnShadow: "0 12px 40px rgba(224,116,47,0.25)",
  },
  {
    url: "https://pay.kiwify.com.br/5Q3p3nP" + utm("plano_grande"),
    name: "GRANDE", label: "Grande", price: "R$267", photos: "300", perFoto: "R$0,89",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none",
  },
];

const NICHES = ["Bebida", "Alimento", "Cosmético", "Artesanal", "Moda e acessórios", "E-commerce"];
const STYLES = ["Editorial minimalista", "Street B&W", "Praia dourada", "Rooftop urbano", "Corporativo clean", "Fashion estúdio", "Coffee shop", "Nature outdoor"];

const PROOFS = [
  { antes: "/assets/chaveiro-antes.jpeg", depois: "/assets/chaveiro-depois.jpeg", cap: "ARTESANAL · FOTO DE PRODUTO", altA: "Chaveiro artesanal fotografado no celular", altD: "Chaveiro artesanal em ensaio editorial Swell" },
  { antes: "/assets/trihair-antes.jpeg", depois: "/assets/trihair-depois.png", cap: "COSMÉTICO · FOTO DE PRODUTO", altA: "Máscara Trihair fotografada no celular", altD: "Máscara Trihair em cena de banheiro com direção de arte Swell" },
  { antes: "/assets/pizza-antes.jpg", depois: "/assets/pizza-depois.jpg", cap: "ALIMENTO · FOTO DE PRODUTO", altA: "Pizza fotografada no celular", altD: "Pizza em foto de campanha Swell" },
  { antes: "/assets/pessoa-antes.jpeg", depois: "/assets/pessoa-depois.png", cap: "ENSAIO DE PESSOA · EDITORIAL", altA: "Selfie de referência enviada pelo cliente", altD: "Ensaio editorial Swell a partir da selfie" },
];

const TESTIMONIALS = [
  { quote: "Tirei a foto do pote na cozinha, com a mão e tudo. Voltou parecendo foto de embalagem oficial, com o rótulo idêntico ao que a gente desenhou.", name: "O Beco Gelato", role: "GELATO ARTESANAL", initials: "OB" },
  { quote: "Minha loja inteira tem foto de campanha agora. Rótulo idêntico, luz de estúdio, por uma fração do que eu pagava em fotógrafo.", name: "Trihair Cosméticos", role: "E-COMMERCE · COSMÉTICOS", initials: "TC" },
  { quote: "Subi três selfies e recebi um ensaio completo. Uso as fotos no perfil e nas propostas. Ninguém acredita que não passei por um estúdio.", name: "Júlia Rocha", role: "ENSAIO DE PESSOA · CONSULTORIA", initials: "JR" },
];

const FAQS = [
  { q: "Preciso saber mexer com IA?", a: "Não. Você sobe a foto do produto e a IA preenche tudo sozinha — cenário, luz, ângulo. Você só confirma." },
  { q: "O produto fica idêntico mesmo? Rótulo, cor, formato?", a: "Sim. A fidelidade ao original é o coração do Swell Studio: rótulo, textura e formato são preservados a partir das fotos que você envia." },
  { q: "Quantas fotos eu recebo?", a: "Depende do plano: 50 fotos/mês no Simples, 150 no Médio e 300 no Grande. Cada foto de produto gera 4 variações e cada ensaio de pessoa gera 8 fotos." },
  { q: "Posso cancelar?", a: "Sim, a qualquer momento. E você tem 7 dias de garantia em qualquer plano — não gostou, devolvemos." },
  { q: "Serve pro meu negócio?", a: "Se você vende produto — bebida, alimento, cosmético, artesanal, moda — é exatamente pra você. E o ensaio de pessoa cobre suas fotos profissionais também." },
  { q: "Quanto tempo demora?", a: "Cada ensaio fica pronto em 3 a 5 minutos. Sem agenda, sem espera." },
];

const DATACRAZY_WEBHOOK =
  "https://api.datacrazy.io/v1/crm/api/crm/flows/webhooks/e7db5d4e-a2e8-42c8-b044-691d3b24fdff/f97d248a-d070-427e-9dc9-fe3656a88105";

/* ===================== ícones ===================== */
const Arrow = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const Check = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const StepIcon = ({ d }: { d: React.ReactNode }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* ===================== componente ===================== */
export default function LandingPage() {
  const [open, setOpen] = useState<number>(-1);
  const [showExit, setShowExit] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const exitShown = useRef(false);

  useEffect(() => {
    document.title = "Swell Studio — Fotografia com direção";
    try { exitShown.current = localStorage.getItem("swl-exit-shown") === "1"; } catch {}
    const onMouseOut = (e: MouseEvent) => {
      if (exitShown.current || showExit) return;
      if (e.clientY <= 8 && !e.relatedTarget) {
        exitShown.current = true;
        try { localStorage.setItem("swl-exit-shown", "1"); } catch {}
        setShowExit(true);
      }
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [showExit]);

  const scrollToPlans = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("planos");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
  };

  const submitLead = () => {
    const email = leadEmail.trim();
    if (!email.includes("@")) return;
    const params = new URLSearchParams(window.location.search);
    // Captura de lead → automação de CRM (Datacrazy).
    fetch(DATACRAZY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: email.split("@")[0],
        phone: "",
        source: "landing-swell-studio",
        origem: "landing-swell-studio",
        evento: "teste-gratis-exit-intent",
        page: window.location.href,
        utm_source: params.get("utm_source") || "landing",
        utm_medium: params.get("utm_medium") || "exit-intent",
        utm_campaign: params.get("utm_campaign") || "swell_studio",
        utm_content: params.get("utm_content") || "teste-gratis",
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {});
    setLeadSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: SW.bg, color: SW.text, fontFamily: FONT.body, overflowX: "hidden" }}>
      <style>{`
        a { color: ${SW.ember}; text-decoration: none; }
        ::selection { background: ${SW.ember}; color: #0A0908; }
        @keyframes sw-riseIn { from { opacity: 0; transform: translateY(16px); filter: blur(10px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .sw-rise { animation: sw-riseIn 800ms cubic-bezier(0.22,1,0.36,1) both; }
        .sw-cta { transition: filter 300ms, transform 150ms; }
        .sw-cta:hover { filter: brightness(1.08); }
        .sw-cta:active { transform: translateY(1px); }
        .sw-plan-btn { transition: filter 300ms, transform 150ms; }
        .sw-plan-btn:hover { filter: brightness(1.12); }
        .sw-plan-btn:active { transform: translateY(1px); }
        .sw-faq-btn { transition: background 300ms; }
        .sw-faq-btn:hover { background: rgba(244,239,230,0.03); }
        .sw-ghost { transition: color 200ms, border-color 200ms; }
        .sw-ghost:hover { color: ${SW.ember}; }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* ============ NAV ============ */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(20px, 4vw, 48px)", background: "rgba(10,9,8,0.72)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)", borderBottom: `1px solid ${SW.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 30, width: "auto", display: "block" }} />
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.t45 }}>FOTOGRAFIA COM DIREÇÃO<span style={{ color: SW.ember }}>.</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 2vw, 22px)" }}>
          <a href="/entrar" className="sw-ghost" style={{ fontSize: 13, fontWeight: 600, color: SW.t70 }}>Entrar</a>
          <a href="#planos" onClick={scrollToPlans} className="sw-cta" style={{ background: EMBER_GRAD, color: "#0A0908", borderRadius: 999, padding: "9px 20px", fontSize: 13, fontWeight: 700, fontFamily: FONT.body, boxShadow: "0 8px 28px rgba(224,116,47,0.25)" }}>Começar agora</a>
        </div>
      </header>

      {/* ============ 1 · HERO ============ */}
      <section style={{ padding: "clamp(48px, 7vw, 96px) clamp(20px, 4vw, 48px) clamp(40px, 5vw, 72px)", background: "radial-gradient(ellipse 80% 60% at 75% 0%, #1B130C 0%, #0A0908 60%)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: "clamp(28px, 4vw, 56px)", alignItems: "center" }}>
          <div className="sw-rise">
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>SEU ESTÚDIO DE PRODUTO, SEM COMPLICAÇÃO</div>
            <h1 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(44px, 5.6vw, 76px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: "0 0 20px" }}>Seu produto.<br /><span style={{ color: SW.t45 }}>Pronto para vender</span><span style={{ color: SW.ember }}>.</span></h1>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: SW.t55, margin: "0 0 40px", maxWidth: "48ch" }}>Suba a foto do seu produto tirada no celular. Receba fotos com cara de campanha — rótulo fiel, luz de estúdio, direção de arte Swell. Sem fotógrafo, sem marcar hora.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <a href="#planos" onClick={scrollToPlans} className="sw-cta" style={{ background: EMBER_GRAD, color: "#0A0908", borderRadius: 14, padding: "17px 30px", fontSize: 15, fontWeight: 700, fontFamily: FONT.body, display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 12px 40px rgba(224,116,47,0.25)" }}>Começar agora — a partir de R$67/mês<Arrow /></a>
              <button onClick={() => setShowExit(true)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: FONT.body }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: SW.text, borderBottom: "1px solid rgba(224,116,47,0.6)", paddingBottom: 2 }}>Teste grátis</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t45 }}>SEM CARTÃO</span>
              </button>
            </div>
          </div>

          {/* antes / depois — gelato */}
          <div className="sw-rise" style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: "radial-gradient(ellipse 80% 70% at 70% 60%, #201A12 0%, #12100C 55%, #0D0B09 100%)", border: `1px solid rgba(244,239,230,0.07)`, padding: "clamp(16px, 2vw, 26px)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 999, padding: "7px 15px", marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SW.ember, display: "inline-block" }} />
              <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: SW.ember }}>FEITO NO SWELL STUDIO</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <figure style={{ margin: 0 }}>
                <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 18, overflow: "hidden", background: "#1B1714", border: `1px solid rgba(244,239,230,0.08)` }}>
                  <img src="/assets/gelato-antes.jpeg" alt="Pote de gelato fotografado no celular" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <figcaption style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t40, marginTop: 10 }}>ANTES · FOTO DO CELULAR</figcaption>
              </figure>
              <figure style={{ margin: 0 }}>
                <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 18, overflow: "hidden", background: "#1B1714", border: "1px solid rgba(224,116,47,0.45)", boxShadow: "0 0 80px rgba(224,116,47,0.14)" }}>
                  <img src="/assets/gelato-depois.jpeg" alt="Pote de gelato com direção de arte Swell" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <figcaption style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.ember, marginTop: 10 }}>DEPOIS · SWELL STUDIO</figcaption>
              </figure>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: SW.t35, marginTop: 18, textAlign: "right" }}>LUZ NATURAL · 4:5 · FEED</div>
          </div>
        </div>
      </section>

      {/* ============ 2 · O PROBLEMA ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)", borderTop: `1px solid rgba(244,239,230,0.06)` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>01 · O PROBLEMA</div>
          <p style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, color: SW.text }}>Foto de produto profissional custa caro — estúdio, fotógrafo, agenda, edição. <span style={{ color: SW.t45 }}>E foto de celular não passa a credibilidade que faz o cliente clicar em comprar.</span></p>
        </div>
      </section>

      {/* ============ 3 · COMO FUNCIONA ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>02 · COMO FUNCIONA</div>
            <h2 style={sectionH2}>Pronto em minutos<span style={{ color: SW.ember }}>.</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {[
              { n: "PASSO 01", t: "Suba a foto do produto", d: "Bebida, alimento, cosmético, artesanal — a foto do celular basta. A IA lê rótulo, cor e material.", icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></> },
              { n: "PASSO 02", t: "A IA monta a cena", d: "A direção de arte Swell preenche tudo sozinha — cenário, luz, ângulo. Você só confirma.", icon: <><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /><circle cx="12" cy="12" r="4" /></> },
              { n: "PASSO 03", t: "Baixe e publique", d: "4 variações profissionais por foto, prontas pra loja, cardápio e feed em 3 a 5 minutos.", icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></> },
            ].map((s) => (
              <div key={s.n} style={{ background: SW.surface, border: `1px solid ${SW.line}`, borderRadius: 22, padding: "clamp(26px, 3vw, 38px)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(224,116,47,0.1)", border: "1px solid rgba(224,116,47,0.35)", display: "grid", placeItems: "center", color: SW.ember }}><StepIcon d={s.icon} /></span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.2em", color: SW.t35 }}>{s.n}</span>
                </div>
                <h3 style={cardH3}>{s.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: SW.t55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(20px, 4vw, 44px)", flexWrap: "wrap", marginTop: "clamp(32px, 4vw, 48px)", fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t40 }}>
            <span>◇ PRODUTO FIEL AO ORIGINAL</span><span>○ SEUS ARQUIVOS SÃO PRIVADOS</span><span>⚡ RESULTADO EM MINUTOS</span>
          </div>
        </div>
      </section>

      {/* ============ 4 · DUAS COISAS ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)", background: "radial-gradient(ellipse 70% 50% at 50% 0%, #16110C 0%, #0A0908 65%)", borderTop: `1px solid rgba(244,239,230,0.06)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>03 · DUAS COISAS, UM ESTÚDIO</div>
            <h2 style={sectionH2}>Foto de produto.<br /><span style={{ color: SW.t45 }}>E ensaio de pessoa.</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            <article style={{ background: SW.surface, backdropFilter: "blur(16px)", border: "1px solid rgba(224,116,47,0.45)", borderRadius: 24, padding: "clamp(28px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 0 80px rgba(224,116,47,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 999, padding: "7px 15px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: SW.ember }} /><span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: SW.ember }}>FOTO DE PRODUTO</span></span>
                <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, color: SW.ember }}>4 variações / foto</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: SW.t55, margin: 0 }}>Fotografe o produto no celular e suba. A IA lê rótulo, cor e material, preenche a direção de arte sozinha e devolve variações com cara de campanha — e-commerce, lifestyle, macro, na mão.</p>
              <ChipGroup label="FEITO PRA NICHOS COMO" items={NICHES} />
            </article>
            <article style={{ background: SW.surface, backdropFilter: "blur(16px)", border: `1px solid ${SW.line}`, borderRadius: 24, padding: "clamp(28px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(244,239,230,0.18)", borderRadius: 999, padding: "7px 15px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: SW.t40 }} /><span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: SW.t70 }}>ENSAIO DE PESSOA</span></span>
                <span style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 15, color: SW.ember }}>8 fotos / ensaio</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: SW.t55, margin: 0 }}>Também incluso: suba de 1 a 3 fotos de referência e receba um ensaio completo — pra foto de perfil, LinkedIn e a cara da sua marca. A IA preserva o seu rosto.</p>
              <ChipGroup label="CATÁLOGO DE ESTILOS" items={STYLES} />
            </article>
          </div>
        </div>
      </section>

      {/* ============ 5 · PROVA ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>04 · A PROVA</div>
            <h2 style={sectionH2}>Fotos reais feitas<br />no Swell Studio<span style={{ color: SW.ember }}>.</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(620px, 100%), 1fr))", gap: "clamp(24px, 4vw, 40px)", maxWidth: 980, margin: "0 auto" }}>
            {PROOFS.map((p) => (
              <figure key={p.cap} style={{ margin: 0, background: SW.surface, border: `1px solid ${SW.line}`, borderRadius: 26, padding: "clamp(16px, 2vw, 24px)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "stretch", gap: "clamp(12px, 2vw, 20px)" }}>
                  <div style={{ position: "relative", flex: 1, aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#1B1714", border: `1px solid ${SW.line}` }}>
                    <img src={p.antes} alt={p.altA} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={proofTag(SW.t55)}>ANTES</span>
                  </div>
                  <div style={{ alignSelf: "center", color: SW.ember, flex: "none" }}><Arrow size={28} /></div>
                  <div style={{ position: "relative", flex: 1, aspectRatio: "4/5", borderRadius: 14, overflow: "hidden", background: "#1B1714", border: "1px solid rgba(224,116,47,0.45)", boxShadow: "0 0 60px rgba(224,116,47,0.12)" }}>
                    <img src={p.depois} alt={p.altD} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={proofTag(SW.ember)}>DEPOIS</span>
                  </div>
                </div>
                <figcaption style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t40 }}>{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6 · POR QUE SWELL ============ */}
      <section style={{ padding: "clamp(64px, 8vw, 112px) clamp(20px, 4vw, 48px)", background: "radial-gradient(ellipse 70% 60% at 50% 100%, #16110C 0%, #0A0908 70%)", borderTop: `1px solid rgba(244,239,230,0.06)` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>05 · POR QUE SWELL</div>
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(30px, 3.8vw, 46px)", letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 24px" }}>Não é filtro.<br />Não é gerador plástico de IA<span style={{ color: SW.ember }}>.</span></h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: SW.t55, margin: "0 auto", maxWidth: "58ch" }}>É direção de arte editorial — feita por uma produtora audiovisual de verdade. Rótulo fiel, textura real, luz de verdade, cara de foto de campanha. A estética Swell aplicada a cada foto, com a intenção de fazer o seu produto vender.</p>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t40, marginTop: 28 }}>FIDELIDADE DE PRODUTO · CONSISTÊNCIA DE MARCA · ZERO PROMPT</div>
        </div>
      </section>

      {/* ============ 6B · DEPOIMENTOS ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)", borderTop: `1px solid rgba(244,239,230,0.06)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>QUEM JÁ USA</div>
            <h2 style={sectionH2}>Marcas que já surfam com a gente<span style={{ color: SW.ember }}>.</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} style={{ margin: 0, background: SW.surface, border: `1px solid ${SW.line}`, borderRadius: 22, padding: "clamp(24px, 3vw, 34px)", display: "flex", flexDirection: "column", gap: 18 }}>
                <blockquote style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: SW.t80, fontWeight: 500 }}>“{t.quote}”</blockquote>
                <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.35)", display: "grid", placeItems: "center", fontFamily: FONT.archivo, fontWeight: 800, fontSize: 13, color: SW.ember }}>{t.initials}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: SW.text }}>{t.name}</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.16em", color: SW.t40 }}>{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7 · PLANOS ============ */}
      <section id="planos" style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>06 · PLANOS</div>
            <h2 style={{ ...sectionH2, marginBottom: 14 }}>Escolha o seu ritmo<span style={{ color: SW.ember }}>.</span></h2>
            <p style={{ fontSize: 15, color: SW.t55, margin: 0 }}>Os dois modos inclusos em todos os planos. Cancele quando quiser.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "stretch" }}>
            {PLANS.map((pl) => (
              <div key={pl.name} style={{ position: "relative", display: "flex", flexDirection: "column", background: SW.surface, backdropFilter: "blur(16px)", border: `1px solid ${pl.border}`, borderRadius: 24, overflow: "hidden", boxShadow: pl.shadow }}>
                {pl.featured && <div style={{ background: EMBER_GRAD, color: "#0A0908", textAlign: "center", fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, padding: 8 }}>MAIS ESCOLHIDO</div>}
                <div style={{ padding: "clamp(26px, 3vw, 36px)", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.22em", color: pl.nameColor, marginBottom: 18 }}>{pl.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(42px, 5vw, 56px)", letterSpacing: "-0.04em", lineHeight: 0.9 }}>{pl.price}</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.12em", color: SW.t45 }}>/MÊS</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SW.ember, marginBottom: 22 }}>{pl.photos} fotos por mês</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
                    {["Foto de produto + ensaio de pessoa", "Todos os estilos do catálogo", `${pl.perFoto} por foto`, "Cancele quando quiser"].map((feat) => (
                      <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: SW.t80 }}><span style={{ color: SW.ember, display: "grid", placeItems: "center" }}><Check /></span><span>{feat}</span></div>
                    ))}
                  </div>
                  <a href={pl.url} className="sw-plan-btn" style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", background: pl.btnBg, border: pl.btnBorder, color: pl.btnColor, borderRadius: 14, padding: 15, fontSize: 14, fontWeight: 700, fontFamily: FONT.body, boxShadow: pl.btnShadow }}>Assinar {pl.label}</a>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 26, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t45 }}>7 DIAS DE GARANTIA EM TODOS OS PLANOS — NÃO GOSTOU, DEVOLVEMOS.</div>
        </div>
      </section>

      {/* ============ 8 · FAQ ============ */}
      <section style={{ padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)", borderTop: `1px solid rgba(244,239,230,0.06)` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(32px, 5vw, 52px)" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.24em", color: SW.ember, marginBottom: 18 }}>07 · PERGUNTAS FREQUENTES</div>
            <h2 style={sectionH2}>Dúvidas rápidas<span style={{ color: SW.ember }}>.</span></h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} style={{ background: SW.surface, border: `1px solid ${SW.line}`, borderRadius: 18, overflow: "hidden" }}>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} className="sw-faq-btn" style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, textAlign: "left", fontFamily: FONT.body, fontWeight: 700, fontSize: 16, color: SW.text }}>
                    <span>{f.q}</span>
                    <span style={{ flex: "none", fontWeight: 400, fontSize: 24, lineHeight: 1, color: SW.ember }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && <p style={{ margin: 0, padding: "0 22px 22px", fontSize: 14, lineHeight: 1.7, color: SW.t55, maxWidth: "60ch" }}>{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 9 · CTA FINAL ============ */}
      <section style={{ padding: "clamp(72px, 10vw, 130px) clamp(20px, 4vw, 48px)", textAlign: "center", background: "radial-gradient(ellipse 80% 70% at 50% 100%, #1B130C 0%, #0A0908 70%)", borderTop: `1px solid rgba(244,239,230,0.06)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", bottom: -160, transform: "translateX(-50%)", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,116,47,0.12) 0%, rgba(224,116,47,0) 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 52, width: "auto", display: "block", margin: "0 auto 30px" }} />
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(40px, 5.4vw, 68px)", letterSpacing: "-0.035em", lineHeight: 0.95, margin: "0 0 34px" }}>Seu produto.<br /><span style={{ color: SW.t45 }}>Pronto para vender</span><span style={{ color: SW.ember }}>.</span></h2>
          <a href="#planos" onClick={scrollToPlans} className="sw-cta" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: EMBER_GRAD, color: "#0A0908", borderRadius: 14, padding: "17px 32px", fontSize: 15, fontWeight: 700, fontFamily: FONT.body, boxShadow: "0 12px 40px rgba(224,116,47,0.25)" }}>Começar agora — a partir de R$67/mês<Arrow /></a>
          <div style={{ marginTop: 30, fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.16em" }}>
            <a href="mailto:contato@swellfilmes.com.br" style={{ color: SW.t45 }}>CONTATO@SWELLFILMES.COM.BR</a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: "24px clamp(20px, 4vw, 48px)", borderTop: `1px solid rgba(244,239,230,0.06)`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t35 }}>
        <span>SWELL STUDIO · UMA MARCA SWELL FILMES</span>
        <span>SALVADOR · BAHIA</span>
      </footer>

      {/* ============ EXIT INTENT ============ */}
      {showExit && (
        <div onClick={() => setShowExit(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(10,9,8,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="sw-rise" style={{ position: "relative", maxWidth: 460, width: "100%", background: "radial-gradient(ellipse 90% 70% at 50% 0%, #1B130C 0%, #12100C 60%)", border: "1px solid rgba(224,116,47,0.35)", borderRadius: 24, padding: "clamp(28px, 5vw, 40px)", boxShadow: "0 0 120px rgba(224,116,47,0.15), 0 40px 120px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setShowExit(false)} className="sw-ghost" style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, background: "none", border: "1px solid rgba(244,239,230,0.14)", color: SW.t55, borderRadius: "50%", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            {!leadSent ? (
              <>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.ember, marginBottom: 16 }}>ANTES DE IR</div>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(26px, 4vw, 34px)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 12 }}>Leve seu teste grátis<span style={{ color: SW.ember }}>.</span></div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: SW.t55, margin: "0 0 24px" }}>Deixe seu e-mail e receba o acesso ao teste — sem cartão, sem compromisso.</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(244,239,230,0.05)", border: "1px solid rgba(244,239,230,0.12)", borderRadius: 14, padding: "0 18px", marginBottom: 14 }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 14, color: SW.t40 }}>@</span>
                  <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitLead(); }} placeholder="voce@suamarca.com" type="email" style={{ flex: 1, background: "none", border: "none", padding: "15px 0", color: SW.text, fontSize: 15, outline: "none", fontFamily: FONT.body, minWidth: 0 }} />
                </div>
                <button onClick={submitLead} className="sw-cta" style={{ width: "100%", background: EMBER_GRAD, border: "none", color: "#0A0908", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body, boxShadow: "0 12px 40px rgba(224,116,47,0.25)" }}>Quero meu teste grátis</button>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: SW.t40, textAlign: "center", marginTop: 14 }}>SEM CARTÃO · SEM SPAM</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.ember, marginBottom: 16 }}>✓ E-MAIL RECEBIDO</div>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(26px, 4vw, 34px)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 12 }}>Confira sua caixa de entrada<span style={{ color: SW.ember }}>.</span></div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: SW.t55, margin: 0 }}>Seu acesso ao teste grátis chega em instantes.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== estilos/subcomponentes ===================== */
const sectionH2: CSSProperties = { fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", lineHeight: 1, margin: 0 };
const cardH3: CSSProperties = { fontFamily: FONT.archivo, fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em", margin: 0 };
const proofTag = (color: string): CSSProperties => ({ position: "absolute", left: 10, top: 10, zIndex: 4, fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.16em", color, pointerEvents: "none" });

function ChipGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.18em", color: SW.t40, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it) => (
          <span key={it} style={{ border: "1px solid rgba(244,239,230,0.14)", borderRadius: 999, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: SW.t70 }}>{it}</span>
        ))}
      </div>
    </div>
  );
}
