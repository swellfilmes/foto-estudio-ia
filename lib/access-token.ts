import { SignJWT, jwtVerify } from "jose";

const ISSUER = "swell-lens";
const AUDIENCE = "swell-lens-access";
const TTL_SECONDS = 15 * 60; // 15 min

function secret() {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 24) {
    throw new Error(
      "JWT_SECRET ausente ou fraca (>=24 chars). Gere com `openssl rand -base64 48` e setar na Vercel."
    );
  }
  return new TextEncoder().encode(raw);
}

export async function signAccessToken(email: string): Promise<string> {
  return await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const email = typeof payload.email === "string" ? payload.email : null;
    return email;
  } catch {
    return null;
  }
}

// ── Token de SESSÃO (cookie de "quem é você") ────────────────────────────────
// Diferente do magic link: vale 30 dias e tem audience própria. É ASSINADO —
// impede forjar o cookie de sessão e se passar por outro usuário.
const SESSION_AUDIENCE = "swell-lens-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export async function signSessionToken(email: string): Promise<string> {
  return await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
