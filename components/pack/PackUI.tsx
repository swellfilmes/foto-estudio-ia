"use client";

import { useState, ReactNode } from "react";

// ── Callout ──────────────────────────────────────────────────────────────────

type CalloutVariant = "orange" | "red" | "blue" | "green";

const CALLOUT_STYLES: Record<CalloutVariant, { bg: string; border: string; color: string; label: string }> = {
  orange: { bg: "#1c1500", border: "#5c3d00", color: "#fcd34d", label: "Comece aqui" },
  red:    { bg: "#2d1212", border: "#5c1a1a", color: "#f87171", label: "Erro comum" },
  blue:   { bg: "#0e1a2a", border: "#1e3a5c", color: "#7dd3fc", label: "Dica" },
  green:  { bg: "#0e2018", border: "#1e4a3a", color: "#4ade80", label: "Nota" },
};

export function CalloutBox({ variant, title, children }: { variant: CalloutVariant; title?: string; children: ReactNode }) {
  const s = CALLOUT_STYLES[variant];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16, margin: "16px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: s.color, marginBottom: 8 }}>
        {title || s.label}
      </div>
      <div style={{ fontSize: 14, color: s.color, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────

export function CopyButton({ text, label = "Copiar", big }: { text: string; label?: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        background: copied ? "#166534" : "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: big ? 10 : 6,
        padding: big ? "16px 20px" : "8px 14px",
        fontSize: big ? 15 : 13,
        fontWeight: 700,
        cursor: "pointer",
        width: big ? "100%" : undefined,
      }}
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}

// ── Prompt block com botão copiar ────────────────────────────────────────────

export function CopyPromptBlock({ prompt, title }: { prompt: string; title?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, margin: "16px 0" }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>
          {title}
        </div>
      )}
      <pre style={{
        fontSize: 12,
        lineHeight: 1.7,
        color: "var(--text)",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        margin: 0,
        marginBottom: 12,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        background: "var(--surface2)",
        padding: 12,
        borderRadius: 6,
        maxHeight: 200,
        overflow: "auto",
      }}>{prompt}</pre>
      <CopyButton text={prompt} label="Copiar prompt em inglês" big />
    </div>
  );
}

// ── Toggle (colapsável) ──────────────────────────────────────────────────────

export function Toggle({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "16px 0",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--text)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▶</span>
      </button>
      {open && <div style={{ paddingBottom: 20 }}>{children}</div>}
    </div>
  );
}

// ── Simple table (para os slots dos prompts) ────────────────────────────────

export function SlotTable({ slots }: { slots: { key: string; what: string; example: string }[] }) {
  return (
    <div style={{ overflow: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>Slot</th>
            <th style={thStyle}>O que colocar</th>
            <th style={thStyle}>Exemplo</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s, i) => (
            <tr key={i}>
              <td style={tdStyle}><code style={codeChip}>{s.key}</code></td>
              <td style={tdStyle}>{s.what}</td>
              <td style={{ ...tdStyle, color: "var(--text-muted)", fontFamily: "monospace", fontSize: 11 }}>{s.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--border)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 10px",
  color: "var(--text)",
  verticalAlign: "top",
  borderBottom: "1px solid var(--border)",
};

const codeChip: React.CSSProperties = {
  background: "var(--surface2)",
  color: "var(--accent)",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "monospace",
  whiteSpace: "nowrap",
};

// ── Header do pack ───────────────────────────────────────────────────────────

export function PackHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
        {label}
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1.15 }}>{title}</h1>
      <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 40, marginBottom: 16, borderTop: "1px solid var(--border)", paddingTop: 40 }}>
      {children}
    </h2>
  );
}

// ── Subheading ───────────────────────────────────────────────────────────────

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginTop: 24, marginBottom: 8 }}>
      {children}
    </h3>
  );
}

// ── Prose paragraph ──────────────────────────────────────────────────────────

export function P({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7, margin: "12px 0" }}>{children}</p>;
}

// ── Checklist ───────────────────────────────────────────────────────────────

export function Checklist({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 14, color: "var(--text)", padding: "6px 0", display: "flex", gap: 10 }}>
          <span style={{ color: "var(--accent)", flexShrink: 0 }}>▸</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
