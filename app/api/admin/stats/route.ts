import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { isOwner, getSubscriberStats } from "@/lib/db";

// Painel de dono — números do negócio. Só o e-mail de dono (logado) enxerga.
export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email || !isOwner(email)) {
    return NextResponse.json(
      { error: "acesso restrito ao dono — entre no app com o e-mail de dono e recarregue esta página." },
      { status: 403 }
    );
  }
  try {
    const stats = await getSubscriberStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("[admin/stats] falhou:", e);
    return NextResponse.json({ error: "erro ao ler o banco" }, { status: 500 });
  }
}
