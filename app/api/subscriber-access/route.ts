import { NextResponse } from "next/server";

// DESATIVADO. Este era um login por SENHA COMPARTILHADA que setava um cookie de
// sessão não-assinado — um backdoor. O acesso agora é só por link mágico
// (/api/access/request → /api/access/verify), com cookie de sessão ASSINADO.
export async function POST() {
  return NextResponse.json(
    { error: "Login por senha foi desativado. Entre pelo link de acesso em /entrar." },
    { status: 410 }
  );
}
