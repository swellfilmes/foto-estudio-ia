"use client";

import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/* ===================== tokens (Swell Studio — design v3) ===================== */
const SW = {
  bg: "#0A0908",
  surface: "#16120F",
  ember: "#E0742F",
  emberHi: "#EE8440",
  text: "#F4EFE6",
  t72: "rgba(244,239,230,0.72)",
  t62: "rgba(244,239,230,0.62)",
  t55: "rgba(244,239,230,0.55)",
  t45: "rgba(244,239,230,0.45)",
  t42: "rgba(244,239,230,0.42)",
  t40: "rgba(244,239,230,0.4)",
  t38: "rgba(244,239,230,0.38)",
  t35: "rgba(244,239,230,0.35)",
  line: "rgba(244,239,230,0.07)",
  line2: "rgba(244,239,230,0.09)",
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
  url: string; name: string; label: string; price: string; photos: string; highlight: string;
  featured: boolean; border: string; shadow: string; nameColor: string;
  btnBg: string; btnBorder: string; btnColor: string; btnShadow: string;
};

const PLANS: Plan[] = [
  {
    url: "https://pay.kiwify.com.br/iT4Cc0s" + utm("plano_simples"),
    name: "SIMPLES", label: "Simples", price: "R$79,90", photos: "35", highlight: "Ideal pra começar",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none",
  },
  {
    url: "https://pay.kiwify.com.br/J6cjEFC" + utm("plano_medio"),
    name: "MÉDIO", label: "Médio", price: "R$159,90", photos: "80", highlight: "2× mais fotos que o Simples",
    featured: true, border: "rgba(224,116,47,0.5)",
    shadow: "0 0 90px rgba(224,116,47,0.1), 0 24px 70px rgba(0,0,0,0.45)", nameColor: SW.ember,
    btnBg: EMBER_GRAD, btnBorder: "none", btnColor: "#0A0908", btnShadow: "0 12px 36px rgba(224,116,47,0.24)",
  },
  {
    url: "https://pay.kiwify.com.br/xB1SN3A" + utm("plano_grande"),
    name: "GRANDE", label: "Grande", price: "R$299,90", photos: "180", highlight: "5× mais fotos que o Simples",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none",
  },
];

type Proof = { antes: string; depois: string; altA: string; altB: string; label: string };
const PROOFS: Proof[] = [
  { antes: "/assets/opt/suco-antes.jpg", depois: "/assets/opt/suco-depois.jpg", altA: "Suco em lata fotografado no celular", altB: "Suco em lata em estúdio Swell", label: "BEBIDA" },
  { antes: "/assets/opt/tenis-antes.jpg", depois: "/assets/opt/tenis-depois.jpg", altA: "Tênis fotografado no celular", altB: "Tênis em campanha Swell", label: "CALÇADO" },
  { antes: "/assets/opt/relogio-antes.jpg", depois: "/assets/opt/relogio-depois.jpg", altA: "Relógio fotografado no celular", altB: "Relógio em cena premium Swell", label: "ACESSÓRIO" },
  { antes: "/assets/opt/camisa-antes.jpg", depois: "/assets/opt/camisa-depois.jpg", altA: "Camisa fitness fotografada no celular", altB: "Camisa fitness em campanha Swell", label: "VESTUÁRIO" },
];

