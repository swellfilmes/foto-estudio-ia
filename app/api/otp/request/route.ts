import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, hasActiveAccess, isOwner } from "@/lib/db";
import { validateEmail } from "@/lib/email-validate";
import { generateCode, hashCode, signOtpToken } from "@/lib/otp";
import { sendOtpCode } from "@/lib/email";

// Passo 1 do login: manda um código de 6 dígitos pro e-mail. Devolve um TOKEN
// (com o hash do código) que o cliente guarda pra conferir no passo 2.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    // Já cadastrado e esgotado → não manda código, empurra pro plano.
    if (!isOwner(email)) {
      let existing = null;
      try { existing = await getSubscriber(email); } catch (e) { console.error("[otp/request] getSubscriber:", e); }
      if (existing && !hasActiveAccess(existing)) {
        return NextResponse.json({ status: "exists" });
      }
    }

    // Valida o e-mail (sintaxe + descartável + domínio existe) antes de mandar.
    const v = await validateEmail(email);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const code = generateCode();
    const token = await signOtpToken({ email, name, codeHash: hashCode(email, code) });

    try {
      await sendOtpCode({ email, code, name });
    } catch (e) {
      console.error("[otp/request] falha ao enviar código:", e);
      return NextResponse.json({ error: "Não conseguimos enviar o código agora. Tente de novo." }, { status: 502 });
    }

    return NextResponse.json({ status: "sent", token });
  } catch (e) {
    console.error("[otp/request] erro:", e);
    return NextResponse.json({ error: "Não conseguimos enviar o código agora." }, { status: 500 });
  }
}
