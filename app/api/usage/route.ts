import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { getUsageContext } from "@/lib/db";

// GET — cota real do usuário logado: { plan, quota, used, remaining }.
// quota/remaining = null significa "sem trava" (ativo ainda sem plano mapeado).
export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email) return NextResponse.json({ email: null, plan: null, quota: null, used: 0, remaining: null });
  try {
    const usage = await getUsageContext(email);
    return NextResponse.json({ email, ...usage });
  } catch (e) {
    console.error("[usage] falhou:", e);
    // fail-open: em erro, não mostra trava (não bloqueia a pessoa)
    return NextResponse.json({ email, plan: null, quota: null, used: 0, remaining: null });
  }
}
