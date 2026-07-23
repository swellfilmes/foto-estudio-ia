import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "swell-subscriber";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

// Fallback dev-only: se SUBSCRIBER_PASSWORD não estiver setada, usa esta.
// Em produção, sempre setar via env var na Vercel.
const DEV_FALLBACK = "swell-assinantes-2026";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submitted = String(body?.password || "").trim();
    if (!submitted) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
    }

    const expected = process.env.SUBSCRIBER_PASSWORD || DEV_FALLBACK;
    if (submitted !== expected) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    // Fluxo legado — mantido por 30 dias após migração pra magic link.
    // Se você removeu a env `SUBSCRIBER_PASSWORD`, essa rota vira inútil (ok).
    console.warn("[subscriber-access] fluxo LEGADO usado. Migrar cliente pra /api/access/request.");

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: COOKIE_NAME,
      value: "ok",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    console.error("[subscriber-access]", e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
