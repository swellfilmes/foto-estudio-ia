import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isOwner, isAdminKey, upsertSubscriber, getSubscriber, hasActiveAccess, PLAN_QUOTAS } from "@/lib/db";

// Ativa um assinante NA MÃO (só dono). Rede de segurança: se a compra não caiu pelo
// webhook, o dono libera o acesso na hora. Também serve pra cortesias/testers.
// Uso (logado como dono): /api/admin/activate?email=fulano@x.com&plan=medio
const PLAN_ALIAS: Record<string, "essencial" | "pro" | "marca"> = {
  simples: "essencial", essencial: "essencial",
  medio: "pro", "médio": "pro", pro: "pro",
  grande: "marca", marca: "marca",
};

export async function GET(req: NextRequest) {
  const owner = getSessionEmail(req);
  const ok = (owner && isOwner(owner)) || isAdminKey(req.nextUrl.searchParams.get("key"));
  if (!ok) {
    return NextResponse.json({ error: "acesso restrito — logue como dono ou adicione &key=<sua-chave>." }, { status: 403 });
  }

  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  const planParam = (req.nextUrl.searchParams.get("plan") || "medio").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "passe ?email=<e-mail válido>&plan=simples|medio|grande" }, { status: 400 });
  }
  const plan = PLAN_ALIAS[planParam];
  if (!plan) {
    return NextResponse.json({ error: "plano inválido — use simples, medio ou grande" }, { status: 400 });
  }

  try {
    await upsertSubscriber({
      email,
      status: "active",
      source: "manual-dono",
      plan,
      photo_quota: PLAN_QUOTAS[plan],
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const sub = await getSubscriber(email);
    return NextResponse.json({
      ok: true,
      ativado: email,
      plano: plan,
      cotaFotos: PLAN_QUOTAS[plan],
      temAcessoAtivo: hasActiveAccess(sub),
      registro: sub,
      proximo: `Agora ${email} pode entrar em swellai.studio → Entrar (recebe o link mágico).`,
    });
  } catch (e) {
    console.error("[admin/activate] falhou:", e);
    return NextResponse.json({ error: "erro ao ativar" }, { status: 500 });
  }
}
