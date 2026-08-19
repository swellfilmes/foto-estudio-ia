import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/access-token";

const SESSION_COOKIE = "swell-subscriber";

// Descobre o e-mail da pessoa logada a partir do cookie de sessão.
// O cookie guarda um TOKEN ASSINADO (JWT) — verificamos a assinatura antes de
// confiar no e-mail. Sem isso, qualquer um poderia forjar o cookie e se passar
// por outro usuário. Retorna null se o token for inválido/expirado/ausente.
export async function getSessionEmail(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const email = await verifySessionToken(token);
  return email ? email.toLowerCase() : null;
}
