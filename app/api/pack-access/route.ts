import { NextRequest, NextResponse } from "next/server";
import { PACK_PASSWORDS, PackSlug } from "@/lib/pack-prompts";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 dias

function cookieName(slug: PackSlug) {
  return `swell-pack-${slug}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body?.slug || "") as PackSlug;
    const password = String(body?.password || "").trim();

    if (!(slug in PACK_PASSWORDS)) {
      return NextResponse.json({ error: "Pack inválido" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
    }

    const expected = PACK_PASSWORDS[slug];
    if (password !== expected) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, slug });
    res.cookies.set({
      name: cookieName(slug),
      value: "ok",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    console.error("[pack-access]", e);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
