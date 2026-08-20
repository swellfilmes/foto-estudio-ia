import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/access-token";

const SESSION_COOKIE = "swell-subscriber";

// Portão do /studio e /galeria: só passa quem tem um cookie de sessão com
// ASSINATURA VÁLIDA. Antes bastava o cookie existir (forjável) — agora o token
// é verificado; cookie inválido/expirado/forjado é tratado como "sem sessão".
export async function proxy(request: NextRequest) {
  // SANDBOX (branch de teste): libera /studio sem login, com ?sandbox=1 ou cookie.
  // Só existe nesta branch — NÃO vai pra produção.
  const sb = request.nextUrl.searchParams.get("sandbox");
  if (sb === "1" || (sb !== "0" && request.cookies.get("swl-sandbox")?.value === "1")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const email = token ? await verifySessionToken(token) : null;
  if (!email) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*", "/galeria/:path*"],
};
