import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const COOKIE_NAME = "swell-lead";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

async function appendLead(entry: Record<string, unknown>) {
  try {
    await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
    let existing: Record<string, unknown>[] = [];
    try {
      const raw = await fs.readFile(LEADS_FILE, "utf-8");
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    existing.push(entry);
    await fs.writeFile(LEADS_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch (e) {
    // Vercel serverless tem FS efêmero — ignorar erro silenciosamente,
    // o console.log abaixo garante que o lead cai nos logs da Vercel.
    console.error("[lead] falha ao gravar leads.json (esperado em produção):", e);
  }
}

async function forwardToWebhook(entry: Record<string, unknown>) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (e) {
    console.error("[lead] falha ao enviar para webhook:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const source = String(body?.source || "landing").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const entry = {
      name,
      email,
      source,
      at: new Date().toISOString(),
      ua: req.headers.get("user-agent") || "",
      ref: req.headers.get("referer") || "",
    };

    console.log("[lead]", JSON.stringify(entry));
    await appendLead(entry);
    await forwardToWebhook(entry);

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: COOKIE_NAME,
      value: Buffer.from(email).toString("base64url"),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    console.error("[lead] erro:", e);
    return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
  }
}
