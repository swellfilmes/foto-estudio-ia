import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { upsertSubscriber, getSubscriber, hasActiveAccess, isOwner } from "@/lib/db";
import { signAccessToken } from "@/lib/access-token";
import { sendTrialAccessLink } from "@/lib/email";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");
const TRIAL_DAYS = 7;
// Cookie de aparelho: marca "este device já reivindicou um teste" (setado no /verify).
const TRIAL_DEVICE_COOKIE = "swell-trial";

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
    // Vercel serverless tem FS efêmero — ignorar; o console.log garante o log.
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

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function decodeDeviceEmail(req: NextRequest): string | null {
  const raw = req.cookies.get(TRIAL_DEVICE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return Buffer.from(raw, "base64url").toString("utf8").toLowerCase() || null;
  } catch {
    return null;
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
      name, email, source,
      at: new Date().toISOString(),
      ua: req.headers.get("user-agent") || "",
      ref: req.headers.get("referer") || "",
    };
    console.log("[lead]", JSON.stringify(entry));
    await appendLead(entry);
    await forwardToWebhook(entry);

    // Envia o link mágico (confirma o e-mail e libera o acesso). Falha aqui é erro real.
    const sendLink = async (to: string, who: string | null) => {
      const token = await signAccessToken(to);
      const link = `${baseUrl(req)}/api/access/verify?token=${encodeURIComponent(token)}&next=/studio`;
      await sendTrialAccessLink({ email: to, link, name: who });
    };

    const owner = isOwner(email);

    // Dono: sempre manda o link, sem criar trial nem checar aparelho.
    if (owner) {
      await sendLink(email, name || null);
      return NextResponse.json({ ok: true, status: "sent" });
    }

    let existing = null;
    try {
      existing = await getSubscriber(email);
    } catch (e) {
      console.error("[lead] falha ao consultar assinante:", e);
    }

    // Já existe cadastro nesse e-mail:
    if (existing) {
      if (hasActiveAccess(existing)) {
        // Assinante/teste ainda válido → reenvia o link de acesso (voltar a entrar).
        await sendLink(email, existing.name || name || null);
        return NextResponse.json({ ok: true, status: "sent" });
      }
      // Teste já expirado / cancelado → não dá novo teste. Empurra pro plano.
      return NextResponse.json({
        ok: true,
        status: "blocked",
        reason: "used",
        message: "Você já testou com esse e-mail. Pra continuar, escolha um plano — a partir de R$79,90.",
      });
    }

    // E-mail novo → trava por aparelho: se este device já reivindicou um teste
    // (com outro e-mail), não libera outro.
    const deviceEmail = decodeDeviceEmail(req);
    if (deviceEmail && deviceEmail !== email) {
      return NextResponse.json({
        ok: true,
        status: "blocked",
        reason: "device",
        message: "Este aparelho já usou o teste grátis. Entre com o e-mail que você usou, ou escolha um plano.",
      });
    }

    // Cria o trial (7 dias) e manda o link de confirmação.
    try {
      await upsertSubscriber({
        email,
        name: name || null,
        status: "trial",
        source: source || "landing-trial",
        trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      });
    } catch (e) {
      console.error("[lead] falha ao registrar trial em subscribers:", e);
    }

    await sendLink(email, name || null);
    return NextResponse.json({ ok: true, status: "sent" });
  } catch (e) {
    console.error("[lead] erro:", e);
    return NextResponse.json({ error: "Não conseguimos enviar agora. Tente de novo em instantes." }, { status: 500 });
  }
}
