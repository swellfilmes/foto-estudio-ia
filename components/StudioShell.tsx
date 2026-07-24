"use client";

import { useState } from "react";
import PromptGenerator from "./PromptGenerator";
import EnsaioStudio from "./EnsaioStudio";

// Porta única: o estúdio abre direto no upload (comece enviando a foto).
// O Ensaio de Pessoa fica acessível por um link discreto dentro da tela inicial.
export default function StudioShell() {
  const [ensaio, setEnsaio] = useState(false);

  if (ensaio) {
    return <EnsaioStudio onBack={() => setEnsaio(false)} />;
  }
  return <PromptGenerator onEnsaio={() => setEnsaio(true)} />;
}
