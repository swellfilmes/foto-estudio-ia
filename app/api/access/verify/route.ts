import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess, isOwner } from "@/lib/db";
import { verifyAccessToken, signSessionToken } from "@/lib/access-token";
import { track } from "@vercel/analytics/server";

const COOKIE_NAME = "swell-subscriber";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
// Marca o aparelho que reivindicou um teste grátis (1 teste por device).
const TRIAL_DEVICE_COOKIE = "swell-trial";
const TRIAL_DEVICE_MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

function decodeDeviceEmail(req: NextRequest): string | null {
  const raw = req.cookies.get(TRIAL_DEVICE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return Buffer.from(raw, "base64url").toString("utf8").toLowerCase() || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const next = url.searchParams.get("next") || "/studio";

  const email = await verifyAccessToken(token);
  if (!email) {
    return redirectWithMsg(req, "link-invalido");
  }

  const sub = await getSubscriber(email);
  if (!hasActiveAccess(sub) && !isOwner(email)) {
    return redirectWithMsg(req, "acesso-expirado");
  }

  const isTrial = sub?.status === "trial" && !isOwner(email);

  // Trava por aparelho: se este device já reivindicou um teste com OUTRO e-mail,
  // não deixa liberar um segundo teste aqui (fecha a brecha de pedir 2 links antes de confirmar).
  if (isTrial) {
    const deviceEmail = decodeDeviceEmail(req);
    if (deviceEmail && deviceEmail !== email.toLowerCase()) {
      return redirectWithMsg(req, "teste-ja-usado");
    }
  }

  const dest = new URL(next.startsWith("/") ? next : "/studio", req.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set({
    name: COOKIE_NAME,
    value: await signSessionToken(email), // token ASSINADO — não dá pra forjar a sessão
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  // Ao liberar um teste, carimba o aparelho (impede novo teste com outro e-mail nesse device).
  if (isTrial) {
    res.cookies.set({
      name: TRIAL_DEVICE_COOKIE,
      value: Buffer.from(email.toLowerCase()).toString("base64url"),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TRIAL_DEVICE_MAX_AGE,
    });
    try { await track("signup_complete", { plan: "trial" }); } catch { /* analytics best-effort */ }
  }
  return res;
}

function redirectWithMsg(req: NextRequest, code: string) {
  const url = new URL("/entrar", req.url);
  url.searchParams.set("erro", code);
  return NextResponse.redirect(url);
}
