import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess, isOwner, upsertSubscriber } from "@/lib/db";
import { signSessionToken } from "@/lib/access-token";
import { verifyOtpToken, hashCode } from "@/lib/otp";
import { track } from "@vercel/analytics/server";

// Passo 2 do login: confere o código. Se bater, cria o teste (se novo) e ASSINA
// a sessão (cookie). O e-mail está garantido — só chega aqui quem recebeu o código.
const COOKIE_NAME = "swell-subscriber";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const TRIAL_DAYS = 7;

async function loginResponse(email: string) {
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set({
    name: COOKIE_NAME,
    value: await signSessionToken(email),
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
    const token = String(body?.token || "");
    const code = String(body?.code || "").trim();

    const data = await verifyOtpToken(token);
    if (!data) return NextResponse.json({ error: "Código expirado. Peça um novo." }, { status: 400 });
    if (!/^\d{6}$/.test(code) || hashCode(data.email, code) !== data.codeHash) {
      return NextResponse.json({ error: "Código incorreto." }, { status: 400 });
    }

    const email = data.email;
    if (isOwner(email)) return loginResponse(email);

    let existing = null;
    try { existing = await getSubscriber(email); } catch (e) { console.error("[otp/verify] getSubscriber:", e); }
    if (existing) {
      if (hasActiveAccess(existing)) return loginResponse(email);
      return NextResponse.json({ status: "exists" });
    }

    // Novo → cria o teste (7 dias) e loga.
    try {
      await upsertSubscriber({
        email, name: data.name, status: "trial", source: "otp-trial",
        trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86400000),
      });
    } catch (e) {
      console.error("[otp/verify] upsert:", e);
      return NextResponse.json({ error: "Não conseguimos liberar agora. Tente de novo." }, { status: 500 });
    }
    try { await track("signup_complete", { plan: "trial" }); } catch { /* best-effort */ }
    return loginResponse(email);
  } catch (e) {
    console.error("[otp/verify] erro:", e);
    return NextResponse.json({ error: "Não conseguimos entrar agora." }, { status: 500 });
  }
}
