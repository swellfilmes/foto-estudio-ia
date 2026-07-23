"use client";

import { useState, useEffect } from "react";
import type { PackSlug } from "@/lib/pack-prompts";

export function PackGate({ slug, packLabel, onSuccess }: { slug: PackSlug; packLabel: string; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-validate via ?p= na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pass = params.get("p");
    if (pass) {
      // limpa a URL antes de qualquer coisa (não deixar senha no histórico)
      const url = new URL(window.location.href);
      url.searchParams.delete("p");
      window.history.replaceState({}, "", url.toString());
      submit(pass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(pass: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pack-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
          Swell Filmes
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{packLabel}</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
          Você recebeu esta senha no e-mail de confirmação da compra. Cole ela aqui pra abrir o pack.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(password); }}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}
        >
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Senha do pack</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="text"
            autoComplete="off"
            placeholder="Cole a senha do e-mail"
            style={{
              width: "100%",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 14px",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
          {error && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#2d1212", border: "1px solid #5c1a1a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error === "Senha incorreta" ? "Senha incorreta — confira no e-mail da compra." : error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !password.trim()}
            style={{
              width: "100%",
              marginTop: 16,
              background: submitting || !password.trim() ? "var(--surface2)" : "var(--accent)",
              color: submitting || !password.trim() ? "var(--text-muted)" : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "13px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: submitting || !password.trim() ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Verificando…" : "Abrir pack →"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 20, textAlign: "center", lineHeight: 1.6 }}>
          Não encontrou a senha? Confira o e-mail com assunto "Seu Pack Foto Estúdio IA". Se ainda tiver problema, escreve pra <a href="mailto:contato@swellfilmes.com.br" style={{ color: "var(--accent)" }}>contato@swellfilmes.com.br</a>.
        </p>
      </div>
    </div>
  );
}
