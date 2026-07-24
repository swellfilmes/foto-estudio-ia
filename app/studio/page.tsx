import StudioShell from "@/components/StudioShell";

export default function StudioPage() {
  return (
    <div style={{ position: "relative" }}>
      <a
        href="/api/logout"
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          zIndex: 10,
          fontSize: 12,
          color: "var(--text-muted)",
          textDecoration: "none",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "6px 12px",
        }}
      >
        Sair
      </a>
      <StudioShell />
    </div>
  );
}
