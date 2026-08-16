import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess, isOwner } from "@/lib/db";
import { verifyAccessToken } from "@/lib/access-token";

const COOKIE_NAME = "swell-subscriber";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

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

  const dest = new URL(next.startsWith("/") ? next : "/studio", req.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set({
    name: COOKIE_NAME,
    value: Buffer.from(email).toString("base64url"), // guarda o e-mail p/ histórico por usuário
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

function redirectWithMsg(req: NextRequest, code: string) {
  const url = new URL("/entrar", req.url);
  url.searchParams.set("erro", code);
  return NextResponse.redirect(url);
}