const STEPS = [
  { n: "01", t: "Sobe a foto", icon: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3.2" /></> },
  { n: "02", t: "Escolhe a cena", icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="7" y1="4" x2="7" y2="20" /><line x1="17" y1="4" x2="17" y2="20" /></> },
  { n: "03", t: "Baixa e posta", icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="3" x2="12" y2="15" /></> },
];

const FAQS = [
  { q: "Meu produto fica idêntico?", a: "Sim. Rótulo, cor e formato são preservados a partir da foto que você envia. Só o cenário e a luz mudam." },
  { q: "Preciso saber editar ou mexer em programa?", a: "Não, nada. Você sobe a foto do produto, escolhe a cena e pronto — luz, cenário e ângulo ficam por nossa conta. Você só baixa e posta." },
  { q: "Quanto tempo demora?", a: "Cerca de 40 segundos por foto de produto. Ensaio de pessoa, 3 a 5 minutos." },
  { q: "O teste é grátis mesmo?", a: "Sim: 5 fotos, sem cartão. Depois você escolhe um plano se quiser continuar." },
];

const DATACRAZY_WEBHOOK =
  "https://api.datacrazy.io/v1/crm/api/crm/integrations/webhook/business/a1391dce-2771-4a48-b4d8-6743f67ef8c6";

/* ===================== Meta Pixel (eventos de conversão) ===================== */
type Fbq = (...args: unknown[]) => void;
function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params);
}
// "R$159,90" → 159.9
function priceToNumber(price: string): number {
  const n = Number(price.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/* ===================== ícones ===================== */
const Arrow = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ===================== slider antes/depois (v3) ===================== */
function BeforeAfter() {
  const [reveal, setReveal] = useState(52);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const update = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setReveal(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
    if (!touched) setTouched(true);
  };
  const onDown = (e: React.PointerEvent) => { drag.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {} update(e.clientX); };
  const onMove = (e: React.PointerEvent) => { if (drag.current) update(e.clientX); };
  const onUp = () => { drag.current = false; };
  return (
    <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ position: "relative", aspectRatio: "4/5", width: "100%", borderRadius: 4, overflow: "hidden", background: SW.surface, border: "1px solid rgba(244,239,230,0.1)", touchAction: "none", cursor: "ew-resize", userSelect: "none", boxShadow: "0 40px 110px rgba(0,0,0,0.6)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/opt/luminaria-depois.jpg" alt="Mesmo produto em foto de campanha Swell" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/opt/luminaria-antes.jpg" alt="Produto fotografado no celular" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${reveal}%`, width: 1.5, background: SW.ember, pointerEvents: "none", boxShadow: "0 0 24px rgba(224,116,47,0.55)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 46, height: 46, borderRadius: 999, background: SW.ember, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A0908" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 4 12 9 18" /><polyline points="15 6 20 12 15 18" /></svg>
        </div>
      </div>
      <span style={{ position: "absolute", left: 12, top: 12, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.16em", color: SW.t72, background: "rgba(10,9,8,0.55)", padding: "5px 9px", pointerEvents: "none" }}>ANTES · CELULAR</span>
      <span style={{ position: "absolute", right: 12, top: 12, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.16em", color: SW.ember, background: "rgba(10,9,8,0.55)", padding: "5px 9px", pointerEvents: "none" }}>DEPOIS · SWELL</span>
      <span style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.14em", color: SW.t62, background: "rgba(10,9,8,0.6)", padding: "6px 12px", pointerEvents: "none", opacity: touched ? 0 : 1, transition: "opacity 300ms cubic-bezier(0.22,1,0.36,1)" }}>
        ARRASTA PRA VER
        <span style={{ display: "inline-flex", animation: "swlNudge 1.6s cubic-bezier(0.22,1,0.36,1) infinite" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </span>
      </span>
    </div>
  );
}

/* ===================== carrossel da prova (rolagem contínua, pausa no toque) ===================== */
function ProofRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      if (!paused.current) {
        const half = el.scrollWidth / 2;
        let next = el.scrollLeft + dt * 0.032;
        if (next >= half) next -= half;
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };
  const items = PROOFS.concat(PROOFS);
  return (
    <div ref={railRef} className="swl-rail"
      onPointerDown={pause} onPointerUp={resume} onPointerLeave={resume} onPointerCancel={resume}
      onTouchStart={pause} onTouchEnd={resume}
      style={{ display: "flex", gap: "clamp(30px, 7vw, 52px)", overflowX: "auto", padding: "4px clamp(16px, 4vw, 40px) 6px", WebkitOverflowScrolling: "touch" }}>
      {items.map((p, i) => (
        <figure key={i} style={{ margin: 0, flex: "0 0 min(80%, 340px)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", background: SW.surface, border: "1px solid rgba(244,239,230,0.09)", borderRadius: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.antes} alt={p.altA} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.t62, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>ANTES</span>
            </div>
            <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", background: SW.surface, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.depois} alt={p.altB} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.ember, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>DEPOIS</span>
            </div>
          </div>
          <figcaption style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.18em", color: SW.t38 }}>{p.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ===================== componente ===================== */
export default function LandingPage() {
  const [open, setOpen] = useState<number>(-1);
  const [showLead, setShowLead] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<"idle" | "sent" | "blocked">("idle");
  const [leadMsg, setLeadMsg] = useState("");
  const [leadError, setLeadError] = useState("");
  const exitShown = useRef(false);

  useEffect(() => {
    document.title = "Swell Studio — Foto de estúdio, do seu celular";
    try { exitShown.current = localStorage.getItem("swl-exit-shown") === "1"; } catch {}
    const onMouseOut = (e: MouseEvent) => {
      if (exitShown.current || showLead || leadStatus !== "idle") return;
      if (e.clientY <= 8 && !e.relatedTarget) {
        exitShown.current = true;
        try { localStorage.setItem("swl-exit-shown", "1"); } catch {}
        setShowLead(true);
      }
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [showLead, leadStatus]);

  const submitLead = async () => {
    const email = leadEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError("Ops — digite um e-mail válido (ex.: voce@suamarca.com).");
      return;
    }
    setLeadError("");
    const name = email.split("@")[0];
    const params = new URLSearchParams(window.location.search);
    // Captura de lead → automação de CRM (Datacrazy).
    fetch(DATACRAZY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, name, country_code: "", phone: "",
        source: "landing-swell-studio", origem: "landing-swell-studio", evento: "teste-gratis",
        page: window.location.href,
        utm_source: params.get("utm_source") || "landing",
        utm_medium: params.get("utm_medium") || "cta",
        utm_campaign: params.get("utm_campaign") || "swell_studio",
        utm_content: params.get("utm_content") || "teste-gratis",
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {});
    // Confirma o e-mail e libera o teste: cria o trial e manda o link mágico (Resend).
    // O acesso só abre quando a pessoa clica no link — evita e-mail falso pegando 5 fotos.
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "landing-swell-studio" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLeadError(typeof data?.error === "string" ? data.error : "Não conseguimos enviar agora. Tenta de novo em instantes.");
        return;
      }
      if (data?.status === "blocked") {
        setLeadMsg(typeof data?.message === "string" ? data.message : "Você já usou o teste grátis neste aparelho.");
        setLeadStatus("blocked");
      } else {
        setLeadStatus("sent");
        track("Lead", { content_name: "teste-gratis" }); // conversão do teste grátis
      }
    } catch {
      setLeadError("Sem conexão. Tenta de novo em instantes.");
    }
  };

  const openLead = () => setShowLead(true);

  return (
    <div style={{ background: SW.bg, minHeight: "100vh", overflowX: "hidden", color: SW.text, fontFamily: FONT.body }}>
      <style>{`
        html { scroll-behavior: smooth; }
        ::selection { background: ${SW.ember}; color: #0A0908; }
        .swl-rail { -ms-overflow-style: none; scrollbar-width: none; }
        .swl-rail::-webkit-scrollbar { display: none; }
        @keyframes swlNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(7px); } }
        @keyframes swlRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .swl-rise { animation: swlRise 700ms cubic-bezier(0.22,1,0.36,1) both; }
        .swl-cta { transition: filter 250ms, transform 120ms; }
        .swl-cta:hover { filter: brightness(1.06); }
        .swl-cta:active { transform: translateY(1px); }
        .swl-ghost { transition: color 200ms; }
        .swl-ghost:hover { color: ${SW.emberHi}; }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(10,9,8,0.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${SW.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "11px clamp(16px, 4vw, 40px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 26, width: "auto", display: "block", flex: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 20px)", flex: "none" }}>
            <a href="/entrar" className="swl-ghost" style={{ fontFamily: FONT.body, fontSize: 13.5, fontWeight: 700, color: SW.t72, textDecoration: "none" }}>Entrar</a>
            <button onClick={openLead} className="swl-cta" style={{ flex: "none", background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 999, padding: "10px 18px", fontFamily: FONT.body, fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "0 8px 26px rgba(224,116,47,0.22)" }}>Testar grátis</button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ padding: "clamp(30px, 5vw, 60px) clamp(16px, 4vw, 40px) clamp(40px, 6vw, 70px)" }}>
        <div className="swl-rise" style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(22px, 4vw, 30px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.t42 }}>FOTO DE PRODUTO COM IA</div>
            <h1 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(42px, 12vw, 66px)", lineHeight: 0.92, letterSpacing: "-0.04em", margin: 0, textWrap: "balance" }}>Foto de celular virou foto de estúdio<br />em 1 minuto<span style={{ color: SW.ember }}>.</span></h1>
          </div>

          <BeforeAfter />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <button onClick={openLead} className="swl-cta" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 4, padding: "20px 28px", fontFamily: FONT.body, fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em", cursor: "pointer", boxShadow: "0 16px 50px rgba(224,116,47,0.26)" }}>
              Transformar minha foto agora<Arrow />
            </button>
            <div style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: "0.18em", color: SW.t42 }}>5 FOTOS · SEM CARTÃO</div>
          </div>
        </div>
      </section>

      {/* ============ 01 · PROVA ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) 0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember }}>01 — PROVA</div>
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(30px, 8vw, 46px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>Tirei no celular.<br />Virou isso<span style={{ color: SW.ember }}>.</span></h2>
        </div>
        <ProofRail />
      </section>

      {/* ============ 02 · COMO FUNCIONA ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 26 }}>02 — COMO FUNCIONA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "clamp(14px, 2vw, 22px)" }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 18, padding: 22, background: SW.surface, border: `1px solid ${SW.line2}`, borderRadius: 3 }}>
                <div style={{ flex: "none", width: 46, height: 46, borderRadius: 999, background: "rgba(224,116,47,0.1)", border: "1px solid rgba(224,116,47,0.3)", color: SW.ember, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.2em", color: SW.t35 }}>{s.n}</div>
                  <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em" }}>{s.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 03 · FIDELIDADE ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(50px, 8vw, 96px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember }}>03 — FIDELIDADE</div>
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(30px, 8vw, 48px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>Seu produto, idêntico.<br />Só o cenário muda<span style={{ color: SW.ember }}>.</span></h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: SW.t55, margin: 0, maxWidth: "44ch" }}>Rótulo, cor e formato preservados. Direção de arte de uma produtora audiovisual — não é filtro.</p>
        </div>
      </section>

      {/* ============ 04 · DOIS MODOS ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 26 }}>04 — DOIS MODOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "clamp(14px, 2vw, 22px)" }}>
            <div style={{ background: SW.surface, border: "1px solid rgba(224,116,47,0.35)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ aspectRatio: "16/10", overflow: "hidden", background: SW.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/opt/luminaria-depois.jpg" alt="Foto de produto Swell" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>Produto</div>
                <div style={{ fontSize: 15, color: SW.t55 }}>1 foto do celular → 4 variações de campanha.</div>
              </div>
            </div>
            <div style={{ background: SW.surface, border: `1px solid ${SW.line2}`, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ aspectRatio: "16/10", overflow: "hidden", background: SW.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/opt/pessoa-depois.jpg" alt="Ensaio de pessoa Swell" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%", display: "block" }} />
              </div>
              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>Pessoa</div>
                <div style={{ fontSize: 15, color: SW.t55 }}>3 selfies → 8 fotos de ensaio editorial.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 05 · PLANOS ============ */}
      <section id="planos" style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)", scrollMarginTop: 70 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 26 }}>05 — PLANOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "clamp(14px, 2vw, 20px)", alignItems: "start" }}>
            {PLANS.map((p) => (
              <div key={p.name} style={{ position: "relative", background: SW.surface, border: `1px solid ${p.border}`, borderRadius: 3, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 18, boxShadow: p.shadow }}>
                {p.featured && (
                  <div style={{ position: "absolute", top: -1, right: -1, background: SW.ember, color: "#0A0908", fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.16em", padding: "5px 10px" }}>MAIS POPULAR</div>
                )}
                <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: p.nameColor }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 36, letterSpacing: "-0.04em", lineHeight: 1 }}>{p.price}</div>
                  <div style={{ fontSize: 14, color: SW.t40 }}>/mês</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15, color: SW.t62 }}>
                  <div><strong style={{ color: SW.text, fontWeight: 700 }}>{p.photos} fotos</strong> por mês</div>
                  <div>{p.highlight}</div>
                  <div>Produto e pessoa inclusos</div>
                </div>
                <a href={p.url} onClick={() => track("InitiateCheckout", { content_name: p.label, value: priceToNumber(p.price), currency: "BRL" })} className="swl-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.btnBg, border: p.btnBorder, color: p.btnColor, borderRadius: 4, padding: "15px 20px", fontFamily: FONT.body, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", boxShadow: p.btnShadow, textDecoration: "none" }}>Assinar {p.label}</a>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 9, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t40 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            7 DIAS DE GARANTIA · CANCELA QUANDO QUISER
          </div>
        </div>
      </section>

      {/* ============ 06 · DÚVIDAS ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>06 — DÚVIDAS</div>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: `1px solid ${SW.line2}` }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", padding: "20px 0", cursor: "pointer", textAlign: "left", color: SW.text, fontFamily: FONT.body }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.q}</span>
                  <span style={{ flex: "none", color: SW.ember, fontSize: 20, lineHeight: 1 }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div style={{ padding: "0 0 20px", fontSize: 15.5, lineHeight: 1.6, color: SW.t55, maxWidth: "56ch" }}>{f.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(56px, 9vw, 110px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 40, width: "auto", display: "block" }} />
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(34px, 10vw, 56px)", lineHeight: 0.93, letterSpacing: "-0.04em", margin: 0 }}>Seu produto merece<br />foto boa<span style={{ color: SW.ember }}>.</span></h2>
          <button onClick={openLead} className="swl-cta" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 4, padding: "20px 28px", fontFamily: FONT.body, fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em", cursor: "pointer", boxShadow: "0 16px 50px rgba(224,116,47,0.26)" }}>
            Testar grátis<Arrow />
          </button>
          <div style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: "0.18em", color: SW.t42 }}>5 FOTOS · SEM CARTÃO</div>
          <a href="mailto:contato@swellfilmes.com.br" style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t35, marginTop: 10, textDecoration: "none" }}>CONTATO@SWELLFILMES.COM.BR</a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `1px solid ${SW.line}`, padding: "24px clamp(16px, 4vw, 40px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t35 }}>
        <span>SWELL STUDIO · UMA MARCA SWELL FILMES</span>
        <span>SALVADOR · BAHIA</span>
      </footer>

      {/* ============ MODAL DE LEAD ============ */}
      {showLead && (
        <div onClick={() => setShowLead(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,9,8,0.88)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: SW.surface, border: "1px solid rgba(224,116,47,0.35)", borderRadius: 4, padding: "clamp(24px, 5vw, 34px)", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
            <button onClick={() => setShowLead(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: SW.t40, cursor: "pointer", padding: 6, lineHeight: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {leadStatus === "idle" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.ember }}>TESTE GRÁTIS</div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(26px, 7vw, 34px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>5 fotos, sem cartão.</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>Deixa seu e-mail — a gente manda um link pra liberar.</p>
                <input value={leadEmail} onChange={(e) => { setLeadEmail(e.target.value); if (leadError) setLeadError(""); }} onKeyDown={(e) => { if (e.key === "Enter") submitLead(); }} type="email" autoComplete="email" placeholder="seu@email.com" autoFocus
                  style={{ width: "100%", background: SW.bg, border: `1px solid ${leadError ? "rgba(232,131,111,0.7)" : "rgba(244,239,230,0.16)"}`, borderRadius: 3, padding: "15px 16px", color: SW.text, fontFamily: FONT.body, fontSize: 16, outline: "none" }} />
                {leadError && <div style={{ color: "#E8836F", fontSize: 12.5, lineHeight: 1.4, marginTop: -6 }}>{leadError}</div>}
                <button onClick={submitLead} className="swl-cta" style={{ width: "100%", background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 3, padding: 17, fontFamily: FONT.body, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Quero testar</button>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t35, textAlign: "center" }}>SEM SPAM · CANCELA QUANDO QUISER</div>
              </div>
            ) : leadStatus === "sent" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></svg>
                </div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 26, letterSpacing: "-0.03em", margin: 0 }}>Confira seu e-mail.</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>Mandamos um link pra <strong style={{ color: SW.text }}>{leadEmail}</strong> — clica nele pra liberar suas 5 fotos.</p>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t35 }}>ÀS VEZES CAI EM PROMOÇÕES / SPAM</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: "rgba(244,239,230,0.06)", border: `1px solid ${SW.line2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 24, letterSpacing: "-0.03em", margin: 0 }}>Teste já usado.</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>{leadMsg}</p>
                <a href="#planos" onClick={() => setShowLead(false)} className="swl-cta" style={{ width: "100%", textAlign: "center", background: EMBER_GRAD, color: "#0A0908", borderRadius: 3, padding: 15, fontFamily: FONT.body, fontSize: 15, fontWeight: 800, textDecoration: "none", marginTop: 4 }}>Ver planos</a>
                <a href="/entrar" style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.14em", color: SW.t45, textDecoration: "none" }}>JÁ TENHO ACESSO — ENTRAR</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
