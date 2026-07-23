import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess } from "@/lib/db";
import { signAccessToken } from "@/lib/access-token";
import { sendMagicLink } from "@/lib/email";

// Rate limit simples in-memory (por IP) — reinicia a cada cold start.
// Suficiente pra desestimular flood; se abusarem sério, migramos pra KV.
const HITS = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function ipOf(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = HITS.get(ip);
  if (!entry || entry.resetAt < now) {
    HITS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PER_WINDOW;
}

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: NextRequest) {
  const ip = ipOf(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas tentativas, tente daqui 1 minuto" }, { status: 429 });
  }

  let email: string;
  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const sub = await getSubscriber(email);

  // Resposta uniforme mesmo quando não existe/expirado: evita enumeração de e-mails.
  // Mas só disparamos e-mail se tiver acesso válido.
  if (hasActiveAccess(sub)) {
    try {
      const token = await signAccessToken(email);
      const link = `${baseUrl(req)}/api/access/verify?token=${encodeURIComponent(token)}`;
      await sendMagicLink({ email, link, name: sub?.name ?? null });
    } catch (e) {
      console.error("[access/request] erro ao enviar magic link:", e);
      return NextResponse.json({ error: "Falha ao enviar e-mail" }, { status: 500 });
    }
  } else {
    console.log("[access/request] sem acesso ativo para", email, "status:", sub?.status ?? "none");
  }

  return NextResponse.json({ ok: true });
}
