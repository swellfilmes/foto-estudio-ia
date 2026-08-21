"use client";

import { useState, useEffect } from "react";
import PromptGenerator from "./PromptGenerator";
import { isSandbox, installSandbox } from "@/lib/sandbox";

// Modo teste (preview): mocka /api/* no cliente ANTES de qualquer fetch dos filhos.
// Roda no import do módulo (client), então já está de pé quando o estúdio monta.
if (typeof window !== "undefined" && isSandbox()) installSandbox();

const EMBER = "#E0742F";
const INTRO_MSGS = ["Olá.", "Bem-vindo ao Estúdio Swell.", "Comece pela foto do seu produto."];
const PER = 2300; // duração de cada mensagem (mais lenta, respira melhor)

// Abertura cinematográfica ao entrar no estúdio (do protótipo Claude Design).
function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    INTRO_MSGS.forEach((_, i) => {
      if (i > 0) timers.push(setTimeout(() => setStep(i), PER * i));
    });
    timers.push(setTimeout(() => setFading(true), PER * INTRO_MSGS.length));
    timers.push(setTimeout(onDone, PER * INTRO_MSGS.length + 700));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const msg = INTRO_MSGS[step];
  const body = msg.endsWith(".") ? msg.slice(0, -1) : msg;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse 90% 60% at 50% 42%, #16110C 0%, #0A0908 62%)",
        opacity: fading ? 0 : 1, transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,116,47,0.10) 0%, rgba(224,116,47,0) 65%)", animation: "breathe 4s ease-in-out infinite" }} />
      <div key={step} style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: "-0.035em", fontSize: "clamp(32px, 5vw, 60px)", color: "#F4EFE6", textAlign: "center", padding: "0 24px", animation: `introReveal ${PER}ms cubic-bezier(0.22,1,0.36,1) both` }}>
        {body}{msg.endsWith(".") && <span style={{ color: EMBER }}>.</span>}
      </div>
      <button
        onClick={onDone}
        style={{ position: "absolute", bottom: 40, right: 48, background: "none", border: "1px solid rgba(244,239,230,0.14)", color: "rgba(244,239,230,0.45)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.2em", padding: "8px 14px", borderRadius: 999, cursor: "pointer" }}
      >
        PULAR
      </button>
    </div>
  );
}

const INTRO_KEY = "swell-intro-visto";

export default function StudioShell({ initialProjectId }: { initialProjectId?: string } = {}) {
  // A abertura é boas-vindas, não ritual: roda UMA vez por navegador.
  // Antes ela tocava a cada entrada — ~8s de espera pra quem usa o estúdio todo dia.
  // Ao reabrir um projeto salvo também pula, como já era.
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    if (initialProjectId) return;
    try {
      if (localStorage.getItem(INTRO_KEY)) return;
      localStorage.setItem(INTRO_KEY, "1");
      // setState no efeito é intencional aqui: só o navegador sabe se a pessoa já viu
      // a abertura. Ler no render quebraria o SSR (não existe localStorage no servidor)
      // e renderizar a intro no HTML do servidor daria mismatch de hidratação.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntro(true);
    } catch {
      // navegação anônima / storage bloqueado: segue sem abertura.
    }
  }, [initialProjectId]);

  function fecharIntro() {
    setIntro(false);
    try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* ignora */ }
  }

  return (
    <>
      {intro && <Intro onDone={fecharIntro} />}
      <PromptGenerator initialProjectId={initialProjectId} />
    </>
  );
}
