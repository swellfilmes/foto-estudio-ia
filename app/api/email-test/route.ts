import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/db";
import { sendTrialWelcome } from "@/lib/email";

// Diagnóstico de e-mail (Resend). Só envia pra e-mail de DONO — ninguém usa pra spam.
// Uso: /api/email-test?to=isatytre@gmail.com
export async function GET(req: NextRequest) {
  const to = (req.nextUrl.searchParams.get("to") || "").trim().toLowerCase();
  const hasKey = !!process.env.RESEND_API_KEY;
  const from = "acesso@swellai.studio";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "(não setada)";

  if (!to || !isOwner(to)) {
    return NextResponse.json({
      ok: false,
      hasResendKey: hasKey,
      from,
      siteUrl,
      note: "Passe ?to=<seu e-mail de dono> pra testar o envio de verdade (ex.: ?to=isatytre@gmail.com).",
    });
  }

  try {
    await sendTrialWelcome({ email: to, name: null });
    return NextResponse.json({ ok: true, hasResendKey: hasKey, from, to, message: "Enviado! Confira a caixa (e o spam)." });
  } catch (e) {
    // Devolve o erro REAL do Resend — é aqui que aparece 'domínio não verificado', 'key inválida', etc.
    return NextResponse.json({
      ok: false,
      hasResendKey: hasKey,
      from,
      to,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
