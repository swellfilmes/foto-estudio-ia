import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isOwner, getSubscriberStats, getSubscriber, hasActiveAccess } from "@/lib/db";

// Painel de dono — números do negócio. Só o e-mail de dono (logado) enxerga.
export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email || !isOwner(email)) {
    return NextResponse.json(
      { error: "acesso restrito ao dono — entre no app com o e-mail de dono e recarregue esta página." },
      { status: 403 }
    );
  }
  // Busca um e-mail específico: /api/admin/stats?email=fulano@x.com
  const lookup = req.nextUrl.searchParams.get("email");
  if (lookup) {
    try {
      const alvo = lookup.trim().toLowerCase();
      const sub = await getSubscriber(alvo);
      return NextResponse.json({
        ok: true,
        buscado: alvo,
        encontrado: !!sub,
        status: sub?.status ?? null,
        plano: sub?.plan ?? null,
        cotaFotos: sub?.photo_quota ?? null,
        temAcessoAtivo: hasActiveAccess(sub),
        consegueLogar: hasActiveAccess(sub) || isOwner(alvo),
        registro: sub,
      });
    } catch (e) {
      console.error("[admin/stats] lookup falhou:", e);
      return NextResponse.json({ error: "erro ao buscar e-mail" }, { status: 500 });
    }
  }

  try {
    const stats = await getSubscriberStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("[admin/stats] falhou:", e);
    return NextResponse.json({ error: "erro ao ler o banco" }, { status: 500 });
  }
}
