"use client";

import { useState, useEffect } from "react";
import PromptGenerator from "./PromptGenerator";
import EnsaioStudio from "./EnsaioStudio";

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

export default function StudioShell({ initialProjectId }: { initialProjectId?: string } = {}) {
  // Ao reabrir um projeto, pula a animação de abertura e vai direto pro estúdio.
  const [intro, setIntro] = useState(!initialProjectId);
  const [ensaio, setEnsaio] = useState(false);

  return (
    <>
      {intro && <Intro onDone={() => setIntro(false)} />}
      {ensaio ? (
        <EnsaioStudio onBack={() => setEnsaio(false)} />
      ) : (
        <PromptGenerator onEnsaio={() => setEnsaio(true)} initialProjectId={initialProjectId} />
      )}
    </>
  );
}
