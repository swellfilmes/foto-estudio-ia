import { NextRequest, NextResponse } from "next/server";
import { promises as dnsp } from "dns";
import { getSubscriber, hasActiveAccess, isOwner, upsertSubscriber } from "@/lib/db";
import { signSessionToken } from "@/lib/access-token";
import { track } from "@vercel/analytics/server";

// Domínios de e-mail descartável/temporário — não valem pra teste grátis.
const DISPOSABLE = new Set([
  "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "throwawaymail.com",
  "maildrop.cc", "fakeinbox.com", "dispostable.com", "mailnesia.com", "mytemp.email",
  "moakt.com", "tempr.email", "emailondeck.com", "mohmal.com", "mailcatch.com",
  "spam4.me", "grr.la", "guerrillamail.info", "tempmailo.com", "luxusmail.org",
]);

// Corre uma promessa com prazo. No estouro, devolve o fallback (fail-open: não
// bloqueia usuário real por causa de DNS lento).
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
}

// O domínio consegue RECEBER e-mail? true = tem MX (ou A) → existe.
// false = domínio claramente inexistente (NXDOMAIN/sem registro). Erro transitório → libera.
async function domainCanReceiveMail(domain: string): Promise<boolean> {
  try {
    const mx = await dnsp.resolveMx(domain);
    if (mx && mx.length) return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code !== "ENOTFOUND" && code !== "ENODATA") return true; // transitório → não bloqueia
  }
  try {
    const a = await dnsp.resolve(domain); // alguns domínios recebem sem MX
    return !!(a && a.length);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") return false; // não existe
    return true; // transitório → libera
  }
}

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

    // E-mail novo → antes de liberar, confere que o e-mail é PLAUSÍVEL (sem mandar nada):
    // barra descartáveis e domínios que não existem de verdade.
    const domain = email.split("@")[1] || "";
    if (DISPOSABLE.has(domain)) {
      return NextResponse.json({ error: "Use um e-mail pessoal ou da empresa — e-mail temporário não vale." }, { status: 400 });
    }
    const reachable = await withTimeout(domainCanReceiveMail(domain), 3000, true);
    if (!reachable) {
      return NextResponse.json({ error: "Esse e-mail parece inválido. Confira o endereço e tente de novo." }, { status: 400 });
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
