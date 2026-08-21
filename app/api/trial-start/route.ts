import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess, isOwner, upsertSubscriber } from "@/lib/db";
import { signSessionToken } from "@/lib/access-token";
import { track } from "@vercel/analytics/server";

// ── LOGIN INSTANTÂNEO (sem link mágico, sem trava de aparelho) ──
// Decisão de crescimento: menos atrito pra ter gente acessando. Digitou e-mail,
// já entra. A ÚNICA barreira que sobra é "e-mail já cadastrado" (teste esgotado):
// aí a gente não dá novo teste — empurra pro plano.
//
// Trade-off ACEITO: sem confirmação de e-mail e sem trava de device, a mesma
// pessoa pode pegar vários testes com e-mails diferentes. É proposital por ora.
const COOKIE_NAME = "swell-subscriber";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const TRIAL_DAYS = 7;

async function loginResponse(email: string) {
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set({
    name: COOKIE_NAME,
    value: await signSessionToken(email), // token assinado — não dá pra forjar
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    // Dono: entra sempre.
    if (isOwner(email)) return loginResponse(email);

    let existing = null;
    try {
      existing = await getSubscriber(email);
    } catch (e) {
      console.error("[trial-start] falha ao consultar assinante:", e);
    }

    if (existing) {
      // Assinante/teste AINDA válido → só loga de novo (voltar a entrar).
      if (hasActiveAccess(existing)) return loginResponse(email);
      // Teste esgotado/expirado → "já cadastrado", sem novo teste.
      return NextResponse.json({ status: "exists" });
    }

    // E-mail novo → cria o teste (7 dias) e já entra.
    try {
      await upsertSubscriber({
        email,
        name,
        status: "trial",
        source: String(body?.source || "instant-trial").trim(),
        trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      });
    } catch (e) {
      console.error("[trial-start] falha ao registrar trial:", e);
      return NextResponse.json({ error: "Não conseguimos liberar agora. Tente de novo." }, { status: 500 });
    }

    try { await track("signup_complete", { plan: "trial" }); } catch { /* analytics best-effort */ }
    return loginResponse(email);
  } catch (e) {
    console.error("[trial-start] erro:", e);
    return NextResponse.json({ error: "Não conseguimos entrar agora. Tente de novo em instantes." }, { status: 500 });
  }
}
