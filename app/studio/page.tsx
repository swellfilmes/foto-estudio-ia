import StudioShell from "@/components/StudioShell";

// Header do estúdio (estilo protótipo "Maré"): marca à esquerda, selo + Sair à direita.
// Sticky, near-black translúcido com blur. Aparece só nas telas do estúdio (não na landing).
export default function StudioPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0908" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px clamp(20px, 4vw, 48px)",
          background: "rgba(10,9,8,0.72)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          borderBottom: "1px solid rgba(244,239,230,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div style={{ fontFamily: "'Archivo','Manrope',system-ui,sans-serif", fontWeight: 900, fontSize: 19, letterSpacing: "-0.02em", color: "#F4EFE6" }}>
            Swell<span style={{ color: "#E0742F" }}>.</span>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: "0.22em", color: "rgba(244,239,230,0.45)" }}>
            SWELL STUDIO
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(224,116,47,0.10)",
              border: "1px solid rgba(224,116,47,0.35)",
              color: "#E0742F",
              borderRadius: 999,
              padding: "7px 14px",
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10,
              letterSpacing: "0.16em",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0742F", display: "inline-block" }} />
            FEITO NA SWELL
          </div>
          <a
            href="/api/logout"
            title="Sair"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(244,239,230,0.05)",
              border: "1px solid rgba(244,239,230,0.14)",
              color: "rgba(244,239,230,0.7)",
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Hanken Grotesk',system-ui,sans-serif",
            }}
          >
            Sair ↪
          </a>
        </div>
      </header>

      <StudioShell />
    </div>
  );
}
