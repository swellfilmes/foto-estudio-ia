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
  const owner = await getSessionEmail(req);
  const ok = (owner && isOwner(owner)) || isAdminKey(req.nextUrl.searchParams.get("key"));
  if (!ok) {
    return NextResponse.json({ error: "acesso restrito — logue como dono ou adicione &key=<sua-chave>." }, { status: 403 });
  }

  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "passe ?email=<e-mail válido> e ?plan=simples|medio|grande OU ?quota=<n>" }, { status: 400 });
  }

  // Quota custom (cortesia): ?quota=30. Senão, usa um plano fixo.
  const quotaParam = req.nextUrl.searchParams.get("quota");
  const customQuota = quotaParam != null && quotaParam !== "" && Number.isFinite(Number(quotaParam))
    ? Math.max(0, Math.floor(Number(quotaParam)))
    : null;

  let plan: string;
  let quota: number;
  if (customQuota != null) {
    plan = "cortesia";
    quota = customQuota;
  } else {
    const planParam = (req.nextUrl.searchParams.get("plan") || "medio").trim().toLowerCase();
    const p = PLAN_ALIAS[planParam];
    if (!p) {
      return NextResponse.json({ error: "plano inválido — use simples, medio, grande, ou ?quota=<n>" }, { status: 400 });
    }
    plan = p;
    quota = PLAN_QUOTAS[p];
  }

  try {
    await upsertSubscriber({
      email,
      status: "active",
      source: "manual-dono",
      plan,
      photo_quota: quota,
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const sub = await getSubscriber(email);
    return NextResponse.json({
      ok: true,
      ativado: email,
      plano: plan,
      cotaFotos: quota,
      temAcessoAtivo: hasActiveAccess(sub),
      registro: sub,
      proximo: `Agora ${email} pode entrar em swellai.studio → Entrar (recebe o link mágico).`,
    });
  } catch (e) {
    console.error("[admin/activate] falhou:", e);
    return NextResponse.json({ error: "erro ao ativar" }, { status: 500 });
  }
}
