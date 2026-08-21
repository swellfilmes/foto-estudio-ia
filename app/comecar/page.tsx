"use client";

// ── SIMULAÇÃO de fluxo (protótipo pra sentir o caminho) ──
// Landing SEM preço → a pessoa envia a foto do produto → NA HORA do upload,
// pede login (Continuar com Google / e-mail). Higgsfield-style: engaja primeiro,
// pede login no momento de valor. O login aqui é MOCK (OAuth real é build à parte).

import { useRef, useState } from "react";

const C = {
  abyss: "#0A0908", surf: "#14110F", surf2: "#1C1714",
  line: "rgba(244,239,230,0.10)", line2: "rgba(244,239,230,0.16)",
  ember: "#E0742F", ember2: "#FF7A1F",
  text: "#F4EFE6", t72: "rgba(244,239,230,0.72)", t55: "rgba(244,239,230,0.55)",
  t42: "rgba(244,239,230,0.42)", t30: "rgba(244,239,230,0.30)",
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const BODY = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

function GoogleG() {
  return (
    <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export default function ComecarPage() {
  const [step, setStep] = useState<"idle" | "login" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openPicker = () => fileRef.current?.click();
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
    setStep("login"); // ← o momento do upload dispara o login
  };
  const finish = () => setStep("done");

  return (
    <main style={{ minHeight: "100dvh", background: C.abyss, color: C.text, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fu { animation: fadeUp .4s ease both; }
        .up:hover { border-color: ${C.ember} !important; background: rgba(224,116,47,0.06) !important; }
        .gbtn:hover { filter: brightness(0.97); }
        .ebtn:hover { filter: brightness(1.06); }
      `}</style>

      {/* topo minimal — sem menu, sem preço */}
      <header style={{ padding: "16px clamp(16px,5vw,28px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 24, width: "auto", display: "block" }} />
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: C.t30, border: `1px solid ${C.line2}`, borderRadius: 999, padding: "4px 9px" }}>SIMULAÇÃO</span>
      </header>

      {/* corpo */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px,5vw,40px)", gap: 26, textAlign: "center" }}>
        <div className="fu" style={{ maxWidth: 460, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.24em", color: C.t42 }}>FOTOS PARA QUEM VENDE ONLINE</div>
          <h1 style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: "clamp(26px,7vw,40px)", lineHeight: 1.07, letterSpacing: "-0.015em", margin: 0, textWrap: "balance" }}>
            Seu produto pronto para anunciar.
          </h1>
          <p style={{ fontSize: "clamp(15px,4vw,17px)", lineHeight: 1.45, color: C.t72, margin: 0, textWrap: "balance" }}>
            Envie uma foto do seu celular e receba um <strong style={{ color: C.text }}>kit de imagens</strong> pra marketplace, redes e sua loja — em minutos.
          </p>
        </div>

        {/* área de upload — é o herói da tela */}
        <button
          onClick={openPicker}
          className="up fu"
          style={{ width: "min(460px, 100%)", background: C.surf, border: `1.6px dashed ${C.line2}`, borderRadius: 14, padding: "34px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", color: C.text, transition: "border-color .2s, background .2s" }}
        >
          <div style={{ width: 54, height: 54, borderRadius: 999, background: "rgba(224,116,47,0.12)", border: `1px solid rgba(224,116,47,0.4)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={C.ember} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </div>
          <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>Enviar a foto do produto</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.1em", color: C.t42 }}>JPG OU PNG · DIRETO DO CELULAR</div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.t30 }}>TESTE GRÁTIS · SEM CARTÃO</div>

        {/* prova do que sai — convence sem texto */}
        <div className="fu" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 460, marginTop: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.t42 }}>1 FOTO</span>
          <span style={{ color: C.ember }}>→</span>
          {["CAPA", "DETALHE", "CONTEXTO", "ANÚNCIO"].map((k) => (
            <span key={k} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.t55, border: `1px solid ${C.line2}`, borderRadius: 999, padding: "5px 10px" }}>{k}</span>
          ))}
        </div>
      </section>

      {/* ── GATE DE LOGIN — aparece no momento do upload ── */}
      {step === "login" && (
        <div onClick={() => setStep("idle")} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(6,5,4,0.86)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0", }}>
          <div onClick={(e) => e.stopPropagation()} className="fu" style={{ width: "min(460px, 100%)", background: C.surf, border: `1px solid ${C.line2}`, borderRadius: "18px 18px 0 0", padding: "24px 22px calc(26px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* handle */}
            <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line2, alignSelf: "center" }} />

            {/* mostra que a foto já foi recebida */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="sua foto" style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.line2}` }} />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: 10, background: C.surf2, border: `1px solid ${C.line2}` }} />
              )}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>Falta só entrar</div>
                <div style={{ fontSize: 12.5, color: C.t55, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.ember} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Foto recebida · pra liberar suas fotos
                </div>
              </div>
            </div>

            {/* Google (mock) */}
            <button onClick={finish} className="gbtn" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#FFFFFF", color: "#1F1F1F", border: "none", borderRadius: 10, padding: "15px", fontFamily: BODY, fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}>
              <GoogleG /> Continuar com Google
            </button>

            {/* divisor */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.t30 }}>
              <div style={{ flex: 1, height: 1, background: C.line }} />
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em" }}>OU COM E-MAIL</span>
              <div style={{ flex: 1, height: 1, background: C.line }} />
            </div>

            {/* e-mail (mock) */}
            <form onSubmit={(e) => { e.preventDefault(); if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) finish(); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" aria-label="e-mail"
                style={{ width: "100%", background: "rgba(244,239,230,0.06)", border: `1.4px solid ${C.line2}`, borderRadius: 10, padding: "14px 16px", color: C.text, fontFamily: BODY, fontSize: 16, outline: "none", textAlign: "center" }}
              />
              <button type="submit" className="ebtn" style={{ width: "100%", background: `linear-gradient(180deg, ${C.ember2} 0%, #E85E12 100%)`, color: C.abyss, border: "none", borderRadius: 10, padding: "15px", fontFamily: BODY, fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>
                Continuar com e-mail
              </button>
            </form>

            <div style={{ fontSize: 10.5, lineHeight: 1.4, color: C.t30, textAlign: "center" }}>
              Ao continuar, você concorda com os Termos e a Política de Privacidade.
            </div>
          </div>
        </div>
      )}

      {/* ── SUCESSO (mock) ── */}
      {step === "done" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(6,5,4,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="fu" style={{ width: "min(400px,100%)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 999, background: "rgba(224,116,47,0.14)", border: `1px solid rgba(224,116,47,0.5)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.ember} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>Tudo certo!</div>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: C.t72, margin: 0 }}>Login feito. Aqui a plataforma abriria com sua foto pra montar o kit.</p>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: C.t30 }}>FIM DA SIMULAÇÃO</div>
            <button onClick={() => { setStep("idle"); setEmail(""); setPreview(null); }} style={{ marginTop: 6, background: "transparent", color: C.t72, border: `1px solid ${C.line2}`, borderRadius: 999, padding: "10px 20px", fontFamily: BODY, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              Rodar de novo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
