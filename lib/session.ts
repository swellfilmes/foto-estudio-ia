import type { NextRequest } from "next/server";

// Descobre o e-mail da pessoa logada a partir dos cookies de sessão.
// Ambos guardam o e-mail em base64url: swell-subscriber (assinante) e swell-lead (teste).
function decodeEmail(v?: string): string | null {
  if (!v) return null;
  try {
    const s = Buffer.from(v, "base64url").toString("utf-8").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
  } catch {
    return null;
  }
}

export function getSessionEmail(req: NextRequest): string | null {
  return (
    decodeEmail(req.cookies.get("swell-subscriber")?.value) ||
    decodeEmail(req.cookies.get("swell-lead")?.value)
  );
}
