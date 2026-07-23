"use client";

import { useState, useEffect } from "react";
import { PACK_LABELS, PackSlug } from "@/lib/pack-prompts";
import { PackGate } from "./PackGate";
import { PackChatGPT } from "./PackChatGPT";
import { PackNanoBanana } from "./PackNanoBanana";

export default function PackShell({ slug }: { slug: PackSlug }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Se já tem o cookie do pack, tenta o modo autenticado direto.
    // Como o cookie é HttpOnly, não conseguimos ler pelo JS — então a gente
    // faz uma chamada leve pro endpoint que retorna true se o cookie existe.
    fetch(`/api/pack-check?slug=${slug}`, { method: "GET" })
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, [slug]);

  if (authed === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <PackGate
        slug={slug}
        packLabel={PACK_LABELS[slug]}
        onSuccess={() => setAuthed(true)}
      />
    );
  }

  return slug === "chatgpt" ? <PackChatGPT /> : <PackNanoBanana />;
}
